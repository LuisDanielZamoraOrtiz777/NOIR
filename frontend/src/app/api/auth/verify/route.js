import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { neon } from "@neondatabase/serverless";

const JWT_SECRET = process.env.JWT_SECRET || "noiratelier_secret_key_change_in_production";

export async function GET(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado", detail: "Token no proporcionado" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // Conectar a Neon
    const sql = neon(process.env.DATABASE_URL);

    // Verificar que el usuario existe
    const usuarios = await sql`
      SELECT id, email, rol, created_at, nombre, telefono
      FROM users
      WHERE id = ${decoded.id}
    `;

    if (usuarios.length === 0) {
      return NextResponse.json({ error: "Token inválido", detail: "Usuario no encontrado" }, { status: 401 });
    }

    const usuario = usuarios[0];

    return NextResponse.json({
      status: "success",
      user: {
        id: usuario.id,
        nombre: usuario.nombre || decoded.nombre || usuario.email.split('@')[0],
        email: usuario.email,
        telefono: usuario.telefono || decoded.telefono || null,
        rol: usuario.rol || decoded.rol,
      },
    });

  } catch (err) {
    return NextResponse.json({ error: "Token inválido o expirado", detail: err.message }, { status: 401 });
  }
}