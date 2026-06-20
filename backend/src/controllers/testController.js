const testService = require('../services/testService');

const generarCodigo = async (req, res) => {
    try {
        const resultado = await testService.generarCodigo();
        res.json({ success: true, ...resultado });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const validarCodigo = async (req, res) => {
    const { codigo } = req.body;
    if (!codigo) return res.status(400).json({ error: 'Código requerido' });

    try {
        const codigoData = await testService.validarCodigo(codigo);
        
        const ahora = new Date();
        if (ahora > new Date(codigoData.fecha_expiracion)) {
            return res.status(400).json({ error: 'Este código ya ha caducado.' });
        }

        if (ahora.getHours() >= 0 && ahora.getHours() < 6) {
            return res.status(400).json({ error: 'El test no está habilitado de madrugada por recomendación clínica.' });
        }

        const ultimaPreguntaRespondida = await testService.obtenerProgresoPaciente(codigo);

        res.json({ 
            message: 'Acceso concedido', 
            codigo: codigoData.codigo,
            iniciarEnPregunta: ultimaPreguntaRespondida 
        });
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
};

const guardarRespuesta = async (req, res) => {
    const { codigo, preguntaId, respuesta } = req.body;
    if (!codigo || preguntaId === undefined || !respuesta) {
        return res.status(400).json({ error: 'Faltan datos para guardar la respuesta.' });
    }

    try {
        await testService.guardarRespuesta(codigo, preguntaId, respuesta);
        res.json({ success: true, message: `Pregunta ${preguntaId} guardada.` });
    } catch (error) {
        res.status(500).json({ error: 'Error al persistir la respuesta en el servidor.' });
    }
};

const obtenerResultados = async (req, res) => {
    const { codigo } = req.params;
    try {
        const data = await testService.obtenerResultados(codigo);
        res.json({
            codigo: codigo,
            totalRespondido: data.length,
            respuestas: data.map(r => r.respuesta)
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener resultados' });
    }
};

module.exports = { generarCodigo, validarCodigo, guardarRespuesta, obtenerResultados };