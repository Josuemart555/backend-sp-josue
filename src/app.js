const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./docs/swagger');
const libroRoutes = require('./routes/libros.routes');
const { getPool } = require('./utils/mssql');

async function createServer() {
    const app = express();

    app.use(helmet());
    app.use(morgan('dev'));
    app.use(express.json());

    // Confía en el proxy de Azure para detectar correctamente req.protocol = 'https'
    app.set('trust proxy', true);

    // Construir whitelist desde env (opcional)
    const envList = []
        .concat(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [])
        .concat(process.env.FRONTEND_ORIGIN ? [process.env.FRONTEND_ORIGIN] : [])
        .concat(process.env.SWAGGER_ORIGIN ? [process.env.SWAGGER_ORIGIN] : [])
        .map(s => (s || '').trim())
        .filter(Boolean);
    const allowedOrigins = Array.from(new Set(envList)); // únicos

    // Delegado dinámico de CORS: permite same-origin y whitelist
    const corsDelegate = (req, callback) => {
        const requestOrigin = req.headers.origin; // ej: https://backend-...azurewebsites.net
        const selfOrigin = `${req.protocol}://${req.get('host')}`;

        let allow = false;
        if (!requestOrigin) {
            // curl/health checks, etc.
            allow = true;
        } else if (requestOrigin === selfOrigin) {
            // SIEMPRE permitir same-origin (Swagger UI en el mismo backend)
            allow = true;
        } else if (allowedOrigins.length === 0) {
            // Si no configuraste lista, permite todos (opcional: cámbialo a false si quieres restringir)
            allow = true;
        } else if (allowedOrigins.includes(requestOrigin)) {
            allow = true;
        }

        const options = {
            origin: allow,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
            exposedHeaders: ['Authorization', 'X-Auth-Token'],
            maxAge: 86400,
        };
        callback(null, options);
    };

    app.use(cors(corsDelegate));
    app.options(/.*/, cors(corsDelegate));

    // Redirige a HTTPS en producción (opcional)
    if (process.env.NODE_ENV === 'production') {
        app.use((req, res, next) => {
            if (req.secure) return next();
            if (req.get('x-forwarded-proto') === 'https') return next();
            return res.redirect(`https://${req.get('host')}${req.originalUrl}`);
        });
    }

    if (typeof BigInt.prototype.toJSON !== 'function') {
        BigInt.prototype.toJSON = function () { return this.toString(); };
    }

    // Swagger UI servirá el JSON dinámico desde /api/docs.json
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(null, { swaggerUrl: '/api/docs.json' }));
    app.get('/api/docs.json', (req, res) => {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const spec = { ...swaggerSpec, servers: [{ url: baseUrl }] };
        res.json(spec);
    });

    app.get('/health', async (req, res) => {
        try {
            const pool = await getPool();
            await pool.request().query('SELECT 1 AS ok');
            res.json({ status: 'ok', db: 'up' });
        } catch {
            res.status(503).json({ status: 'ok', db: 'down' });
        }
    });

    app.use('/api/libros', libroRoutes);

    // Manejador global de errores (JSON + log)
    app.use((err, req, res, next) => {
        console.error('[API ERROR]', {
            method: req.method,
            url: req.originalUrl,
            message: err?.message,
            stack: err?.stack,
        });
        const status = err.status || err.statusCode || 500;
        res.status(status).json({ message: err?.message || 'Internal Server Error' });
    });

    return app;
}

module.exports = { createServer };