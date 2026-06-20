import { useState, useEffect } from 'react'

const PREGUNTAS_PRUEBA = [
  "Me gustan las revistas de mecánica.",
  "Tengo buen apetito.",
  "Me despierto fresco y descansado casi todas las mañanas.",
  "Creo que me gustaría el trabajo de bibliotecario.",
  "El ruido me despierta fácilmente."
]

function App() {
  const [paso, setPaso] = useState(0) // 0: Login, 1: Test, 2: Fin, 3: Admin(Secretaría)
  const [codigo, setCodigo] = useState('')
  const [preguntaActual, setPreguntaActual] = useState(0)
  const [respuestasFinales, setRespuestasFinales] = useState([])
  const [bloqueado, setBloqueado] = useState(false)
  
  // NUEVO: Estado para alertas personalizadas
  const [mensajeError, setMensajeError] = useState('')
  const [mensajeExito, setMensajeExito] = useState('')

  // Control de múltiples pestañas
  useEffect(() => {
    if (paso === 1) {
      const sesionActiva = localStorage.getItem('testActivo');
      if (sesionActiva && sesionActiva !== codigo) {
        setMensajeError("Parece que hay otro test abierto en esta computadora. Cierra las otras pestañas.");
        setPaso(0);
      } else {
        localStorage.setItem('testActivo', codigo);
      }
    }
  }, [paso, codigo]);

  // Limpiar sesión al terminar
  const finalizarTest = (respuestas) => {
    localStorage.removeItem('testActivo');
    setRespuestasFinales(respuestas);
    setPaso(2);
  }

  const mostrarError = (msg) => {
    setMensajeError(msg)
    setTimeout(() => setMensajeError(''), 5000) // Se oculta solo en 5 seg
  }

  const ingresarConCodigo = async (e) => {
    e.preventDefault()
    if (!codigo) return mostrarError("Por favor, ingresa tu código único.")

    // "Huevo de pascua" para entrar a la pantalla de secretaría
    if (codigo === "ADMIN123") {
      setPaso(3)
      setCodigo('')
      return
    }

    try {
      const res = await fetch('http://localhost:5000/api/validar-codigo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo })
      })
      const data = await res.json()

      if (res.ok) {
        setPreguntaActual(data.iniciarEnPregunta)
        if (data.iniciarEnPregunta >= PREGUNTAS_PRUEBA.length) {
          obtenerResultadosFinales()
        } else {
          setPaso(1)
        }
      } else {
        mostrarError(data.error)
      }
    } catch (err) {
      mostrarError("Error de conexión con el servidor.")
    }
  }

  const responderPregunta = async (valorRespuesta) => {
    setBloqueado(true)
    try {
      await fetch('http://localhost:5000/api/guardar-respuesta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo, preguntaId: preguntaActual, respuesta: valorRespuesta })
      })

      if (preguntaActual < PREGUNTAS_PRUEBA.length - 1) {
        setPreguntaActual(preguntaActual + 1)
      } else {
        obtenerResultadosFinales()
      }
    } catch (error) {
      mostrarError("Error al guardar respuesta. Revisa tu conexión.")
    } finally {
      setBloqueado(false)
    }
  }

  const obtenerResultadosFinales = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/resultados/${codigo}`)
      const data = await res.json()
      finalizarTest(data.respuestas)
    } catch (err) {
      mostrarError("Error al cargar los resultados finales.")
    }
  }

  const generarNuevoCodigo = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/generar-codigo', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setMensajeExito(`¡Código generado exitosamente: ${data.codigo}! (Válido por 24h)`)
      }
    } catch (error) {
      mostrarError("Error al generar el código.")
    }
  }

  return (
    <div style={{ maxWidth: '500px', margin: '50px auto', padding: '20px', fontFamily: 'Arial', position: 'relative' }}>
      
      {/* COMPONENTE DE ALERTAS PERSONALIZADAS (Reemplaza a los alert() nativos) */}
      {mensajeError && (
        <div style={{ backgroundColor: '#ffebee', color: '#c62828', padding: '15px', marginBottom: '20px', borderRadius: '5px', border: '1px solid #ef9a9a', fontWeight: 'bold' }}>
          ⚠️ {mensajeError}
        </div>
      )}
      {mensajeExito && (
        <div style={{ backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '15px', marginBottom: '20px', borderRadius: '5px', border: '1px solid #a5d6a7', fontWeight: 'bold' }}>
          ✅ {mensajeExito}
        </div>
      )}

      <h2>MMPI-2-RF (Sistema Clínico)</h2>
      <hr />

      {paso === 0 && (
        <form onSubmit={ingresarConCodigo}>
          <p>Introduce tu código de evaluación:</p>
          <input 
            type="text" value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} 
            placeholder="Ej: JYM987" style={{ padding: '10px', width: '70%', fontSize: '16px' }}
          />
          <button type="submit" style={{ padding: '10px 20px', marginLeft: '10px', backgroundColor: '#1976d2', color: 'white', border: 'none', cursor: 'pointer' }}>Entrar</button>
          <p style={{ fontSize: '12px', color: 'gray', marginTop: '30px' }}>*Personal clínico: use su credencial administrativa para generar accesos.</p>
        </form>
      )}

      {paso === 1 && (
        <div>
          <h3>Pregunta {preguntaActual + 1} de {PREGUNTAS_PRUEBA.length}</h3>
          <p style={{ fontSize: '20px', minHeight: '60px', fontWeight: '500' }}>{PREGUNTAS_PRUEBA[preguntaActual]}</p>
          <div style={{ display: 'flex', gap: '20px' }}>
            <button disabled={bloqueado} onClick={() => responderPregunta('V')} style={{ flex: 1, backgroundColor: '#4CAF50', color: 'white', padding: '15px', fontSize: '16px', cursor: 'pointer', border: 'none', opacity: bloqueado ? 0.5 : 1 }}>Verdadero</button>
            <button disabled={bloqueado} onClick={() => responderPregunta('F')} style={{ flex: 1, backgroundColor: '#f44336', color: 'white', padding: '15px', fontSize: '16px', cursor: 'pointer', border: 'none', opacity: bloqueado ? 0.5 : 1 }}>Falso</button>
          </div>
        </div>
      )}

      {paso === 2 && (
        <div style={{ textAlign: 'center' }}>
          <h3>¡Evaluación Finalizada!</h3>
          <p>Tus respuestas han sido enviadas de forma segura y anónima.</p>
          <p>Puedes cerrar esta pestaña.</p>
          {/* Ocultamos los resultados aquí para que el paciente no los vea, solo se guardaron en BD */}
        </div>
      )}

      {paso === 3 && (
        <div style={{ backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '8px' }}>
          <h3>Panel de Secretaría</h3>
          <p>Desde aquí puedes generar accesos temporales para los pacientes sin historial.</p>
          <button onClick={generarNuevoCodigo} style={{ padding: '15px', backgroundColor: '#673ab7', color: 'white', border: 'none', cursor: 'pointer', fontSize: '16px', width: '100%' }}>
            🎟️ Generar Nuevo Código de Paciente
          </button>
          <button onClick={() => setPaso(0)} style={{ marginTop: '20px', padding: '10px', background: 'none', border: '1px solid gray', cursor: 'pointer' }}>Volver al Inicio</button>
        </div>
      )}
    </div>
  )
}

export default App