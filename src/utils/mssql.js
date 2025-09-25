const sql = require('mssql');

let poolPromise;

function getSqlConfig() {
    const encrypt = String(process.env.SQLSERVER_ENCRYPT || 'true').toLowerCase() === 'true';
    return {
        server: process.env.SQLSERVER_SERVER,
        database: process.env.SQLSERVER_DB,
        user: process.env.SQLSERVER_USER,
        password: process.env.SQLSERVER_PASSWORD,
        options: {
            encrypt,               // Requerido generalmente en Azure
            trustServerCertificate: !encrypt, // Solo true si NO usas encrypt
            enableArithAbort: true
        },
        pool: {
            max: 10,
            min: 0,
            idleTimeoutMillis: 30000
        }
    };
}

async function getPool() {
    if (!poolPromise) {
        const config = getSqlConfig();
        poolPromise = sql.connect(config)
            .then(pool => {
                console.log('SQL Server conectado');
                return pool;
            })
            .catch(err => {
                poolPromise = null;
                console.error('Error conectando a SQL Server:', err);
                throw err;
            });
    }
    return poolPromise;
}

module.exports = { sql, getPool };