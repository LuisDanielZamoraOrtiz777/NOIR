import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { authenticateUser } from "@/lib/auth";

const TIPOS_PERMITIDOS = new Set(["mensaje", "colaboracion"]);

export async function POST(request) {
  try {
    // 1) Auth obligatoria: solo usuarios autenticados pueden escribir al admin
    const auth = authenticateUser(request);
    if (auth.status !== 200) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const user = auth.user;
    const userId = user.id;
    const safeName = user.nombre || user.email || "Usuario";
    const safeEmail = user.email || "no-reply@noiratelier.com";

    // 2) Cuerpo: sólo leemos el mensaje y el tipo. name/email vienen SIEMPRE del JWT.
    const body = await request.json().catch(() => ({}));
    const safeMessage = (body?.message || "").toString().trim();
    const rawTipo = (body?.tipo || "mensaje").toString().toLowerCase();
    const kind = TIPOS_PERMITIDOS.has(rawTipo) ? rawTipo : "mensaje";

    if (!safeMessage) {
      return NextResponse.json(
        { error: "El mensaje no puede estar vacío." },
        { status: 400 }
      );
    }

    if (safeMessage.length > 5000) {
      return NextResponse.json(
        { error: "El mensaje es demasiado largo (máx 5000 caracteres)." },
        { status: 400 }
      );
    }

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