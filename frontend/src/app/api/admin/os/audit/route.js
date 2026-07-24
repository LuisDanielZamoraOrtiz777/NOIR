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

export async function GET(request) {
  const auth = verifyAdmin(request);
  if (auth.status !== 200) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const r = await sql`
      SELECT id, actor, action, target, detail, created_at FROM os_audit_log ORDER BY created_at DESC LIMIT 200
    `;
    return NextResponse.json({ status: "success", count: r.length, data: r });
  } catch (err) {
    console.error("Error al obtener auditoría:", err);
    return NextResponse.json({ error: "Error interno del servidor", detail: err.message }, { status: 500 });
  }
}