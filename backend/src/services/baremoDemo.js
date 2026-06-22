// Simulación de claves de corrección para la demo
const ESCALAS_DEMO = {
  ansiedad: [
    { preguntaId: 1, respuestaEsperada: 'F' }, // "Buen apetito" -> Si es Falso, suma a ansiedad
    { preguntaId: 4, respuestaEsperada: 'V' }  // "El ruido me despierta" -> Si es Verdadero, suma
  ],
  depresion: [
    { preguntaId: 0, respuestaEsperada: 'F' }, // "Me gustan revistas..." -> Si es Falso, suma
    { preguntaId: 2, respuestaEsperada: 'F' }  // "Me despierto fresco..." -> Si es Falso, suma
  ]
};

// Conversión simulada a Puntaje T (Baremo)
// Puntaje Bruto -> Puntaje T
const BAREMO_DEMO = {
  0: 45, // Normal
  1: 60, // Riesgo moderado
  2: 78  // Clínicamente significativo (>65 es alto en MMPI)
};