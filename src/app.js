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
    app.use(cors({
        origin: process.env.CORS_ORIGIN?.split(',') || '*',
        credentials: true
    }));
    app.use(express.json());
    app.use(morgan('dev'));

    // Confía en el proxy de Azure para detectar correctamente req.protocol = 'https'
    app.set('trust proxy', true);

    const allowedOrigins = [
        process.env.FRONTEND_ORIGIN,
        process.env.SWAGGER_ORIGIN,
        'http://localhost:3000',
        'http://localhost:4200',
        'http://127.0.0.1:3000',
    ].filter(Boolean);

    app.use(cors({
        origin: function (origin, callback) {
            // Permitir solicitudes sin origin (p. ej., curl/healthchecks)
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin)) return callback(null, true);
            return callback(new Error('Origen no permitido por CORS: ' + origin), false);
        },
        credentials: true, // si usas cookies o auth basada en credenciales
        // Si devuelves tokens en headers personalizados, exponlos:
        exposedHeaders: ['Authorization', 'X-Auth-Token'],
    }));

    // Helmet (ajustes comunes; ajusta según tus necesidades)
    app.use(helmet());
    app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' })); // si sirves recursos entre dominios

    // Redirige a HTTPS en producción (opcional, si tu PaaS no lo hace por ti)
    if (process.env.NODE_ENV === 'production') {
        app.use((req, res, next) => {
            if (req.secure) return next();
            // X-Forwarded-Proto es establecido por el proxy
            if (req.get('x-forwarded-proto') === 'https') return next();
            return res.redirect(`https://${req.get('host')}${req.originalUrl}`);
        });
    }

    // Si usas cookies para sesión/JWT, al setear la cookie:
    function setAuthCookie(res, token) {
        res.cookie('token', token, {
            httpOnly: true,
            sameSite: 'none', // necesario para cross-site
            secure: true,     // requiere HTTPS
            path: '/',
            // domain: '.tudominio.com', // si usas dominio propio
        });
    }

    if (typeof BigInt.prototype.toJSON !== 'function') {
        BigInt.prototype.toJSON = function () { return this.toString(); };
    }

    // Inyectar prisma en request (opcional)
    // app.use((req, res, next) => {
    //     req.db = prisma;
    //     next();
    // });

    // Swagger UI servirá el JSON dinámico desde /api/docs.json
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(null, { swaggerUrl: '/api/docs.json' }));
    app.get('/api/docs.json', (req, res) => {
        // Construye "servers" según el host y protocolo actuales
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

    return app;
}

module.exports = { createServer };