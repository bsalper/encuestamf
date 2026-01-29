import { supabase } from "./Supabase";

// Obtener todas los vendedores
export async function getVendedores() {
  const { data, error } = await supabase
    .from("vendedor")
    .select("*")
    .order("nombre", { ascending: true });

  if (error) {
    console.error("Error cargando vendedores:", error);
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

// Insertar respuesta
export async function insertarRespuesta(respuesta) {
  const { error } = await supabase.from("respuesta").insert(respuesta);

  if (error) {
    console.error("Error insertando respuesta:", error);
    throw error;
  }
}

// SUBIR FOTO A STORAGE
export async function subirFoto(file, nombre) {
  const fileName = `${nombre}_${Date.now()}.jpg`;

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

  // OBTENER URL PÚBLICA REAL
  const { data: publicUrlData } = supabase.storage
    .from("fotos")
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
}
