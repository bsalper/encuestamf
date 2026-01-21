import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../Servicios/Supabase";
import "./Cuestionario.css";
import { regionesChile } from "../../Utilidades/regionesChile";

import { 
  getPreguntas, 
  getOpciones, 
  insertarRespuesta, 
  subirFoto 
} from "../../Servicios/PreguntaS";

import CuestionarioUnico from "./CuestionarioUnico";
import CuestionarioFoto from "./CuestionarioFoto";
import CuestionarioTexto from "./CuestionarioTexto";

export default function Cuestionario() {
  const [preguntas, setPreguntas] = useState([]);
  const [opcionesMap, setOpcionesMap] = useState({});
  const [respuestasValues, setRespuestasValues] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [regionActiva, setRegionActiva] = useState("");
  const [busquedaComuna, setBusquedaComuna] = useState("");

  const navigate = useNavigate();

  // 1. Recuperamos los datos del vendedor desde el sessionStorage
  const nombreVendedor = sessionStorage.getItem("nombreencuestado");
  const idVendedor = sessionStorage.getItem("id_vendedor");
  const idSupervisor = sessionStorage.getItem("id_supervisor");

  useEffect(() => {
    // Si no hay vendedor (ej. alguien refrescó la página o entró directo), volvemos al inicio
    if (!idVendedor) {
      navigate("/");
      return;
    }

    async function cargarDatosIniciales() {
      try {
        const listaPreguntas = await getPreguntas();
        setPreguntas(listaPreguntas);

        const map = {};
        for (const p of listaPreguntas) {
          if (p.tipopregunta === "unica" || p.tipopregunta === "multiple") {
            map[p.idpregunta] = await getOpciones(p.idpregunta);
          }
        }
        setOpcionesMap(map);
      } catch (error) {
        console.error("Error cargando datos:", error);
      }
    }
    cargarDatosIniciales();
  }, [idVendedor, navigate]);

  const handleCambioRespuesta = (idPregunta, valor) => {
    setRespuestasValues(prev => ({ ...prev, [idPregunta]: valor }));
  };

  const enviarFormulario = async (respuestasFinales) => {
    try {
      // 2. Buscamos al supervisor usando el ID que recuperamos del session
      const { data: supervisor } = await supabase
        .from("supervisor")
        .select("email, nombre")
        .eq("id_supervisor", Number(idSupervisor))
        .maybeSingle();

      if (!supervisor) return;

      const { data: descripciones } = await supabase
        .from("tiporespuesta")
        .select("idopcion, descripcion");

      const datosParaEnviar = respuestasFinales.map(r => {
        const preguntaOriginal = preguntas.find(p => p.idpregunta === r.idpregunta);
        const opcionDB = descripciones?.find(d => d.idopcion.toString() === r.respuesta?.toString());
        
        return {
          pregunta: preguntaOriginal ? preguntaOriginal.descripcion : `Pregunta ${r.idpregunta}`,
          respuesta: r.fotourl ? "Imagen adjunta" : (opcionDB ? opcionDB.descripcion : r.respuesta),
          fotourl: r.fotourl || null
        };
      });

      await supabase.functions.invoke('enviar-correo', {
        body: {
          email: supervisor.email,
          nombreSupervisor: supervisor.nombre,
          encuestado: nombreVendedor,
          respuestas: datosParaEnviar
        },
      });
    } catch (err) {
      console.error("Error en envío:", err);
    }
  };

  const finalizarEncuesta = async () => {
    // 1. PRIMERO VALIDAR (Sin insertar nada aún)
    for (const p of preguntas) {
      const valor = respuestasValues[p.idpregunta];
      const esOpcional = p.descripcion.toLowerCase().includes("transporte");

      if (!esOpcional && (valor === null || valor === undefined || valor === "")) {
        alert(`La pregunta "${p.descripcion}" es obligatoria o tiene un formato inválido.`);
        return;
      }
    }

    // 2. SI TODO ESTÁ BIEN, PROCESAR
    try {
      setIsProcessing(true);
      const listaParaCorreo = [];

      // Usamos un solo loop para subir fotos, insertar en DB y preparar el correo
      for (const p of preguntas) {
        const valor = respuestasValues[p.idpregunta];
        let urlFoto = null;

        if (p.tipopregunta === "foto" && valor) {
          // Subir imagen al Bucket
          urlFoto = await subirFoto(valor, nombreVendedor);
          
          // Insertar en tabla respuesta
          await insertarRespuesta({ 
            idpregunta: p.idpregunta, 
            fotourl: urlFoto, 
            id_vendedor: idVendedor, // ID numérico de tu tabla
            fecha: new Date() 
          });
        } else {
          // Insertar texto o opción única
          await insertarRespuesta({ 
            idpregunta: p.idpregunta, 
            descripcion: p.tipopregunta === "texto" ? valor : null,
            idopcion: p.tipopregunta === "unica" ? valor : null,
            id_vendedor: idVendedor, // ID numérico de tu tabla
            fecha: new Date() 
          });
        }

        // Preparar objeto para el correo
        listaParaCorreo.push({
          idpregunta: p.idpregunta,
          pregunta: p.descripcion,
          respuesta: urlFoto || valor,
          fotourl: urlFoto
        });
      }

      // 3. ENVIAR CORREO Y NAVEGAR
      await enviarFormulario(listaParaCorreo);
      navigate("/gracias");

    } catch (error) {
      console.error("Error al finalizar:", error);
      alert("Error: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="cuestionario-container">
      <h1 className="titulo-encuesta">Registro de Visita</h1>
      <div className="vendedor-badge">
        Vendedor: <strong>{nombreVendedor}</strong>
      </div>

      {preguntas.map((p) => (
        <div key={p.idpregunta} className="cuestionario-card section-pregunta">
          <h3 className="pregunta-descripcion">{p.descripcion}</h3>

          {/* 1. CASO ÚNICA (Radios) */}
          {p.tipopregunta === "unica" && (
            <CuestionarioUnico 
              opciones={opcionesMap[p.idpregunta] || []} 
              onNext={(val) => handleCambioRespuesta(p.idpregunta, val)} 
              currentValue={respuestasValues[p.idpregunta]}
            />
          )}

          {/* 2. CASO TEXTO (Aquí metemos Región, Comuna y Validaciones) */}
          {p.tipopregunta === "texto" && (
            <>
              {/* SUB-CASO: REGIÓN (Select simple) */}
              {(p.descripcion.toLowerCase().includes("región") || p.descripcion.toLowerCase().includes("region")) ? (
                <select 
                  className="input-texto-moderno"
                  value={respuestasValues[p.idpregunta] || ""}
                  onChange={(e) => {
                    const nuevaRegion = e.target.value;
                    setRegionActiva(nuevaRegion);
                    handleCambioRespuesta(p.idpregunta, nuevaRegion);
                    
                    // Resetear comuna si cambia región
                    const pComuna = preguntas.find(preg => preg.descripcion.toLowerCase().includes("comuna"));
                    if (pComuna) {
                      handleCambioRespuesta(pComuna.idpregunta, "");
                      setBusquedaComuna("");
                    }
                  }}
                >
                  <option value="">-- Seleccione Región --</option>
                  {regionesChile.map(r => (
                    <option key={r.region} value={r.region}>{r.region}</option>
                  ))}
                </select>
              ) 
              /* SUB-CASO: COMUNA (Buscador) */
              : p.descripcion.toLowerCase().includes("comuna") ? (
                <div className="searchable-select-container">
                  <input
                    type="text"
                    className="input-texto-moderno"
                    placeholder={regionActiva ? "Escribe para buscar..." : "Seleccione región primero"}
                    value={respuestasValues[p.idpregunta] || busquedaComuna}
                    disabled={!regionActiva}
                    onChange={(e) => {
                      const val = e.target.value;
                      setBusquedaComuna(val);
                      if (val === "") handleCambioRespuesta(p.idpregunta, "");
                    }}
                  />
                  {regionActiva && busquedaComuna && !respuestasValues[p.idpregunta] && (
                    <ul className="sugerencias-lista">
                      {regionesChile
                        .find(r => r.region === regionActiva)
                        ?.comunas.filter(c => c.toLowerCase().includes(busquedaComuna.toLowerCase()))
                        .map(comuna => (
                          <li key={comuna} onClick={() => {
                            handleCambioRespuesta(p.idpregunta, comuna);
                            setBusquedaComuna(comuna);
                          }}>
                            {comuna}
                          </li>
                        ))
                      }
                    </ul>
                  )}
                  {respuestasValues[p.idpregunta] && (
                    <button className="btn-limpiar-seleccion" onClick={() => {
                      handleCambioRespuesta(p.idpregunta, "");
                      setBusquedaComuna("");
                    }}>
                      ✕ Cambiar comuna
                    </button>
                  )}
                </div>
              ) 
              /* SUB-CASO: TEXTO NORMAL (RUT, Teléfono, Email) */
              : (
                <CuestionarioTexto 
                  onNext={(val) => handleCambioRespuesta(p.idpregunta, val)}
                  placeholder={p.descripcion}
                  tipoValidacion={
                    p.descripcion.toLowerCase().includes("rut") ? "rut" : 
                    (p.descripcion.toLowerCase().includes("teléfono") || p.descripcion.toLowerCase().includes("celular")) ? "telefono" :
                    (p.descripcion.toLowerCase().includes("correo") || p.descripcion.toLowerCase().includes("email")) ? "email" : 
                    "texto"
                  }
                  currentValue={respuestasValues[p.idpregunta]}
                />
              )}
            </>
          )}

          {/* 3. CASO FOTO */}
          {p.tipopregunta === "foto" && (
            <CuestionarioFoto 
              onNext={(val) => handleCambioRespuesta(p.idpregunta, val)} 
              disabled={isProcessing} 
            />
          )}
        </div>
      ))}

      <button 
        className="btn-siguiente btn-finalizar" 
        onClick={finalizarEncuesta} 
        disabled={isProcessing}
      >
        {isProcessing ? "Enviando Reporte..." : "Finalizar y Enviar"}
      </button>
    </div>
  );
}