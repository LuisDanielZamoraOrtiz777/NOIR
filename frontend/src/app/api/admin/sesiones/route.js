import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { neon } from "@neondatabase/serverless";

const JWT_SECRET = process.env.JWT_SECRET || "noiratelier_secret_key_change_in_production";

export async function GET(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // Verificar que sea admin
    if (decoded.rol !== "administrador" && decoded.rol !== "admin") {
      return NextResponse.json({ error: "Acceso denegado", detail: "Se requiere rol de administrador" }, { status: 403 });
    }

    const sql = neon(process.env.DATABASE_URL);

    // Intentar obtener sesiones (si existe la tabla sesiones)
    try {
      const sesiones = await sql`
        SELECT s.id, s.user_id, u.email, s.token_hash, s.activa, s.expires_at, s.created_at
        FROM sesiones s
        LEFT JOIN users u ON s.user_id = u.id
        ORDER BY s.created_at DESC
      `;
      return NextResponse.json({ status: "success", count: sesiones.length, data: sesiones });
    } catch (error) {
      // Si no existe la tabla sesiones, retornar array vacío
      console.log("Tabla sesiones no existe, retornando array vacío");
      return NextResponse.json({ status: "success", count: 0, data: [] });
    }

  } catch (err) {
    console.error("Error al obtener sesiones:", err);
    return NextResponse.json({ error: "Error interno del servidor", detail: err.message }, { status: 500 });
  }
}