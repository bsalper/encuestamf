import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Gracias.css';

export default function Gracias() {
  const navigate = useNavigate();
  const nombreSupervisor = sessionStorage.getItem("nombre_supervisor") || "tu supervisor";

  return (
    <div className="gracias-container">
      <div className="gracias-card">
        <div className="check-icon-container">
          <svg 
            viewBox="0 0 24 24" 
            className="check-svg"
          >
            <path 
              fill="none" 
              stroke="white" 
              strokeWidth="3" 
              d="M5 13l4 4L19 7" 
            />
          </svg>
        </div>

        <h1 className="gracias-titulo">Gracias.</h1>
        <p className="gracias-subtitulo">
          Su solicitud fue recibida exitosamente.
        </p>
        
        <p className="gracias-detalle">
          El reporte ha sido enviado por correo a <strong>{nombreSupervisor}</strong>.
        </p>

        <button 
          className="btn-volver-inicio"
          onClick={() => navigate('/')}
        >
          Finalizar sesión
        </button>
      </div>
    </div>
  );
}