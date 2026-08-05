import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { authenticateUser } from "@/lib/auth";

const TIPOS_PERMITIDOS = new Set(["mensaje", "colaboracion"]);

export async function POST(request) {
  try {
    const authHeader = request.headers.get("Authorization");
    let user = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const auth = authenticateUser(request);
      if (auth.status !== 200) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
      }
      user = auth.user;
    }

    const body = await request.json().catch(() => ({}));
    const safeMessage = (body?.message || "").toString().trim();
    const rawTipo = (body?.tipo || "mensaje").toString().toLowerCase();
    const kind = TIPOS_PERMITIDOS.has(rawTipo) ? rawTipo : "mensaje";
    const safeEmail = user?.email || (body?.email || "").toString().trim();
    const safeName = user?.nombre || body?.name || safeEmail || "Usuario";

    if (!safeMessage) {
      return NextResponse.json(
        { error: "El mensaje no puede estar vacío." },
        { status: 400 }
      );
    }

    if (!safeEmail) {
      return NextResponse.json(
        { error: "Escribe tu correo electrónico para que podamos responder." },
        { status: 400 }
      );
    }

    if (safeMessage.length > 5000) {
      return NextResponse.json(
        { error: "El mensaje es demasiado largo (máx 5000 caracteres)." },
        { status: 400 }
      );
    }

    const userId = user?.id || null;
    console.log("POST /api/contact from user:", { id: userId, email: safeEmail, kind });

    // 3) Asegurar la columna `kind` (idempotente, compatible con Neon/Postgres).
    //    Si la tabla ya tiene la columna, este ALTER es un no-op.
    try {
      await query("ALTER TABLE contacts ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'mensaje'");
      await query("ALTER TABLE contacts ADD COLUMN IF NOT EXISTS user_id integer");
    } catch (schemaErr) {
      console.warn("No se pudo ampliar el esquema de contacts:", schemaErr.message);
    }

    const result = await query(
      `INSERT INTO contacts(name, email, message, kind, user_id, created_at)
       VALUES($1, $2, $3, $4, $5, NOW())
       RETURNING id`,
      [safeName, safeEmail, safeMessage, kind, userId]
    );

    console.log("POST /api/contact inserted id:", result.rows[0].id);
    return NextResponse.json(
      {
        ok: true,
        id: result.rows[0].id,
        kind,
        message: "Mensaje enviado correctamente.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error en /api/contact:", error);
    return NextResponse.json(
      { error: "No se pudo enviar el mensaje.", detail: error?.message || String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: "Método no permitido. Usa POST." },
    { status: 405 }
  );
}