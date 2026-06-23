import { useState, useEffect } from 'react';
import { PREGUNTAS_PRUEBA } from './constants/preguntas';
import { apiService } from './services/api';

// Componentes y Vistas
import { Alert } from './components/Alert';
import { LoginView } from './views/LoginView';
import { TestView } from './views/TestView';
import { FinView } from './views/FinView';
import { AdminView } from './views/AdminView';

function App() {
  const [paso, setPaso] = useState(0); 
  const [codigo, setCodigo] = useState('');
  const [preguntaActual, setPreguntaActual] = useState(0);
  const [bloqueado, setBloqueado] = useState(false);
  
  const [mensajeError, setMensajeError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');

 // 1. Efecto para liberar el código si el paciente cierra la pestaña accidentalmente
  useEffect(() => {
    const liberarSesion = () => {
      // Solo borramos el bloqueo si la pestaña que se cierra es la dueña del test
      if (sessionStorage.getItem('soyDueñoTest') === 'true') {
        localStorage.removeItem('testActivo');
      }
    };
    
    window.addEventListener('beforeunload', liberarSesion);
    return () => window.removeEventListener('beforeunload', liberarSesion);
  }, []);

  // 2. Efecto para el control de múltiples pestañas
  // 2. Efecto para el control de múltiples pestañas (Optimizado para Demo)
  useEffect(() => {
    if (paso === 1) {
      const testEnUso = localStorage.getItem('testActivo');
      
      if (testEnUso && testEnUso !== codigo) {
        // Alguien más está usando un código DIFERENTE en esta PC
        mostrarError("Hay otro test abierto en esta computadora. Cierra las otras pestañas.");
        setPaso(0);
      } else {
        // La vía está libre, O estamos retomando nuestro PROPIO código tras un cierre.
        // Reclamamos el test sin bloquearnos a nosotros mismos.
        localStorage.setItem('testActivo', codigo);
        sessionStorage.setItem('soyDueñoTest', 'true');
      }
    }
  }, [paso, codigo]);

  const mostrarError = (msg) => {
    setMensajeError(msg);
    setTimeout(() => setMensajeError(''), 5000);
  };

  const ingresarConCodigo = async (e) => {
    e.preventDefault();
    if (!codigo) return mostrarError("Por favor, ingresa tu código único.");
    
    if (codigo === "ADMIN123") {
      setPaso(3);
      setCodigo('');
      return;
    }

    try {
      const data = await apiService.validarCodigo(codigo);
      setPreguntaActual(data.iniciarEnPregunta);
      
      if (data.iniciarEnPregunta >= PREGUNTAS_PRUEBA.length) {
        setPaso(2);
      } else {
        setPaso(1);
      }
    } catch (err) {
      mostrarError(err.message);
    }
  };

  const responderPregunta = async (valorRespuesta) => {
    setBloqueado(true);
    try {
      await apiService.guardarRespuesta(codigo, preguntaActual, valorRespuesta);

      if (preguntaActual < PREGUNTAS_PRUEBA.length - 1) {
        setPreguntaActual(preguntaActual + 1);
      } else {
        localStorage.removeItem('testActivo');
        setPaso(2); // Ir a vista final
      }
    } catch (error) {
      mostrarError("Error al guardar respuesta. Revisa tu conexión.");
    } finally {
      setBloqueado(false);
    }
  };

  const generarNuevoCodigo = async () => {
    try {
      const data = await apiService.generarNuevoCodigo();
      setMensajeExito(`¡Código generado exitosamente: ${data.codigo}! (Válido por 24h)`);
    } catch (error) {
      mostrarError("Error al generar el código.");
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '50px auto', padding: '20px', fontFamily: 'Arial' }}>
      
      <Alert tipo="error" mensaje={mensajeError} />
      <Alert tipo="exito" mensaje={mensajeExito} />

      <h2>MMPI-2-RF (Sistema Clínico)</h2>
      <hr />

      {paso === 0 && (
        <LoginView 
          codigo={codigo} 
          setCodigo={setCodigo} 
          onSubmit={ingresarConCodigo} 
        />
      )}

      {paso === 1 && (
        <TestView 
          preguntaActual={preguntaActual}
          totalPreguntas={PREGUNTAS_PRUEBA.length}
          preguntaTexto={PREGUNTAS_PRUEBA[preguntaActual]}
          bloqueado={bloqueado}
          onResponder={responderPregunta}
        />
      )}

      {paso === 2 && <FinView />}

      {paso === 3 && (
        <AdminView 
          onGenerarCodigo={generarNuevoCodigo} 
          onVolver={() => setPaso(0)} 
        />
      )}

    </div>
  );
}

export default App;