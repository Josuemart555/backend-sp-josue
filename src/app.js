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

    // Configurar CORS UNA sola vez con preflight
    const allowedOrigins = (
        process.env.CORS_ORIGIN
            ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()).filter(Boolean)
            : [
                process.env.FRONTEND_ORIGIN,
                process.env.SWAGGER_ORIGIN,
                'http://localhost:3000',
                'http://localhost:4200',
                'http://127.0.0.1:3000',
            ].filter(Boolean)
    );

    const corsOptions = {
        origin: function (origin, callback) {
            if (!origin) return callback(null, true); // curl/healthchecks
            if (allowedOrigins.length === 0) return callback(null, true); // sin lista -> permitir todos
            if (allowedOrigins.includes(origin)) return callback(null, true);
            return callback(new Error('Origen no permitido por CORS: ' + origin));
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        exposedHeaders: ['Authorization', 'X-Auth-Token'],
        maxAge: 86400,
    };

    app.use(cors(corsOptions));

    app.use((req, res, next) => {
        if (req.method === 'OPTIONS') {
            return res.sendStatus(204);
        }
        next();
    });

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