import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../Servicios/Supabase";
import "./SurveyView.css";
import { regionesChile } from "../Utilidades/regionesChile";

import { 
  getPreguntas, 
  getOpciones, 
  insertarRespuesta, 
  subirFoto 
} from "../Servicios/PreguntaS";

import CuestionarioUnico from "../Components/Cuestionario/CuestionarioUnico";
import CuestionarioFoto from "../Components/Cuestionario/CuestionarioFoto";
import CuestionarioTexto from "../Components/Cuestionario/CuestionarioTexto";
import CuestionarioMultiple from "../Components/Cuestionario/CuestionarioMultiple";
import CuestionarioFirma from "../Components/Cuestionario/CuestionarioFirma";

export default function SurveyView() {
  const [preguntas, setPreguntas] = useState([]);
  const [opcionesMap, setOpcionesMap] = useState({});
  const [respuestasValues, setRespuestasValues] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [regionActiva, setRegionActiva] = useState("");
  const [busquedaComuna, setBusquedaComuna] = useState("");

  const [choferes, setChoferes] = useState([]);

  const { idEncuesta, idUsuario } = useParams();
  const navigate = useNavigate();

  // 1. Recuperamos los datos del vendedor desde el sessionStorage
  const nombreVendedor = sessionStorage.getItem("nombreencuestado");
  const idSupervisor = sessionStorage.getItem("id_supervisor");

  useEffect(() => {
  if (!idUsuario) { navigate("/"); return; }

  async function cargarDatosIniciales() {
    try {
      const { data: dataChoferes, error: errChoferes } = await supabase
          .from("usuario")
          .select("nombre")
          .eq("rol", "chofer"); // Filtramos por el rol exacto de tu captura

        if (!errChoferes) {
          setChoferes(dataChoferes);
        }

      const listaTotal = await getPreguntas();
      
      // LOGS CRUCIALES - Mira estos en la consola (F12)
      // En SurveyView.jsx cambia la línea 46 por esta:
      console.log("Estructura de la primera pregunta:", listaTotal[0]);
      console.log("2. ¿Qué categoría busco?:", idEncuesta);

      // Filtramos con cuidado extremo (quitando espacios y comparando minúsculas)
      const filtradas = listaTotal.filter(p => {
        const catPregunta = String(p.tipo_formulario || "").trim().toLowerCase();
        const catURL = String(idEncuesta || "").trim().toLowerCase();
        return catPregunta === catURL;
      });

      console.log("3. Preguntas después de filtrar:", filtradas);

      // orden personalizado de preguntas
      const mapaOrden = {
        15: 1,
        32: 2,
        18: 3,
        19: 4,
        16: 5,
        17: 6,
        20: 7,
        21: 8,
        23: 9,
        24: 10,
        33: 11,
        25: 12,
        34: 13,
        26: 14,
        35: 15,
        29: 16,
        36: 17,
        37: 18,
        38: 19,
        28: 20,
        27: 21
      };

      const ordenadas = filtradas.sort((a, b) => {
        const ordenA = mapaOrden[a.idpregunta] || 50;
        const ordenB = mapaOrden[b.idpregunta] || 50;
        return ordenA - ordenB;
      });

      if (ordenadas.length === 0) {
        console.warn("AVISO: El filtro dejó 0 preguntas. Revisa si en Supabase escribiste 'operario' igual que en la URL.");
      }

      setPreguntas(ordenadas);

      const map = {};
      for (const p of ordenadas) {
        if (p.tipopregunta === "unica" || p.tipopregunta === "multiple") {
          map[p.idpregunta] = await getOpciones(p.idpregunta);
        }
      }
      setOpcionesMap(map);
    } catch (error) {
      console.error("Error grave en la carga:", error);
    }
  }
  cargarDatosIniciales();
}, [idEncuesta, idUsuario, navigate]);

  const handleCambioRespuesta = (idPregunta, valor) => {
    setRespuestasValues(prev => ({ ...prev, [idPregunta]: valor }));
  };

  const enviarFormulario = async (respuestasFinales) => {
    try {
      // 1. Recuperamos el ID del supervisor
      const idSup = sessionStorage.getItem("id_supervisor");

      if (!idSup || idSup === "undefined") {
        console.error("No se encontró id_supervisor en el almacenamiento.");
        return; // Detenemos si no hay a quién buscar
      }

      // 2. Buscamos los datos del supervisor en la base de datos
      const { data: supervisor, error: supError } = await supabase
        .from("supervisor")
        .select("email, nombre")
        .eq("id_supervisor", Number(idSup))
        .maybeSingle();

      if (supError || !supervisor) {
        console.error("Error al buscar supervisor:", supError);
        return;
      }

      // 3. Invocamos la Edge Function de Supabase
      const { error: invokeError } = await supabase.functions.invoke('enviar-correo', {
        body: {
          email: supervisor.email,        // Destinatario dinámico
          nombreSupervisor: supervisor.nombre,
          encuestado: nombreVendedor,     // Declarado arriba en el componente
          respuestas: respuestasFinales   // Array con textos y fotos
        },
      });

      if (invokeError) throw invokeError;
      
      console.log("Notificación enviada con éxito a:", supervisor.email);

    } catch (err) {
      console.error("Error crítico en el flujo de notificación:", err);
    }
  };

const finalizarEncuesta = async () => {
  // 1. VALIDACIÓN (Obligatoriedad)
  for (const p of preguntas) {
    const valor = respuestasValues[p.idpregunta];
    const esOpcional = p.descripcion?.toLowerCase().includes("transporte");
    if (!esOpcional && (valor === null || valor === undefined || valor === "")) {
      alert(`La pregunta "${p.descripcion}" es obligatoria.`);
      return;
    }
  }

  try {
    setIsProcessing(true);
    const listaParaCorreo = [];
    const esOperario = idEncuesta?.toLowerCase().includes("operario");

    // --- BUSCAR EL NOMBRE DEL CHOFER ANTES DE CREAR LA CABECERA ---
    const nombreRealChofer = respuestasValues[15] || nombreVendedor || "Sin Nombre";

    // --- A. CREAR EL ENCABEZADO (CABECERA) ---
    // Esto se hace UNA SOLA VEZ antes del bucle de preguntas
    const { data: cabecera, error: errCabecera } = await supabase
      .from('formularios_hechos')
      .insert([{
        id_usuario: parseInt(idUsuario),
        tipo_formulario: idEncuesta,
        nombre_encuestado: nombreRealChofer,
        id_supervisor: parseInt(idSupervisor)
      }])
      .select()
      .single();

    if (errCabecera) throw new Error("Error al crear cabecera: " + errCabecera.message);
    const nuevoIdFormulario = cabecera.id_formulario;

    // --- B. BUCLE DE PREGUNTAS ---
    for (const p of preguntas) {
      const valor = respuestasValues[p.idpregunta];
      const tipo = p.tipopregunta ? p.tipopregunta.trim().toLowerCase() : "";
      let urlFoto = null;
      let textoCorreo = valor;

      // Template base del payload con el VÍNCULO MÁGICO
      const basePayload = {
        id_formulario_vinculado: nuevoIdFormulario,
        idpregunta: p.idpregunta,
        fotourl: null,
        idopcion: null,
        descripcion: null
      };
      
      // --- LÓGICA DE ASIGNACIÓN Y GUARDADO ---

      // 1. Fotos y Firmas con ESCUDO ANTIBOMBAS
      if ((tipo === "foto" || tipo === "firma") && valor) {
        // Aceptamos el valor si es un archivo (File) o si es un base64 (string)
        if (valor instanceof File || (typeof valor === 'string' && valor.includes(','))) {
          try {
            console.log("Subiendo evidencia al Bucket...");
            urlFoto = await subirFoto(valor, nombreVendedor || "Usuario");
          } catch (e) {
            console.error("Error subiendo imagen:", e);
          }
        } else {
          // Si ya es una URL (porque ya se subió), la mantenemos
          urlFoto = typeof valor === 'string' && valor.startsWith('http') ? valor : null;
        }
        
        const payload = { ...basePayload, fotourl: urlFoto };
        await insertarRespuesta(payload, idEncuesta);
      }

      // 2. Única (Radio Buttons)
      else if (tipo === "unica") {
        const payload = { ...basePayload, idopcion: parseInt(valor) || null };
        await insertarRespuesta(payload, idEncuesta);
        const opt = opcionesMap[p.idpregunta]?.find(o => String(o.idopcion) === String(valor));
        textoCorreo = opt ? opt.descripcion : valor;
      } 
      
      // 3. Múltiple (Checkboxes)
      else if (tipo === "multiple" && valor) {
        const ids = String(valor).split(",");
        const nombresSeleccionados = [];
        for (const idStr of ids) {
          const idLimpio = idStr.trim();
          const payloadMultiple = { ...basePayload, idopcion: parseInt(idLimpio) };
          await insertarRespuesta(payloadMultiple, idEncuesta);
          const opt = opcionesMap[p.idpregunta]?.find(o => String(o.idopcion) === idLimpio);
          nombresSeleccionados.push(opt ? opt.descripcion : idLimpio);
        }
        textoCorreo = nombresSeleccionados.join(", ");
      } 
      
      // 4. Texto Normal
      else {
        const payload = { ...basePayload, descripcion: valor ? String(valor) : null };
        await insertarRespuesta(payload, idEncuesta);
      }

      // Llenamos la lista para el correo (solo se usará si no es operario)
      listaParaCorreo.push({
        pregunta: p.descripcion,
        respuesta: urlFoto || textoCorreo,
        fotourl: urlFoto
      });
    }

    // --- C. ENVÍO DE CORREO (SOLO VENDEDORES) ---
    if (!esOperario) {
      await enviarFormulario(listaParaCorreo);
      console.log("Correo enviado al supervisor.");
    } else {
      console.log("Modo operario: Guardado en DB finalizado, sin correo.");
    }
    
    navigate("/gracias");

  } catch (error) {
    console.error("Error crítico:", error);
    alert("Hubo un problema: " + error.message);
  } finally {
    setIsProcessing(false);
  }
};

  return (
    <div 
      className="cuestionario-container" 
      style={{ 
        backgroundImage: "url('/Fondo.png')", 
      }}
    >
      <div className="cuestionario-container">
        <h1 className="titulo-encuesta">
          {String(idEncuesta).toLowerCase().includes("operario") ? "Checklist Camión" : "Registro de Visita"}
        </h1>
        <div className="vendedor-badge">
          {String(idEncuesta).toLowerCase().includes("operario") ? "Operador: " : "Vendedor: "} 
          <strong>{nombreVendedor}</strong>
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

            {p.tipopregunta === "texto" && (
              <>
              {console.log(`Evaluando pregunta ID ${p.idpregunta}: "${p.descripcion}"`)}
              {/* 1. CASO CHOFER: Usamos una búsqueda más flexible */}
              {(p.descripcion.toLowerCase().includes("chofer") || p.descripcion.toLowerCase().includes("conductor")) ? (
                <select 
                  className="input-texto-moderno"
                  style={{ border: '2px solid #007bff' }} // Un borde azul para identificarlo
                  value={respuestasValues[p.idpregunta] || ""}
                  onChange={(e) => handleCambioRespuesta(p.idpregunta, e.target.value)}
                >
                  <option value="">-- Seleccione un Chofer --</option>
                  {choferes.length > 0 ? (
                    choferes.map((chofer, idx) => (
                      <option key={idx} value={chofer.nombre}>
                        {chofer.nombre}
                      </option>
                    ))
                  ) : (
                    <option disabled>Cargando choferes...</option>
                  )}
                </select>
              ) :
                /* CASO: REGION (Buscador) */
                (p.descripcion.toLowerCase().includes("región") || p.descripcion.toLowerCase().includes("region")) ? (
                  <select 
                    className="input-texto-moderno"
                    value={respuestasValues[p.idpregunta] || ""}
                    onChange={(e) => {
                      const nuevaRegion = e.target.value;
                      setRegionActiva(nuevaRegion);
                      handleCambioRespuesta(p.idpregunta, nuevaRegion);
                      
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

            {/* 4. CASO FIRMA (Diferenciada por descripción) */}
            {p.tipopregunta === "firma" && (
              <div className="contenedor-firma-especifico">
                {/* Agregamos un título pequeño arriba si la descripción no es clara */}
                <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '5px' }}>
                  Por favor, firme en el recuadro blanco:
                </p>
                
                <CuestionarioFirma 
                  key={`firma-${p.idpregunta}`} // Key única para que React no recicle el canvas
                  onNext={(val) => handleCambioRespuesta(p.idpregunta, val)}
                  isProcessing={isProcessing}
                />
                
                {/* Feedback visual de que la firma se capturó */}
                {respuestasValues[p.idpregunta] && (
                  <span style={{ color: 'green', fontSize: '0.8rem' }}>
                    ✓ Firma registrada
                  </span>
                )}
              </div>
            )}

            {/* 5. CASO MÚLTIPLE (Checkboxes) */}
            {p.tipopregunta === "multiple" && (
              <CuestionarioMultiple 
                opciones={opcionesMap[p.idpregunta] || []} 
                // Enviamos el valor actual (será un string separado por comas)
                currentValue={respuestasValues[p.idpregunta] || ""}
                onChange={(val) => handleCambioRespuesta(p.idpregunta, val)} 
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
    </div>
  );
}