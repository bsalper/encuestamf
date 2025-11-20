import { useState } from "react";

export default function CuestionarioUnico({ opciones, onNext }) {
  const [seleccion, setSeleccion] = useState(null);

  return (
    <div>
      {opciones.map(op => (
        <label key={op.idopcion}>
          <input
            type="radio"
            name="unica"
            onChange={() => setSeleccion(op.idopcion)}
          />
          {op.descripcion}
        </label>
      ))}

      <button onClick={() => onNext(seleccion)}>Siguiente</button>
    </div>
  );
}
