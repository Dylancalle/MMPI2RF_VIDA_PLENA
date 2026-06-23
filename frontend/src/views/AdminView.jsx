// views/AdminView.jsx
import React, { useState } from 'react';
import { apiService } from '../services/api';
// Importamos los componentes extendidos de Recharts
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  PieChart, Pie, Legend
} from 'recharts';

export const AdminView = ({ onGenerarCodigo, onVolver }) => {
  const [codigoBuscar, setCodigoBuscar] = useState('');
  const [resultados, setResultados] = useState(null);

  const buscarResultados = async () => {
    try {
      const data = await apiService.obtenerResultados(codigoBuscar);
      
      // Preparamos los datos para el gráfico extrayendo solo la sigla (ej: "L-r")
      const datosParaGrafico = data.escalas.map(escala => {
        const siglaMatch = escala.nombre.match(/\(([^)]+)\)/);
        const sigla = siglaMatch ? siglaMatch[1] : escala.nombre;
        return {
          ...escala,
          sigla: sigla 
        };
      });

      // Calculamos el resumen para el gráfico circular de riesgo clínico
      const escalasEnRiesgo = data.escalas.filter(e => e.puntajeT >= 65).length;
      const escalasNormales = data.escalas.length - escalasEnRiesgo;
      
      const datosResumenRiesgo = [
        { name: 'En Riesgo Clínico (T ≥ 65)', value: escalasEnRiesgo, color: '#dc3545' },
        { name: 'Rango Esperable (T < 65)', value: escalasNormales, color: '#28a745' }
      ];

      setResultados({ ...data, datosParaGrafico, datosResumenRiesgo });
    } catch (err) {
      alert("No se encontraron resultados para ese código.");
    }
  };

  return (
    <div style={{ backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '8px', maxWidth: '900px', margin: '0 auto' }}>
      <h3>Panel de Control Clínico</h3>
      
      <button onClick={onGenerarCodigo} style={{ padding: '12px', backgroundColor: '#673ab7', color: 'white', border: 'none', cursor: 'pointer', width: '100%', marginBottom: '20px', fontWeight: 'bold', borderRadius: '4px' }}>
        🎟️ Generar Nuevo Código de Paciente
      </button>

      <hr style={{ borderColor: '#ddd', marginBottom: '20px' }}/>
      
      <h4>Visualizador de Perfiles Psicométricos (MMPI-2-RF)</h4>
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
          <h5 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '1.2em' }}>Paciente: {resultados.codigo}</h5>
          <p style={{ color: '#666', fontSize: '0.95em', margin: '0 0 20px 0' }}>
            Progreso: <strong>{resultados.totalRespondido}</strong> de 25 ítems respondidos.
          </p>

          {/* --- 1. TABLA DE PUNTAJES --- */}
          <h4 style={{ color: '#444', borderBottom: '2px solid #eee', paddingBottom: '5px' }}>1. Tabla de Puntuaciones T</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
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

          {/* --- 2. GRÁFICO PRINCIPAL (DE BARRAS) --- */}
          <h4 style={{ color: '#444', borderBottom: '2px solid #eee', paddingBottom: '5px' }}>2. Perfilograma Clínico Estándar</h4>
          <div style={{ width: '100%', height: 350, marginBottom: '40px', marginTop: '20px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resultados.datosParaGrafico} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="sigla" tick={{ fontWeight: 'bold' }} />
                <YAxis domain={[30, 120]} tickCount={10} label={{ value: 'Puntaje T', angle: -90, position: 'insideLeft' }}/>
                <Tooltip 
                  formatter={(value) => [`${value} Puntos T`, 'Puntaje T']}
                  labelFormatter={(label) => `Escala: ${label}`}
                />
                {/* Línea clínica roja en T=65 */}
                <ReferenceLine y={65} stroke="red" strokeDasharray="3 3" label={{ position: 'top', value: 'Umbral Clínico (T=65)', fill: 'red', fontSize: 12, fontWeight: 'bold' }} />
                
                <Bar dataKey="puntajeT" name="Puntaje T" radius={[4, 4, 0, 0]}>
                  {resultados.datosParaGrafico.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.puntajeT >= 65 ? '#dc3545' : '#4dabf7'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* --- 3. GRÁFICOS SECUNDARIOS (RADAR Y CIRCULAR) --- */}
          <h4 style={{ color: '#444', borderBottom: '2px solid #eee', paddingBottom: '5px' }}>3. Análisis Gráfico Multidimensional</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '20px' }}>
            
            {/* Gráfico A: Radar (Muestra la "forma" de la patología) */}
            <div style={{ flex: '1 1 400px', height: '350px', backgroundColor: '#fcfcfc', border: '1px solid #eaeaea', borderRadius: '8px', padding: '10px' }}>
              <h5 style={{ textAlign: 'center', margin: '5px 0 15px 0', color: '#555' }}>Perfil de Elevaciones (Radar)</h5>
              <ResponsiveContainer width="100%" height="90%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={resultados.datosParaGrafico}>
                  <PolarGrid stroke="#ccc" />
                  <PolarAngleAxis dataKey="sigla" tick={{ fontSize: 12, fontWeight: 'bold' }} />
                  <PolarRadiusAxis angle={30} domain={[30, 120]} tick={{ fontSize: 10 }} />
                  <Radar name="Puntaje T" dataKey="puntajeT" stroke="#673ab7" fill="#673ab7" fillOpacity={0.4} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Gráfico B: Circular (Muestra la "carga" o gravedad global) */}
            <div style={{ flex: '1 1 300px', height: '350px', backgroundColor: '#fcfcfc', border: '1px solid #eaeaea', borderRadius: '8px', padding: '10px' }}>
              <h5 style={{ textAlign: 'center', margin: '5px 0 15px 0', color: '#555' }}>Carga Patológica Global</h5>
              <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                  <Pie
                    data={resultados.datosResumenRiesgo}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  >
                    {resultados.datosResumenRiesgo.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} Escalas`, 'Cantidad']} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>

          </div>

        </div>
      )}

      <button onClick={onVolver} style={{ marginTop: '20px', padding: '12px', background: 'white', color: '#555', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', width: '100%', fontWeight: 'bold', transition: '0.2s' }}>
        ← Volver al Inicio
      </button>
    </div>
  );
};