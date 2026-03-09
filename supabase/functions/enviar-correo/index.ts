import { createTransport } from "npm:nodemailer";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const payload = await req.json();
    const { email, nombreSupervisor, encuestado, respuestas } = payload;

    // 1. Configurar Nodemailer (Gmail Movingfood)
    const transporter = createTransport({
      service: "gmail",
      auth: {
        user: "t.i@movingfood.cl",
        pass: "kpcr wzvw hkkh qzuy",
      },
    });

    // 2. Definir destinatarios
    const listaCorreos = [
      email,
      "t.i@movingfood.cl",
      "soporte@movingfood.cl"
    ];

    // Convertimos de nuevo a string para Nodemailer
    const toField = Array.from(listaCorreos).filter(Boolean).join(", ");

    // 3. Enviar el correo
    await transporter.sendMail({
      from: '"Sistema de Encuestas" <t.i@movingfood.cl>',
      to: toField,
      subject: `Creación de cliente - ${encuestado}`,
      html: `
          <div style="font-family: sans-serif; color: #333;">
            <p>Estimado <strong>${nombreSupervisor}</strong>, le informamos que <strong>${encuestado}</strong> ha creado un nuevo cliente:</p>
            <hr />
            <ul>
              ${respuestas.map(r => `
                <li style="margin-bottom: 10px;">
                  <strong>${r.pregunta}:</strong>
                  ${r.fotourl 
                    ? `<img src="${r.fotourl}" width="250" style="border-radius:8px; margin-top:5px;"/>` 
                    : `<span>${r.respuesta}</span>`
                  }
                </li>
              `).join("")}
            </ul>
          </div>
        `,
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});