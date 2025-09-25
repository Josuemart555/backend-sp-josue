const { getPool, sql } = require('../utils/mssql');

// NOTA: Este CRUD asume una tabla "libros" con columnas:
//   id INT IDENTITY(1,1) PRIMARY KEY,
//   titulo NVARCHAR(255) NOT NULL,
//   autor NVARCHAR(255) NOT NULL,
//   anio INT NULL,
//   disponible BIT NOT NULL DEFAULT 1
// Ajusta los campos según tu esquema real.

async function list(req, res, next) {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
      SELECT id, titulo, autor, anio, disponible
      FROM libros
      ORDER BY id DESC
    `);
        res.json(result.recordset);
    } catch (err) { next(err); }
}

async function getById(req, res, next) {
    try {
        const id = parseInt(req.params.id, 10);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ message: 'ID inválido' });
        }
        const pool = await getPool();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
        SELECT id, titulo, autor, anio, disponible
        FROM libros
        WHERE id = @id
      `);
        const row = result.recordset[0];
        if (!row) return res.status(404).json({ message: 'No encontrado' });
        res.json(row);
    } catch (err) { next(err); }
}

async function create(req, res, next) {
    try {
        const { titulo, autor, anio, disponible } = req.body;

        if (typeof titulo !== 'string' || titulo.trim() === '') {
            return res.status(400).json({ message: 'titulo es requerido' });
        }
        if (typeof autor !== 'string' || autor.trim() === '') {
            return res.status(400).json({ message: 'autor es requerido' });
        }
        const anioVal = anio === undefined || anio === null ? null : Number(anio);
        if (anioVal !== null && !Number.isInteger(anioVal)) {
            return res.status(400).json({ message: 'anio debe ser entero o nulo' });
        }
        const dispVal = disponible === undefined ? true : Boolean(disponible);

        const pool = await getPool();
        const result = await pool.request()
            .input('titulo', sql.NVarChar(255), titulo)
            .input('autor', sql.NVarChar(255), autor)
            .input('anio', anioVal === null ? sql.Int : sql.Int, anioVal)
            .input('disponible', sql.Bit, dispVal)
            .query(`
        INSERT INTO libros (titulo, autor, anio, disponible)
        OUTPUT INSERTED.id, INSERTED.titulo, INSERTED.autor, INSERTED.anio, INSERTED.disponible
        VALUES (@titulo, @autor, @anio, @disponible)
      `);

        res.status(201).json(result.recordset[0]);
    } catch (err) { next(err); }
}

async function update(req, res, next) {
    try {
        const id = parseInt(req.params.id, 10);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ message: 'ID inválido' });
        }

        const { titulo, autor, anio, disponible } = req.body;

        // Construcción dinámica de SET con parámetros
        const sets = [];
        const inputs = [];
        if (titulo !== undefined) {
            if (typeof titulo !== 'string' || titulo.trim() === '') {
                return res.status(400).json({ message: 'titulo inválido' });
            }
            sets.push('titulo = @titulo');
            inputs.push({ name: 'titulo', type: sql.NVarChar(255), value: titulo });
        }
        if (autor !== undefined) {
            if (typeof autor !== 'string' || autor.trim() === '') {
                return res.status(400).json({ message: 'autor inválido' });
            }
            sets.push('autor = @autor');
            inputs.push({ name: 'autor', type: sql.NVarChar(255), value: autor });
        }
        if (anio !== undefined) {
            const anioVal = anio === null ? null : Number(anio);
            if (anioVal !== null && !Number.isInteger(anioVal)) {
                return res.status(400).json({ message: 'anio debe ser entero o nulo' });
            }
            sets.push('anio = @anio');
            inputs.push({ name: 'anio', type: sql.Int, value: anioVal });
        }
        if (disponible !== undefined) {
            sets.push('disponible = @disponible');
            inputs.push({ name: 'disponible', type: sql.Bit, value: Boolean(disponible) });
        }

        if (sets.length === 0) {
            return res.status(400).json({ message: 'No hay campos para actualizar' });
        }

        const pool = await getPool();
        const request = pool.request().input('id', sql.Int, id);
        for (const p of inputs) {
            request.input(p.name, p.type, p.value);
        }
        const result = await request.query(`
      UPDATE libros
      SET ${sets.join(', ')}
      WHERE id = @id;

      SELECT id, titulo, autor, anio, disponible
      FROM libros
      WHERE id = @id;
    `);

        const row = result.recordset[0];
        if (!row) return res.status(404).json({ message: 'No encontrado' });
        res.json(row);
    } catch (err) { next(err); }
}

async function remove(req, res, next) {
    try {
        const id = parseInt(req.params.id, 10);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ message: 'ID inválido' });
        }
        const pool = await getPool();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
        DELETE FROM libros WHERE id = @id;
        SELECT @@ROWCOUNT AS affected;
      `);
        const affected = result.recordset[0]?.affected || 0;
        if (affected === 0) return res.status(404).json({ message: 'No encontrado' });
        res.status(204).send();
    } catch (err) { next(err); }
}

module.exports = { list, getById, create, update, remove };