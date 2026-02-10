import React from 'react';

export default function CuestionarioUnico({ opciones, currentValue, onNext }) {
  return (
    <div className="opciones-grid">
      {opciones.map((opt) => (
        <div 
          key={opt.idopcion} 
          // 1. Comparamos por ID numérico
          className={`opcion-card ${Number(currentValue) === Number(opt.idopcion) ? 'activa' : ''}`}
          // 2. Enviamos el ID al hacer clic
          onClick={() => onNext(opt.idopcion)}
        >
          <span className="check-texto">{opt.descripcion}</span>
        </div>
      ))}
    </div>
  );
}