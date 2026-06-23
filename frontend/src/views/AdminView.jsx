// views/AdminView.jsx
import React, { useState } from 'react';
import { apiService } from '../services/api';

export const AdminView = ({ onGenerarCodigo, onVolver }) => {
  const [codigoBuscar, setCodigoBuscar] = useState('');
  const [resultados, setResultados] = useState(null);

  const buscarResultados = async () => {
    try {
      const data = await apiService.obtenerResultados(codigoBuscar);
      setResultados(data);
    } catch (err) {
      alert("No se encontraron resultados para ese código.");
    }
  };

  return (
    <div style={{ backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '8px' }}>
      <h3>Panel de Control Clínico</h3>
      
      <button onClick={onGenerarCodigo} style={{ padding: '12px', backgroundColor: '#673ab7', color: 'white', border: 'none', cursor: 'pointer', width: '100%', marginBottom: '20px', fontWeight: 'bold' }}>
        🎟️ Generar Nuevo Código de Paciente
      </button>

      <hr style={{ borderColor: '#ddd', marginBottom: '20px' }}/>
      
      <h4>Visualizador de Perfiles Psicométricos</h4>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input 
          type="text" 
          placeholder="Ingrese Código..." 
          value={codigoBuscar} 
          onChange={(e) => setCodigoBuscar(e.target.value.toUpperCase())}
          style={{ padding: '10px', flex: 1, border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <button onClick={buscarResultados} style={{ padding: '10px 20px', backgroundColor: '#009688', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          🔍 Analizar
        </button>
      </div>

      {resultados && (
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '6px', textAlign: 'left', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h5 style={{ margin: '0 0 10px 0', color: '#333' }}>Paciente: {resultados.codigo}</h5>
          <p style={{ color: '#666', fontSize: '0.9em', margin: '0 0 15px 0' }}>
            Progreso: {resultados.totalRespondido} de 25 ítems respondidos.
          </p>
          
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                <th style={{ padding: '12px 8px', textAlign: 'left' }}>Escala</th>
                <th style={{ padding: '12px 8px', textAlign: 'center' }}>Pto. Bruto</th>
                <th style={{ padding: '12px 8px', textAlign: 'center' }}>Puntaje T</th>
                <th style={{ padding: '12px 8px', textAlign: 'left' }}>Diagnóstico Clínico</th>
              </tr>
            </thead>
            <tbody>
              {resultados.escalas.map((e, index) => {
                const esRiesgo = e.puntajeT >= 65;
                return (
                  <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px 8px', fontWeight: '500' }}>{e.nombre}</td>
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>{e.puntajeBruto}</td>
                    <td style={{ 
                      padding: '12px 8px', 
                      textAlign: 'center', 
                      fontWeight: 'bold', 
                      color: esRiesgo ? '#dc3545' : '#212529',
                      backgroundColor: esRiesgo ? '#ffeeba' : 'transparent' 
                    }}>
                      {e.puntajeT}
                    </td>
                    <td style={{ padding: '12px 8px', color: esRiesgo ? '#dc3545' : '#28a745', fontWeight: esRiesgo ? 'bold' : 'normal' }}>
                      {e.interpretacion}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <button onClick={onVolver} style={{ marginTop: '20px', padding: '10px', background: 'transparent', color: '#555', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', width: '100%' }}>
        Volver al Inicio
      </button>
    </div>
  );
};