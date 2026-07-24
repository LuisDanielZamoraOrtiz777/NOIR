import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { neon } from "@neondatabase/serverless";

const JWT_SECRET = process.env.JWT_SECRET || "noiratelier_secret_key_change_in_production";
const SALT_ROUNDS = 10;
const PASSWORD_COMUN = "P@ssw0rd2026";

function verifyAdmin(request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { error: "No autorizado", status: 401 };
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.rol !== "administrador" && decoded.rol !== "admin") {
      return { error: "Acceso denegado", detail: "Se requiere rol de administrador", status: 403 };
    }
    return { user: decoded, status: 200 };
  } catch {
    return { error: "Token inválido o expirado", status: 401 };
  }
}

export async function POST(request, { params }) {
  const auth = verifyAdmin(request);
  if (auth.status !== 200) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const u = await sql`SELECT username FROM os_users WHERE id = ${id}`;
    if (u.length === 0) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    const hash = await bcrypt.hash(PASSWORD_COMUN, SALT_ROUNDS);
    await sql`
      UPDATE os_users SET password_hash = ${hash}, must_change_password = TRUE, password_changed_at = NOW() WHERE id = ${id}
    `;

    // Auditoría
    try {
      const actor = auth.user?.email || "sistema";
      await sql`
        INSERT INTO os_audit_log (actor, action, target, detail)
        VALUES (${actor}, 'change_password', ${u[0].username}, ${JSON.stringify({ reset: true })})
      `;
    } catch { /* noop */ }

    return NextResponse.json({ status: "success", message: `Contraseña de '${u[0].username}' restablecida` });
  } catch (err) {
    console.error("Error al restablecer contraseña:", err);
    return NextResponse.json({ error: "Error interno del servidor", detail: err.message }, { status: 500 });
  }
}