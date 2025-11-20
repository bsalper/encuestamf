import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function UserEntry() {
  const [nombre, setNombre] = useState("");
  const navigate = useNavigate();

  const handleStart = () => {
    if (nombre.trim().length < 2) {
      alert("Por favor ingresa tu nombre completo.");
      return;
    }

    sessionStorage.setItem("nombreencuestado", nombre.trim());
    navigate("/encuesta");
  };

  return (
    <div style={{ padding: 30 }}>
      <h2>Bienvenido</h2>
      <p>Ingresa tu nombre para comenzar la encuesta</p>

      <input
        type="text"
        placeholder="Tu nombre"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        style={{ padding: 10, width: "100%" }}
      />

      <button onClick={handleStart} style={{ marginTop: 20 }}>
        Comenzar
      </button>
    </div>
  );
}
