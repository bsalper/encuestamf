import React from 'react';

export default function CuestionarioMultiple({ opciones, currentValue, onChange }) {
  // Ahora manejamos una lista de IDs (convertimos a String para el split y luego a Number)
  const seleccionadas = currentValue 
    ? String(currentValue).split(",").map(id => id.trim()) 
    : [];

  const handleToggle = (idOpcion) => {
    const idStr = String(idOpcion);
    let nuevasSeleccionadas;
    
    if (seleccionadas.includes(idStr)) {
      nuevasSeleccionadas = seleccionadas.filter(item => item !== idStr);
    } else {
      nuevasSeleccionadas = [...seleccionadas, idStr];
    }
    
    // Unimos los IDs con comas para guardarlos en la columna 'descripcion'
    onChange(nuevasSeleccionadas.join(","));
  };

  return (
    <div className="opciones-grid">
      {opciones.map((opt) => {
        const esActiva = seleccionadas.includes(String(opt.idopcion));
        return (
          <div 
            key={opt.idopcion} 
            className={`opcion-card ${esActiva ? 'activa' : ''}`}
            onClick={() => handleToggle(opt.idopcion)} // Enviamos el ID
          >
            <span className="check-texto">{opt.descripcion}</span>
          </div>
        );
      })}
    </div>
  );
}