import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { neon } from "@neondatabase/serverless";

const JWT_SECRET = process.env.JWT_SECRET || "noiratelier_secret_key_change_in_production";

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
    const r = await sql`
      UPDATE os_users SET enabled = FALSE WHERE id = ${id} RETURNING username, enabled
    `;
    if (r.length === 0) {
      return NextResponse.json({ error: "No encontrado", detail: "Cuenta no existe" }, { status: 404 });
    }

    // Auditoría
    try {
      const actor = auth.user?.email || "sistema";
      await sql`
        INSERT INTO os_audit_log (actor, action, target, detail)
        VALUES (${actor}, 'disable', ${r[0].username}, null)
      `;
    } catch { /* noop */ }

    return NextResponse.json({
      status: "success",
      message: `Cuenta '${r[0].username}' deshabilitada`,
      data: r[0],
    });
  } catch (err) {
    console.error("Error al deshabilitar cuenta:", err);
    return NextResponse.json({ error: "Error interno del servidor", detail: err.message }, { status: 500 });
  }
}