// backend/src/services/testService.test.js
const testService = require('./testService');
const supabase = require('../config/supabase');

// Mockear el cliente de Supabase
jest.mock('../config/supabase', () => ({
    from: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
}));

describe('Pruebas Automáticas: TestService (MMPI-2-RF)', () => {

    beforeEach(() => {
        jest.clearAllMocks(); // Limpiar llamadas previas antes de cada prueba
    });

    describe('generarCodigo()', () => {
        it('debe generar un código de 6 caracteres y una fecha de expiración exitosamente', async () => {
            // Simulamos que Supabase guarda correctamente el código
            supabase.single.mockResolvedValueOnce({ data: { id: 1 }, error: null });

            const resultado = await testService.generarCodigo();

            // Verificaciones
            expect(resultado).toHaveProperty('codigo');
            expect(resultado).toHaveProperty('expiracion');
            expect(resultado.codigo.length).toBe(6); // 3 letras y 3 números
            
            const letras = resultado.codigo.substring(0, 3);
            const numeros = resultado.codigo.substring(3, 6);
            
            // Validar el formato (Letras + Números)
            expect(/^[A-Z]{3}$/.test(letras)).toBe(true);
            expect(/^[0-9]{3}$/.test(numeros)).toBe(true);
            
            // Comprobar que hizo la llamada a la BD de forma correcta
            expect(supabase.from).toHaveBeenCalledWith('codigos_acceso');
            expect(supabase.insert).toHaveBeenCalled();
        });

        it('debe lanzar un error si falla la inserción en Base de Datos', async () => {
            // Simulamos un error en la base de datos
            supabase.single.mockResolvedValueOnce({ data: null, error: new Error('Error de BD') });

            await expect(testService.generarCodigo()).rejects.toThrow('Error al generar código en Base de Datos');
        });
    });

    describe('validarCodigo()', () => {
        it('debe devolver los datos si el código es válido y existe', async () => {
            const mockData = { codigo: 'ABC123', fecha_expiracion: new Date().toISOString() };
            supabase.single.mockResolvedValueOnce({ data: mockData, error: null });

            const resultado = await testService.validarCodigo('abc123'); // Probando con minúscula para comprobar el .toUpperCase()

            expect(supabase.from).toHaveBeenCalledWith('codigos_acceso');
            expect(supabase.eq).toHaveBeenCalledWith('codigo', 'ABC123');
            expect(resultado).toEqual(mockData);
        });

        it('debe lanzar un error si el código no existe', async () => {
            supabase.single.mockResolvedValueOnce({ data: null, error: new Error('Not found') });

            await expect(testService.validarCodigo('INVALI')).rejects.toThrow('El código introducido no existe o es inválido.');
        });
    });

    describe('guardarRespuesta()', () => {
        it('debe guardar la respuesta exitosamente sin errores de Supabase', async () => {
            // Simulamos éxito en el upsert
            supabase.upsert.mockResolvedValueOnce({ error: null });

            const resultado = await testService.guardarRespuesta('ABC123', 1, 'V'); // V = Verdadero

            expect(supabase.from).toHaveBeenCalledWith('respuestas_pacientes');
            expect(supabase.upsert).toHaveBeenCalled();
            expect(resultado).toBe(true); // Debe devolver true al final
        });

        it('debe lanzar el error original si Supabase falla al guardar', async () => {
            const errorSupabase = new Error('Error de conexión');
            supabase.upsert.mockResolvedValueOnce({ error: errorSupabase });

            await expect(testService.guardarRespuesta('ABC123', 1, 'F')).rejects.toThrow(errorSupabase);
        });
    });
});