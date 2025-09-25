try {
    require('dotenv').config();
} catch (e) {
    // Si dotenv no está disponible, seguimos: Azure inyecta variables via App Settings
    console.warn('dotenv no disponible, continuando con variables de entorno del sistema');
}

const { createServer } = require('./src/app');

const PORT = process.env.PORT || 3000;

process.on('unhandledRejection', (reason) => {
    console.error('[FATAL] Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('[FATAL] Uncaught Exception:', err);
    process.exit(1);
});

async function start() {
    try {
        const app = await createServer();
        app.listen(PORT, () => {
            console.log(`API escuchando en http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('[FATAL] Error al crear el servidor:', err);
        process.exit(1);
    }
}

start();