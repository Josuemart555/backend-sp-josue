// src/routes/movies.routes.js
const { Router } = require('express');
const { createMovie } = require('../controllers/cartelera.controller');

const router = Router();

// POST /api/movies
router.post('/', createMovie);

module.exports = router;