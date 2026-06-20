import React from 'react';

export const LoginView = ({ codigo, setCodigo, onSubmit }) => {
  return (
    <form onSubmit={onSubmit}>
      <p>Introduce tu código de evaluación:</p>
      <input 
        type="text" 
        value={codigo} 
        onChange={(e) => setCodigo(e.target.value.toUpperCase())} 
        placeholder="Ej: JYM987" 
        style={{ padding: '10px', width: '70%', fontSize: '16px' }}
      />
      <button type="submit" style={{ padding: '10px 20px', marginLeft: '10px', backgroundColor: '#1976d2', color: 'white', border: 'none', cursor: 'pointer' }}>Entrar</button>
      <p style={{ fontSize: '12px', color: 'gray', marginTop: '30px' }}>*Personal clínico: use su credencial administrativa para generar accesos.</p>
    </form>
  );
};