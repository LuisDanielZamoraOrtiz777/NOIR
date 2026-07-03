import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RESPUESTAS = [
  {
    keywords: ["tendencia", "tendencias", "moda", "temporada"],
    reply: "La temporada SS26 está marcada por el Quiet Luxury y las siluetas depuradas. Te recomendamos visitar nuestra sección de Tendencias para contenido actualizado.",
  },
  {
    keywords: ["editorial", "editoriales"],
    reply: "Nuestras editoriales cubren desde Mugler hasta Bottega Veneta. Encuéntralas en la sección Editoriales.",
  },
  {
    keywords: ["contacto", "colaboracion", "colaboración", "propuesta"],
    reply: "Para colaboraciones editoriales visita nuestra página de Contacto. Respondemos en menos de 48 horas.",
  },
  {
    keywords: ["hola", "hi", "hello", "buenas", "buenos"],
    reply: "¡Hola! Soy el asistente de Noir Atelier. Puedo ayudarte con información sobre editoriales, tendencias y colaboraciones.",
  },
  {
    keywords: ["gracias", "thanks"],
    reply: "Con gusto. ¿Hay algo más en lo que pueda ayudarte?",
  },
];

function generarRespuesta(mensaje) {
  const lower = mensaje.toLowerCase();
  for (const item of RESPUESTAS) {
    if (item.keywords.some((k) => lower.includes(k))) {
      return item.reply;
    }
  }
  return "Gracias por tu mensaje. Nuestro equipo editorial lo revisará pronto. Mientras tanto puedes explorar nuestras secciones de Editoriales y Tendencias.";
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { message } = body || {};

    if (!message?.trim()) {
      return NextResponse.json({ error: "Mensaje requerido." }, { status: 400 });
    }

    const reply = generarRespuesta(message.trim());

    // Guardar en BD
    if (process.env.DATABASE_URL) {
      try {
        const sql = neon(process.env.DATABASE_URL);
        await sql`
          INSERT INTO chat_messages (user_message, assistant_reply, created_at)
          VALUES (${message.trim()}, ${reply}, NOW())
        `;
      } catch (dbErr) {
        console.error("Chat DB warning:", dbErr.message);
      }
    }

    return NextResponse.json({ reply });
  } catch (err) {
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ data: [] });
    }
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`
      SELECT id, user_message, assistant_reply, created_at
      FROM chat_messages
      ORDER BY created_at DESC
      LIMIT 50
    `;
    return NextResponse.json({ status: "success", data: rows });
  } catch {
    return NextResponse.json({ data: [] });
  }
}