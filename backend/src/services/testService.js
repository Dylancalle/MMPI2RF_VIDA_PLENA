const supabase = require('../config/supabase');

class TestService {
    async generarCodigo() {
        const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numeros = '0123456789';
        let codigo = '';
        for (let i = 0; i < 3; i++) codigo += letras.charAt(Math.floor(Math.random() * letras.length));
        for (let i = 0; i < 3; i++) codigo += numeros.charAt(Math.floor(Math.random() * numeros.length));

        // --- CORRECCIÓN DE ZONA HORARIA APLICADA AQUÍ (-4 HORAS) ---
        const ahora = new Date();
        const ahoraLocal = new Date(ahora.getTime() - (4 * 60 * 60 * 1000));
        
        const expiracion = new Date(ahoraLocal.getTime());
        expiracion.setUTCHours(expiracion.getUTCHours() + 24);
        // -----------------------------------------------------------

        const { data, error } = await supabase
            .from('codigos_acceso')
            .insert([{ 
                codigo: codigo, 
                fecha_expiracion: expiracion,
                creado_en: ahoraLocal // <- Actualizado al nombre exacto de tu columna
            }])
            .select()
            .single();

        if (error) throw new Error('Error al generar código en Base de Datos');
        return { codigo, expiracion };
    }

    async validarCodigo(codigo) {
        const { data, error } = await supabase
            .from('codigos_acceso')
            .select('*')
            .eq('codigo', codigo.toUpperCase())
            .single();

        if (error || !data) throw new Error('El código introducido no existe o es inválido.');
        return data;
    }

    async obtenerProgresoPaciente(codigo) {
        const { data } = await supabase
            .from('respuestas_pacientes')
            .select('pregunta_id')
            .eq('codigo_usuario', codigo.toUpperCase());
        
        return data ? data.length : 0;
    }

    async guardarRespuesta(codigo, preguntaId, respuesta) {
        // --- CALCULAMOS LA HORA LOCAL PARA LAS RESPUESTAS ---
        const ahora = new Date();
        const ahoraLocal = new Date(ahora.getTime() - (4 * 60 * 60 * 1000));

        const { error } = await supabase
            .from('respuestas_pacientes')
            .upsert({ 
                codigo_usuario: codigo.toUpperCase(), 
                pregunta_id: preguntaId, 
                respuesta: respuesta,
                respondido_en: ahoraLocal // <- Actualizado al nombre exacto de tu columna
            }, { onConflict: 'codigo_usuario,pregunta_id' });

        if (error) {
            console.error("🚨 ERROR REAL DE SUPABASE AL GUARDAR:", error);
            throw error;
        }
        // TODO: Aquí irá la lógica asíncrona para guardar en el historial clínico existente.
        return true;
    }

    async obtenerResultados(codigo) {
        const { data, error } = await supabase
            .from('respuestas_pacientes')
            .select('pregunta_id, respuesta')
            .eq('codigo_usuario', codigo.toUpperCase())
            .order('pregunta_id', { ascending: true });

        if (error) throw error;
        return data;
    }
}

module.exports = new TestService();