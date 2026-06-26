import { query } from "@/lib/db";

export async function POST(request) {
  try {
    const { message } = await request.json();

    if (!message) {
      return Response.json(
        { error: "Mensaje requerido." },
        { status: 400 }
      );
    }

    const reply = "Gracias por tu mensaje. Nuestro equipo editorial responderá pronto.";

    await query(
      "INSERT INTO chat_messages(user_message, assistant_reply, created_at) VALUES($1, $2, NOW())",
      [message, reply]
    );

    return Response.json({ reply });
  } catch (error) {
    console.error("Error en /api/chat:", error);
    return Response.json(
      { error: "No se pudo enviar el mensaje." },
      { status: 500 }
    );
  }
}