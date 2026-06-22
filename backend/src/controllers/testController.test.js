const testController = require('./testController');
const testService = require('../services/testService');

// Mockeamos el servicio para no hacer peticiones reales a Supabase durante el test
jest.mock('../services/testService');

describe('Pruebas Automáticas: Motor de Calificación MMPI-2-RF Demo (3 Escalas, 15 Preguntas)', () => {
    let req, res;

    beforeEach(() => {
        // Preparamos los objetos request y response de Express
        req = { params: { codigo: 'DEMO99' } };
        res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis()
        };
        jest.clearAllMocks();
    });

    it('Caso 1: Debe calcular correctamente un perfil ALTO en todas las escalas (Puntaje Bruto = 5)', async () => {
        // Simulamos respuestas que aciertan EXACTAMENTE con las claves de corrección de las 3 escalas
        testService.obtenerResultados.mockResolvedValue([
            // L-r (Respuestas clave)
            { pregunta_id: 0, respuesta: 'F' }, { pregunta_id: 1, respuesta: 'F' }, 
            { pregunta_id: 2, respuesta: 'V' }, { pregunta_id: 3, respuesta: 'F' }, { pregunta_id: 4, respuesta: 'V' },
            // RCd (Respuestas clave)
            { pregunta_id: 5, respuesta: 'V' }, { pregunta_id: 6, respuesta: 'V' }, 
            { pregunta_id: 7, respuesta: 'V' }, { pregunta_id: 8, respuesta: 'F' }, { pregunta_id: 9, respuesta: 'V' },
            // RC1 (Respuestas clave)
            { pregunta_id: 10, respuesta: 'V' }, { pregunta_id: 11, respuesta: 'F' }, 
            { pregunta_id: 12, respuesta: 'V' }, { pregunta_id: 13, respuesta: 'F' }, { pregunta_id: 14, respuesta: 'F' }
        ]);

        await testController.obtenerResultados(req, res);

        // Verificamos el tope del baremo (5 puntos = T maximos y "Clínicamente Significativo")
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            codigo: 'DEMO99',
            totalRespondido: 15,
            escalas: expect.arrayContaining([
                expect.objectContaining({ nombre: 'Virtudes Inusuales (L-r)', puntajeBruto: 5, puntajeT: 85, interpretacion: 'Clínicamente Significativo' }),
                expect.objectContaining({ nombre: 'Desmoralización (RCd)', puntajeBruto: 5, puntajeT: 90, interpretacion: 'Clínicamente Significativo' }),
                expect.objectContaining({ nombre: 'Quejas Somáticas (RC1)', puntajeBruto: 5, puntajeT: 88, interpretacion: 'Clínicamente Significativo' })
            ])
        }));
    });

    it('Caso 2: Debe calcular correctamente un perfil NORMAL sin puntos sumados (Puntaje Bruto = 0)', async () => {
        // Simulamos respuestas completamente OPUESTAS a las claves
        testService.obtenerResultados.mockResolvedValue([
            // L-r opuestas
            { pregunta_id: 0, respuesta: 'V' }, { pregunta_id: 1, respuesta: 'V' }, 
            { pregunta_id: 2, respuesta: 'F' }, { pregunta_id: 3, respuesta: 'V' }, { pregunta_id: 4, respuesta: 'F' },
            // RCd opuestas
            { pregunta_id: 5, respuesta: 'F' }, { pregunta_id: 6, respuesta: 'F' }, 
            { pregunta_id: 7, respuesta: 'F' }, { pregunta_id: 8, respuesta: 'V' }, { pregunta_id: 9, respuesta: 'F' },
            // RC1 opuestas
            { pregunta_id: 10, respuesta: 'F' }, { pregunta_id: 11, respuesta: 'V' }, 
            { pregunta_id: 12, respuesta: 'F' }, { pregunta_id: 13, respuesta: 'V' }, { pregunta_id: 14, respuesta: 'V' }
        ]);

        await testController.obtenerResultados(req, res);

        // Verificamos la base del baremo (0 puntos)
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            escalas: expect.arrayContaining([
                expect.objectContaining({ nombre: 'Virtudes Inusuales (L-r)', puntajeBruto: 0, puntajeT: 40, interpretacion: 'Dentro de lo normal' }),
                expect.objectContaining({ nombre: 'Desmoralización (RCd)', puntajeBruto: 0, puntajeT: 38, interpretacion: 'Dentro de lo normal' }),
                expect.objectContaining({ nombre: 'Quejas Somáticas (RC1)', puntajeBruto: 0, puntajeT: 42, interpretacion: 'Dentro de lo normal' })
            ])
        }));
    });

    it('Caso 3: Debe calcular un perfil mixto (L-r Normal, RCd Significativo, RC1 Normal)', async () => {
        testService.obtenerResultados.mockResolvedValue([
            // L-r: 2 puntos (F, F) = T 55 (Normal)
            { pregunta_id: 0, respuesta: 'F' }, { pregunta_id: 1, respuesta: 'F' }, 
            { pregunta_id: 2, respuesta: 'F' }, { pregunta_id: 3, respuesta: 'V' }, { pregunta_id: 4, respuesta: 'F' },
            // RCd: 4 puntos (V, V, V, F) = T 78 (Significativo)
            { pregunta_id: 5, respuesta: 'V' }, { pregunta_id: 6, respuesta: 'V' }, 
            { pregunta_id: 7, respuesta: 'V' }, { pregunta_id: 8, respuesta: 'F' }, { pregunta_id: 9, respuesta: 'F' },
            // RC1: 1 punto (V) = T 48 (Normal)
            { pregunta_id: 10, respuesta: 'V' }, { pregunta_id: 11, respuesta: 'V' }, 
            { pregunta_id: 12, respuesta: 'F' }, { pregunta_id: 13, string: 'V' }, { pregunta_id: 14, respuesta: 'V' }
        ]);

        await testController.obtenerResultados(req, res);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            escalas: expect.arrayContaining([
                expect.objectContaining({ nombre: 'Virtudes Inusuales (L-r)', puntajeBruto: 2, puntajeT: 55, interpretacion: 'Dentro de lo normal' }),
                expect.objectContaining({ nombre: 'Desmoralización (RCd)', puntajeBruto: 4, puntajeT: 78, interpretacion: 'Clínicamente Significativo' }),
                expect.objectContaining({ nombre: 'Quejas Somáticas (RC1)', puntajeBruto: 1, puntajeT: 48, interpretacion: 'Dentro de lo normal' })
            ])
        }));
    });
});