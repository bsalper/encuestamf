import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

export default function Home() {
  const navigate = useNavigate();
  const [pin, setPin] = useState("");
  const [perfilSeleccionado, setPerfilSeleccionado] = useState(null);

  const validarYEntrar = () => {
    // Configura aquí tus PINs
    const pins = {
      vendedor: "1234",
      operario: "9988"
    };

    if (pin === pins[perfilSeleccionado]) {
      navigate(`/encuesta/${perfilSeleccionado}`);
    } else {
      alert("PIN incorrecto. Inténtalo de nuevo.");
      setPin("");
    }
  };

  return (
    <div className="home-background" style={{ backgroundImage: "url('/Fondo.png')" }}>
      <div className="home-overlay">
        <div className="welcome-card">
          <h1 className="welcome-title">¡Hola! Qué bueno verte.</h1>
          <p className="welcome-subtitle">
            Bienvenido/a a tu plataforma de registro.
          </p>
          
          <hr className="welcome-divider" />

          {!perfilSeleccionado ? (
            <div className="button-group">
              <p className="instruction-text">¿Cómo vas a ingresar hoy?</p>
              <button 
                className="btn-home btn-vendedor" 
                onClick={() => setPerfilSeleccionado('vendedor')}
              >
                Soy Vendedor
              </button>
              <button 
                className="btn-home btn-operario" 
                onClick={() => setPerfilSeleccionado('operario')}
              >
                Soy Operario
              </button>
            </div>
          ) : (
            <div className="pin-section">
              <p className="instruction-text">
                Ingresa tu PIN de <strong>{perfilSeleccionado}</strong>:
              </p>
              <input
                type="password"
                className="pin-input"
                placeholder="••••"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                autoFocus
              />
              <div className="pin-actions">
                <button className="btn-confirmar" onClick={validarYEntrar}>
                  Entrar ahora
                </button>
                <button className="btn-volver" onClick={() => {setPerfilSeleccionado(null); setPin("");}}>
                  Volver
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}