import { useState } from "react";

export default function CuestionarioMultiple({ opciones, onNext }) {
  const [seleccion, setSeleccion] = useState([]);

  const toggle = (id) => {
    setSeleccion(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div>
      {opciones.map(op => (
        <label key={op.idopcion}>
          <input
            type="checkbox"
            onChange={() => toggle(op.idopcion)}
          />
          {op.descripcion}
        </label>
      ))}

      <button onClick={() => onNext(seleccion)}>Siguiente</button>
    </div>
  );
}
