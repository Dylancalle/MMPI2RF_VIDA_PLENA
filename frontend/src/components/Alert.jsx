import React from 'react';

export const Alert = ({ tipo, mensaje }) => {
  if (!mensaje) return null;
  
  const esExito = tipo === 'exito';
  const estilos = {
    backgroundColor: esExito ? '#e8f5e9' : '#ffebee',
    color: esExito ? '#2e7d32' : '#c62828',
    padding: '15px',
    marginBottom: '20px',
    borderRadius: '5px',
    border: `1px solid ${esExito ? '#a5d6a7' : '#ef9a9a'}`,
    fontWeight: 'bold'
  };

  return <div style={estilos}>{esExito ? 'COMPLETADO: ' : 'ALERTA: '} {mensaje}</div>;
};