import { query } from "@/lib/db";

export async function POST(request) {
  try {
    const { name, email, message } = await request.json();

    if (!name || !email || !message) {
      return Response.json(
        { error: "Todos los campos son obligatorios." },
        { status: 400 }
      );
    }

    const result = await query(
      "INSERT INTO contacts(name, email, message, created_at) VALUES($1, $2, $3, NOW()) RETURNING id",
      [name, email, message]
    );

    return Response.json({ ok: true, id: result.rows[0].id }, { status: 201 });
  } catch (error) {
    console.error("Error en /api/contact:", error);
    return Response.json(
      { error: "No se pudo enviar el mensaje." },
      { status: 500 }
    );
  }
}