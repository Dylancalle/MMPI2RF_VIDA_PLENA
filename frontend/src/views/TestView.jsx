import React from 'react';

export const TestView = ({ preguntaActual, totalPreguntas, preguntaTexto, bloqueado, onResponder }) => {
  return (
    <div>
      <h3>Pregunta {preguntaActual + 1} de {totalPreguntas}</h3>
      <p style={{ fontSize: '20px', minHeight: '60px', fontWeight: '500' }}>
        {preguntaTexto}
      </p>
      
      <div style={{ display: 'flex', gap: '20px' }}>
        <button 
          disabled={bloqueado} 
          onClick={() => onResponder('V')} 
          style={{ 
            flex: 1, 
            backgroundColor: '#4CAF50', 
            color: 'white', 
            padding: '15px', 
            fontSize: '16px', 
            cursor: 'pointer', 
            border: 'none', 
            opacity: bloqueado ? 0.5 : 1 
          }}
        >
          Verdadero
        </button>
        
        <button 
          disabled={bloqueado} 
          onClick={() => onResponder('F')} 
          style={{ 
            flex: 1, 
            backgroundColor: '#f44336', 
            color: 'white', 
            padding: '15px', 
            fontSize: '16px', 
            cursor: 'pointer', 
            border: 'none', 
            opacity: bloqueado ? 0.5 : 1 
          }}
        >
          Falso
        </button>
      </div>
    </div>
  );
};