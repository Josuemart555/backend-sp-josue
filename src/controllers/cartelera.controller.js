const { sql, getPool } = require('../utils/mssql');

function buildErrorResponse(code, message) {
    return { codError: String(code), msgRespuesta: message };
}

function buildSuccessResponse(message) {
    return { codError: '200', msgRespuesta: message };
}

function validateMoviePayload(body) {
    const errors = [];

    const required = ['imdbID', 'Title', 'Year', 'Type', 'Estado', 'description', 'Ubication', 'Poster'];
    for (const key of required) {
        if (!(key in body)) errors.push(`Falta el campo: ${key}`);
    }

    if (body.imdbID && typeof body.imdbID !== 'string') errors.push('imdbID debe ser string');
    if (body.Title && typeof body.Title !== 'string') errors.push('Title debe ser string');
    if (body.Year && isNaN(Number(body.Year))) errors.push('Year debe ser numérico');
    if (body.Type && typeof body.Type !== 'string') errors.push('Type debe ser string');
    if (body.Poster && typeof body.Poster !== 'string') errors.push('Poster debe ser string (URL)');
    if (typeof body.Estado !== 'boolean') errors.push('Estado debe ser boolean');
    if (body.description && typeof body.description !== 'string') errors.push('description debe ser string');
    if (body.Ubication && typeof body.Ubication !== 'string') errors.push('Ubication debe ser string');

    return errors;
}

async function createMovie(req, res) {
    try {
        const payload = req.body;
        const errors = validateMoviePayload(payload);
        if (errors.length > 0) {
            return res.status(400).json(buildErrorResponse(400, `Datos inválidos: ${errors.join('; ')}`));
        }

        const pool = await getPool();
        const request = pool.request();

        // Mapeo y conversiones
        const yearInt = Number(payload.Year);

        request
            .input('imdbID', sql.VarChar(50), payload.imdbID)
            .input('Title', sql.NVarChar(200), payload.Title)
            .input('Year', sql.Int, yearInt)
            .input('Type', sql.NVarChar(100), payload.Type)
            .input('Poster', sql.NVarChar(500), payload.Poster || null)
            .input('Estado', sql.Bit, payload.Estado)
            .input('description', sql.NVarChar(sql.MAX), payload.description || null)
            .input('Ubication', sql.NVarChar(100), payload.Ubication || null);

        const insertSql = `
      INSERT INTO dbo.cartelera12512 (imdbID, Title, [Year], [Type], Poster, Estado, [description], Ubication)
      VALUES (@imdbID, @Title, @Year, @Type, @Poster, @Estado, @description, @Ubication);
    `;

        await request.query(insertSql);

        return res.status(200).json(buildSuccessResponse('Registro Insertado'));
    } catch (err) {
        // Manejo de duplicados por PK
        const msg = err && err.originalError && err.originalError.info && err.originalError.info.message
            ? err.originalError.info.message
            : err.message;

        // Si es una violación de PK (imdbID duplicado)
        if (/PRIMARY KEY|duplicate|violación/i.test(String(msg))) {
            return res.status(400).json(buildErrorResponse(400, 'imdbID ya existe'));
        }

        console.error('Error al insertar movie:', err);
        return res.status(500).json(buildErrorResponse(500, 'Error interno del servidor'));
    }
}

module.exports = {
    createMovie,
};