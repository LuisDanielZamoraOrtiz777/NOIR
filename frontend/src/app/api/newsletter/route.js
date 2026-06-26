import { query } from "@/lib/db";

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return Response.json(
        { error: "Correo requerido." },
        { status: 400 }
      );
    }

    await query(
      "INSERT INTO newsletter_subscriptions(email, subscribed_at) VALUES($1, NOW()) ON CONFLICT (email) DO NOTHING",
      [email]
    );

    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Error en /api/newsletter:", error);
    return Response.json(
      { error: "No se pudo suscribir." },
      { status: 500 }
    );
  }
}