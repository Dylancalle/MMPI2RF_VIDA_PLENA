const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');

router.post('/generar-codigo', testController.generarCodigo);
router.post('/validar-codigo', testController.validarCodigo);
router.post('/guardar-respuesta', testController.guardarRespuesta);
router.get('/resultados/:codigo', testController.obtenerResultados);

module.exports = router;