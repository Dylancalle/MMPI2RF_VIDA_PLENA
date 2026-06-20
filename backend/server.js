const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// REEMPLAZA ESTO CON TUS DATOS REALES DE SUPABASE
const SUPABASE_URL = 'https://xnhtjbmpsynzqdnohzkf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Lwu9YdOsFbONmRHZcIUzMg_2KjjOvQR';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 4. Módulo de Secretaría: Generar nuevo código
app.post('/api/generar-codigo', async (req, res) => {
    // Generar un código aleatorio tipo JYM987 (3 letras, 3 números)
    const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numeros = '0123456789';
    let codigo = '';
    for (let i = 0; i < 3; i++) codigo += letras.charAt(Math.floor(Math.random() * letras.length));
    for (let i = 0; i < 3; i++) codigo += numeros.charAt(Math.floor(Math.random() * numeros.length));

    // Fecha de expiración (24 horas desde ahora)
    const expiracion = new Date();
    expiracion.setHours(expiracion.getHours() + 24);

    const { data, error } = await supabase
        .from('codigos_acceso')
        .insert([{ codigo: codigo, fecha_expiracion: expiracion }])
        .select();

    if (error) return res.status(500).json({ error: 'Error al generar código' });

    res.json({ success: true, codigo: codigo, expiracion: expiracion });
});

// 1. Validar el código del paciente al iniciar
app.post('/api/validar-codigo', async (req, res) => {
    const { codigo } = req.body;

    if (!codigo) return res.status(400).json({ error: 'Código requerido' });

    // Buscar el código en Supabase
    const { data, error } = await supabase
        .from('codigos_acceso')
        .select('*')
        .eq('codigo', codigo.toUpperCase())
        .single();

    if (error || !data) {
        return res.status(404).json({ error: 'El código introducido no existe o es inválido.' });
    }

    // Validación de Caducidad / Horario
    const ahora = new Date();
    const fechaExpiracion = new Date(data.fecha_expiracion);
    
    if (ahora > fechaExpiracion) {
        return res.status(400).json({ error: 'Este código ya ha caducado.' });
    }

    // (Opcional) Validar restricción de madrugada/noche
    const horaActual = ahora.getHours();
    if (horaActual >= 0 && horaActual < 6) {
        return res.status(400).json({ error: 'El test no está habilitado de madrugada por recomendación clínica.' });
    }

    // Buscar si el paciente ya tenía respuestas previas para que continúe donde se quedó
    const { data: respuestasPrevias } = await supabase
        .from('respuestas_pacientes')
        .select('pregunta_id')
        .eq('codigo_usuario', codigo.toUpperCase());

    // Devolvemos en qué número de pregunta se quedó (el conteo de filas guardadas)
    const ultimaPreguntaRespondida = respuestasPrevias ? respuestasPrevias.length : 0;

    res.json({ 
        message: 'Acceso concedido', 
        codigo: data.codigo,
        iniciarEnPregunta: ultimaPreguntaRespondida 
    });
});

// 2. Guardar respuesta INDIVIDUAL (Persistencia en tiempo real)
// Se ejecuta cada vez que el paciente hace clic en "Verdadero" o "Falso"
app.post('/api/guardar-respuesta', async (req, res) => {
    const { codigo, preguntaId, respuesta } = req.body;

    if (!codigo || preguntaId === undefined || !respuesta) {
        return res.status(400).json({ error: 'Faltan datos para guardar la respuesta.' });
    }

    // Guardar o actualizar (upsert) la respuesta en Supabase
    const { error } = await supabase
        .from('respuestas_pacientes')
        .upsert({ 
            codigo_usuario: codigo.toUpperCase(), 
            pregunta_id: preguntaId, 
            respuesta: respuesta 
        }, { onConflict: 'codigo_usuario,pregunta_id' });

    if (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error al persistir la respuesta en el servidor.' });
    }

    res.json({ success: true, message: `Pregunta ${preguntaId} guardada.` });
});

// 3. Obtener resultados finales formateados por código
app.get('/api/resultados/:codigo', async (req, res) => {
    const { codigo } = req.params;

    const { data, error } = await supabase
        .from('respuestas_pacientes')
        .select('pregunta_id, respuesta')
        .eq('codigo_usuario', codigo.toUpperCase())
        .order('pregunta_id', { ascending: true });

    if (error) return res.status(500).json({ error: 'Error al obtener resultados' });

    res.json({
        codigo: codigo,
        totalRespondido: data.length,
        respuestas: data.map(r => r.respuesta) // Devuelve un array plano tipo ['V', 'F', 'V']
    });
});

app.listen(PORT, () => {
    console.log(`Servidor MMPI-2 conectado a Supabase en puerto ${PORT}`);
});