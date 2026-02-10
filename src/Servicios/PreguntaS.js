import { supabase } from "./Supabase";

// 1. Renombrado de getVendedores a getUsuarios y cambio de tabla
export async function getUsuarios() {
  const { data, error } = await supabase
    .from("usuario") // Nombre de la nueva tabla
    .select("*")
    .order("nombre", { ascending: true });

  if (error) {
    console.error("Error cargando usuarios:", error);
    return [];
  }
  return data;
}

// Obtener todas las preguntas
export async function getPreguntas() {
  const { data, error } = await supabase
    .from("pregunta")
    .select("*")
    .order("idpregunta", { ascending: true });

  if (error) throw error;
  return data;
}

// Obtener opciones de una pregunta
export async function getOpciones(idpregunta) {
  const { data, error } = await supabase
    .from("tiporespuesta")
    .select("idopcion, idpregunta, descripcion")
    .eq("idpregunta", idpregunta)
    .order("idopcion", { ascending: true });

  if (error) throw error;
  return data;
}

// 2. La función insertarRespuesta no cambia internamente, 
// pero el objeto que reciba desde SurveyView debe traer 'id_usuario'
export async function insertarRespuesta(respuesta) {
  const { error } = await supabase.from("respuesta").insert(respuesta);

  if (error) {
    console.error("Error insertando respuesta:", error);
    throw error;
  }
}

// SUBIR FOTO A STORAGE
export async function subirFoto(file, nombre) {
  // Una sola declaración limpia: quita tildes y espacios
  const nombreLimpio = nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") 
    .replace(/\s+/g, '_');

  const fileName = `${nombreLimpio}_${Date.now()}.jpg`;

  const { error } = await supabase.storage
    .from("fotos")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false
    });

  if (error) {
    console.error("Error subiendo foto:", error);
    return null;
  }

  const { data: publicUrlData } = supabase.storage
    .from("fotos")
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
}