import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getUsuarios } from "../Servicios/PreguntaS"; // Nombre de función actualizado

export default function UserEntry() {
  const { idEncuesta } = useParams();
  const [usuarios, setUsuarios] = useState([]); // Nombre más genérico
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
          // Diego ahora usa la nomenclatura 'id_usuario'
          const diegoFijo = [{ 
            id_usuario: 999, 
            nombre: "Diego García",
            zona: "Quilicura"
          }];
          setUsuarios(diegoFijo);
        } else {
          // Llamamos a la nueva función que apunta a la tabla 'usuario'
          const lista = await getUsuarios();
          setUsuarios(lista);
        }
      } catch (error) {
        console.error("Error cargando usuarios:", error);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, [idEncuesta]);

  const seleccionarUsuario = (u) => {
    // Guardamos con los nuevos nombres de columna
    sessionStorage.setItem("nombreencuestado", u.nombre);
    sessionStorage.setItem("id_usuario", u.id_usuario); 
    
    // La URL ahora lleva el id_usuario
    navigate(`/cuestionario/${idEncuesta}/${u.id_usuario}`);
  };

  return (
    <div 
      className="cuestionario-container" 
      style={{ 
        backgroundImage: "url('/Fondo.png')", 
        backgroundSize: "cover", 
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      }}
    >
      <div className="cuestionario-card">
        <h2 className="titulo-encuesta">{labels.titulo}</h2>
        <p style={{ textAlign: "center", marginBottom: "20px", color: "#666" }}>
          {labels.subtitulo}
        </p>

        {cargando ? (
          <p style={{ textAlign: "center" }}>Cargando {labels.carga}...</p>
        ) : (
          <div className="vendedor-list-container">
            {usuarios.length > 0 ? (
              usuarios.map((u) => (
                <div
                  key={u.id_usuario}
                  className="opcion-card"
                  onClick={() => seleccionarUsuario(u)}
                  style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '10px',
                      textAlign: 'left'
                  }}
                >
                  <div>
                    <strong style={{ display: 'block' }}>{u.nombre}</strong>
                    <small style={{ color: '#888' }}>Zona: {u.zona || 'N/A'}</small>
                  </div>
                  <span style={{ color: '#3498db', fontWeight: 'bold' }}>→</span>
                </div>
              ))
            ) : (
              <p style={{ textAlign: "center", color: "red" }}>Usuario no encontrado.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}