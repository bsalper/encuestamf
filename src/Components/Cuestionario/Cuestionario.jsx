import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getPreguntas, getOpciones, insertarRespuesta, subirFoto } from "../../Servicios/PreguntaS";

import CuestionarioUnico from "./CuestionarioUnico";
import CuestionarioMultiple from "./CuestionarioMultiple";
import CuestionarioFoto from "./CuestionarioFoto";

export default function Cuestionario() {
  const [preguntas, setPreguntas] = useState([]);
  const [index, setIndex] = useState(0);
  const [opciones, setOpciones] = useState([]);

  const navigate = useNavigate();
  const nombre = sessionStorage.getItem("nombreencuestado");

  useEffect(() => {
    async function cargar() {
      const data = await getPreguntas();
      setPreguntas(data);
    }
    cargar();
  }, []);

  useEffect(() => {
    async function cargarOpciones() {
      if (!preguntas[index]) return;

      if (preguntas[index].tipopregunta === "foto") {
        setOpciones([]); // No requiere opciones
        return;
      }

      const ops = await getOpciones(preguntas[index].idpregunta);
      setOpciones(ops);
    }
    cargarOpciones();
  }, [index, preguntas]);

  const handleNext = async (respuestaSeleccionada) => {
  try {
    const pregunta = preguntas[index];

    // FOTO
    if (pregunta.tipopregunta === "foto") {
      const fotoFile = respuestaSeleccionada;
      const url = await subirFoto(fotoFile, nombre);

      if (!url) {
        alert("Error subiendo foto.");
        return;
      }

      await insertarRespuesta({
        idpregunta: pregunta.idpregunta,
        idopcion: null,
        descripcion: null,
        fotourl: url,
        nombreencuestado: nombre,
        fecha: new Date(),
      });

    } else if (Array.isArray(respuestaSeleccionada)) {
      // MULTIPLE
      for (let idopcion of respuestaSeleccionada) {
        await insertarRespuesta({
          idpregunta: pregunta.idpregunta,
          idopcion,
          nombreencuestado: nombre,
          fecha: new Date(),
        });
      }
    } else {
      // UNICA
      await insertarRespuesta({
        idpregunta: pregunta.idpregunta,
        idopcion: respuestaSeleccionada,
        nombreencuestado: nombre,
        fecha: new Date(),
      });
    }

    // AVANZAR O FINALIZAR
    if (index + 1 >= preguntas.length) {
      navigate("/gracias");
      return;
    }

    setIndex(index + 1);

    } catch (error) {
      console.error("Error guardando respuesta:", error);
      alert("Ocurrió un error guardando la respuesta.");
    }
  };


  if (!preguntas.length) return <p>Cargando...</p>;

  const p = preguntas[index];

  return (
    <div style={{ padding: 30 }}>
      <h2>Pregunta {index + 1} de {preguntas.length}</h2>
      <p>{p.descripcion}</p>

      {p.tipopregunta === "unica" && (
        <CuestionarioUnico opciones={opciones} onNext={handleNext} />
      )}

      {p.tipopregunta === "multiple" && (
        <CuestionarioMultiple opciones={opciones} onNext={handleNext} />
      )}

      {p.tipopregunta === "foto" && (
        <CuestionarioFoto onNext={handleNext} />
      )}
    </div>
  );
}
