const API_BASE_URL = 'http://localhost:5000/api';

export const apiService = {
  async validarCodigo(codigo) {
    const res = await fetch(`${API_BASE_URL}/validar-codigo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Error de conexión");
    }
    return res.json();
  },

  async guardarRespuesta(codigo, preguntaId, respuesta) {
    const res = await fetch(`${API_BASE_URL}/guardar-respuesta`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo, preguntaId, respuesta })
    });
    if (!res.ok) throw new Error("Error al guardar respuesta");
    return res.json();
  },

  async obtenerResultados(codigo) {
    const res = await fetch(`${API_BASE_URL}/resultados/${codigo}`);
    if (!res.ok) throw new Error("Error al cargar resultados");
    return res.json();
  },

  async generarNuevoCodigo() {
    const res = await fetch(`${API_BASE_URL}/generar-codigo`, { method: 'POST' });
    if (!res.ok) throw new Error("Error al generar código");
    return res.json();
  }
};