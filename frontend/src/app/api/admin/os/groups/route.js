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

/**
 * GET /api/admin/os/groups
 * Lista todos los grupos del SO con conteo de miembros.
 */
export async function GET(request) {
  const auth = verifyAdmin(request);
  if (auth.status !== 200) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const grupos = await sql`
      SELECT g.id, g.nombre, g.descripcion, g.created_at,
             (SELECT count(*) FROM os_user_groups ug WHERE ug.group_id = g.id) AS miembros
      FROM os_groups g
      ORDER BY g.nombre
    `;
    return NextResponse.json({ status: "success", data: grupos });
  } catch (err) {
    console.error("Error al obtener grupos:", err);
    return NextResponse.json({ error: "Error interno del servidor", detail: err.message }, { status: 500 });
  }
}