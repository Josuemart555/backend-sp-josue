// src/routes/libros.routes.js
const { Router } = require('express');
const controller = require('../controllers/libros.controller');

const router = Router();

router.get('/', controller.list);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;