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

    // Obtener usuarios con su rol desde usuario_rol (si existe) o desde la columna rol
    try {
      const usuarios = await sql`
        SELECT u.id, u.email, u.created_at, 
               COALESCE(r.nombre, u.rol, 'usuario') as rol
        FROM users u
        LEFT JOIN usuario_rol ur ON u.id = ur.user_id AND ur.activo = true
        LEFT JOIN roles r ON ur.rol_id = r.id
        ORDER BY u.created_at DESC
      `;
      return NextResponse.json({ status: "success", count: usuarios.length, data: usuarios });
    } catch (error) {
      // Si falla (no existe tabla usuario_rol), usar la columna rol directamente
      const usuarios = await sql`
        SELECT id, email, created_at, rol
        FROM users
        ORDER BY created_at DESC
      `;
      return NextResponse.json({ status: "success", count: usuarios.length, data: usuarios });
    }

  } catch (err) {
    console.error("Error al obtener usuarios:", err);
    return NextResponse.json({ error: "Error interno del servidor", detail: err.message }, { status: 500 });
  }
}