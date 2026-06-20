import React from 'react';

export const AdminView = ({ onGenerarCodigo, onVolver }) => {
  return (
    <div style={{ backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '8px' }}>
      <h3>Panel de Secretaría</h3>
      <p>Desde aquí puedes generar accesos temporales para los pacientes sin historial.</p>
      
      <button 
        onClick={onGenerarCodigo} 
        style={{ 
          padding: '15px', 
          backgroundColor: '#673ab7', 
          color: 'white', 
          border: 'none', 
          cursor: 'pointer', 
          fontSize: '16px', 
          width: '100%' 
        }}
      >
        🎟️ Generar Nuevo Código de Paciente
      </button>
      
      <button 
        onClick={onVolver} 
        style={{ 
          marginTop: '20px', 
          padding: '10px', 
          background: 'none', 
          border: '1px solid gray', 
          cursor: 'pointer',
          width: '100%'
        }}
      >
        Volver al Inicio
      </button>
    </div>
  );
};