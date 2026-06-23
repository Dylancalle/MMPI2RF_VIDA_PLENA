// controllers/testController.js
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

        const tiempoReal = new Date();
        const ahoraLocal = new Date(tiempoReal.getTime() - (4 * 60 * 60 * 1000));
        const fechaExpiracion = new Date(codigoData.fecha_expiracion);
        
        if (ahoraLocal > fechaExpiracion) {
            return res.status(400).json({ error: 'Este código ya ha caducado.' });
        }

        const horaActual = ahoraLocal.getUTCHours();
        if (horaActual >= 0 && horaActual < 6) {
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
        const respuestasPaciente = await testService.obtenerResultados(codigo); 
        
        // 1. CLAVES DE CORRECCIÓN MMPI-2-RF (Demo)
        // Qué respuesta suma 1 punto de acuerdo al índice de la pregunta (0 a 14)
        const claves = {
            Lr:  [{id: 0, val: 'F'}, {id: 1, val: 'F'}, {id: 2, val: 'V'}, {id: 3, val: 'F'}, {id: 4, val: 'V'}],
            RCd: [{id: 5, val: 'V'}, {id: 6, val: 'V'}, {id: 7, val: 'V'}, {id: 8, val: 'F'}, {id: 9, val: 'V'}],
            RC1: [{id: 10, val: 'V'}, {id: 11, val: 'F'}, {id: 12, val: 'V'}, {id: 13, val: 'F'}, {id: 14, val: 'F'}]
        };

        // 2. BAREMO DEMO (Conversión Bruto -> Puntaje T)
        const baremoDemo = {
            Lr:  {0: 40, 1: 45, 2: 55, 3: 65, 4: 75, 5: 85}, // L-r se eleva rápido
            RCd: {0: 38, 1: 45, 2: 55, 3: 68, 4: 78, 5: 90},
            RC1: {0: 42, 1: 48, 2: 58, 3: 66, 4: 76, 5: 88}
        };

        let brutoLr = 0; let brutoRCd = 0; let brutoRC1 = 0;

        // Calcular puntajes brutos comparando con las claves
        respuestasPaciente.forEach(r => {
            if (claves.Lr.some(c => c.id === r.pregunta_id && c.val === r.respuesta)) brutoLr++;
            if (claves.RCd.some(c => c.id === r.pregunta_id && c.val === r.respuesta)) brutoRCd++;
            if (claves.RC1.some(c => c.id === r.pregunta_id && c.val === r.respuesta)) brutoRC1++;
        });

        // Convertir a Puntaje T (Si por algún error no existe el valor, por defecto asigna el de 0)
        const tLr = baremoDemo.Lr[brutoLr] || baremoDemo.Lr[0];
        const tRCd = baremoDemo.RCd[brutoRCd] || baremoDemo.RCd[0];
        const tRC1 = baremoDemo.RC1[brutoRC1] || baremoDemo.RC1[0];

        // Función auxiliar para diagnóstico
        const interpretarT = (tScore) => tScore >= 65 ? "Clínicamente Significativo" : "Dentro de lo normal";

        // 3. Enviar al frontend
        res.json({
            codigo: codigo,
            totalRespondido: respuestasPaciente.length,
            escalas: [
                { nombre: "Virtudes Inusuales (L-r)", puntajeBruto: brutoLr, puntajeT: tLr, interpretacion: interpretarT(tLr) },
                { nombre: "Desmoralización (RCd)", puntajeBruto: brutoRCd, puntajeT: tRCd, interpretacion: interpretarT(tRCd) },
                { nombre: "Quejas Somáticas (RC1)", puntajeBruto: brutoRC1, puntajeT: tRC1, interpretacion: interpretarT(tRC1) }
            ]
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al procesar resultados clínicos.' });
    }
};

module.exports = { generarCodigo, validarCodigo, guardarRespuesta, obtenerResultados };