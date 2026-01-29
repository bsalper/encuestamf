import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getVendedores } from "../Servicios/PreguntaS";

export default function UserEntry() {
  const { idEncuesta } = useParams();
  const [vendedores, setVendedores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  const configLabels = {
    vendedor: { titulo: "Bienvenido/a", subtitulo: "Selecciona tu nombre para comenzar", carga: "vendedores" },
    operario: { titulo: "Checklist de Camiones", subtitulo: "Confirma tu identidad para iniciar el control", carga: "datos" }
  };

  const labels = configLabels[idEncuesta] || configLabels.vendedor;

  useEffect(() => {
  async function cargar() {
    try {
      if (idEncuesta === 'operario') {
        // No consultamos a la DB, creamos a Diego manualmente
        const diegoFijo = [{ 
          id_vendedor: 999, // Un ID ficticio o el que quieras
          nombre: "Diego García" 
        }];
        setVendedores(diegoFijo);
      } else {
        // Para vendedores, seguimos trayendo la lista real de la DB
        const lista = await getVendedores();
        setVendedores(lista);
      }
    } catch (error) {
      console.error("Error cargando:", error);
    } finally {
      setCargando(false);
    }
  }
  cargar();
}, [idEncuesta]);

  const seleccionarVendedor = (v) => {
    // Guardamos toda la información necesaria en el session
    sessionStorage.setItem("nombreencuestado", v.nombre);
    sessionStorage.setItem("id_vendedor", v.id_vendedor);
    
    // Al elegir, saltamos directamente a la encuesta
    navigate(`/cuestionario/${idEncuesta}/${v.id_vendedor}`);
  };

  return (
    <div className="cuestionario-container">
      <div className="cuestionario-card">
        <h2 className="titulo-encuesta">{labels.titulo}</h2>
        <p style={{ textAlign: "center", marginBottom: "20px", color: "#666" }}>
          {labels.subtitulo}
        </p>

        {cargando ? (
          <p style={{ textAlign: "center" }}>Cargando {labels.carga}...</p>
        ) : (
          <div className="vendedor-list-container">
            {vendedores.length > 0 ? (
              vendedores.map((v) => (
                <div
                  key={v.id_vendedor}
                  className="opcion-card"
                  onClick={() => seleccionarVendedor(v)}
                  style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '10px'
                  }}
                >
                  <div>
                    <strong style={{ display: 'block' }}>{v.nombre}</strong>
                    <small style={{ color: '#888' }}>Zona: {v.zona}</small>
                  </div>
                  <span style={{ color: '#3498db', fontWeight: 'bold' }}>→</span>
                </div>
              ))
            ) : (
              <p style={{ textAlign: "center", color: "red" }}>Usuario no encontrado para esta sección.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}