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
        
        // 1. CLAVES DE CORRECCIÓN MMPI-2-RF (5 Escalas Demo)
        const claves = {
            Lr:  [{id: 0, val: 'F'}, {id: 1, val: 'F'}, {id: 2, val: 'V'}, {id: 3, val: 'F'}, {id: 4, val: 'V'}],
            RCd: [{id: 5, val: 'V'}, {id: 6, val: 'V'}, {id: 7, val: 'V'}, {id: 8, val: 'F'}, {id: 9, val: 'V'}],
            RC1: [{id: 10, val: 'V'}, {id: 11, val: 'F'}, {id: 12, val: 'V'}, {id: 13, val: 'F'}, {id: 14, val: 'F'}],
            Fr:  [{id: 15, val: 'V'}, {id: 16, val: 'V'}, {id: 17, val: 'V'}, {id: 18, val: 'V'}, {id: 19, val: 'V'}],
            RC2: [{id: 20, val: 'F'}, {id: 21, val: 'F'}, {id: 22, val: 'F'}, {id: 23, val: 'F'}, {id: 24, val: 'F'}]
        };

        // 2. BAREMO DEMO (Conversión Bruto -> Puntaje T)
        const baremoDemo = {
            Lr:  {0: 40, 1: 45, 2: 55, 3: 65, 4: 75, 5: 85},
            RCd: {0: 38, 1: 45, 2: 55, 3: 68, 4: 78, 5: 90},
            RC1: {0: 42, 1: 48, 2: 58, 3: 66, 4: 76, 5: 88},
            Fr:  {0: 45, 1: 65, 2: 78, 3: 90, 4: 105, 5: 120}, // F-r se eleva abruptamente con pocas respuestas
            RC2: {0: 39, 1: 44, 2: 53, 3: 65, 4: 74, 5: 86}
        };

        let brutos = { Lr: 0, RCd: 0, RC1: 0, Fr: 0, RC2: 0 };

        // Calcular puntajes brutos comparando con las claves
        respuestasPaciente.forEach(r => {
            if (claves.Lr.some(c => c.id === r.pregunta_id && c.val === r.respuesta)) brutos.Lr++;
            if (claves.RCd.some(c => c.id === r.pregunta_id && c.val === r.respuesta)) brutos.RCd++;
            if (claves.RC1.some(c => c.id === r.pregunta_id && c.val === r.respuesta)) brutos.RC1++;
            if (claves.Fr.some(c => c.id === r.pregunta_id && c.val === r.respuesta)) brutos.Fr++;
            if (claves.RC2.some(c => c.id === r.pregunta_id && c.val === r.respuesta)) brutos.RC2++;
        });

        // Convertir a Puntaje T
        const t = {
            Lr: baremoDemo.Lr[brutos.Lr] || baremoDemo.Lr[0],
            RCd: baremoDemo.RCd[brutos.RCd] || baremoDemo.RCd[0],
            RC1: baremoDemo.RC1[brutos.RC1] || baremoDemo.RC1[0],
            Fr: baremoDemo.Fr[brutos.Fr] || baremoDemo.Fr[0],
            RC2: baremoDemo.RC2[brutos.RC2] || baremoDemo.RC2[0]
        };

        const interpretarT = (tScore) => tScore >= 65 ? "Clínicamente Significativo" : "Dentro de lo normal";

        // 3. Enviar al frontend
        res.json({
            codigo: codigo,
            totalRespondido: respuestasPaciente.length,
            escalas: [
                { nombre: "Virtudes Inusuales (L-r)", puntajeBruto: brutos.Lr, puntajeT: t.Lr, interpretacion: interpretarT(t.Lr) },
                { nombre: "Respuestas Infrecuentes (F-r)", puntajeBruto: brutos.Fr, puntajeT: t.Fr, interpretacion: interpretarT(t.Fr) },
                { nombre: "Desmoralización (RCd)", puntajeBruto: brutos.RCd, puntajeT: t.RCd, interpretacion: interpretarT(t.RCd) },
                { nombre: "Quejas Somáticas (RC1)", puntajeBruto: brutos.RC1, puntajeT: t.RC1, interpretacion: interpretarT(t.RC1) },
                { nombre: "Emociones Positivas Bajas (RC2)", puntajeBruto: brutos.RC2, puntajeT: t.RC2, interpretacion: interpretarT(t.RC2) }
            ]
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al procesar resultados clínicos.' });
    }
};

module.exports = { generarCodigo, validarCodigo, guardarRespuesta, obtenerResultados };