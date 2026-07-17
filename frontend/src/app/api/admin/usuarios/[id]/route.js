import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { neon } from "@neondatabase/serverless";

const JWT_SECRET = process.env.JWT_SECRET || "noiratelier_secret_key_change_in_production";

export async function PATCH(request, { params }) {
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

    const userId = Number(params.id);
    const { rol } = await request.json();

    if (isNaN(userId) || userId <= 0) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    if (!rol || !["administrador", "editor", "usuario"].includes(rol)) {
      return NextResponse.json({ error: "Rol inválido", detail: "El rol debe ser: administrador, editor o usuario" }, { status: 400 });
    }

    const sql = neon(process.env.DATABASE_URL);

    // 1. Actualizar la columna rol en la tabla users
    await sql`UPDATE users SET rol = ${rol} WHERE id = ${userId}`;
    
    // 2. Obtener el ID del rol desde la tabla roles
    const rolResult = await sql`SELECT id FROM roles WHERE nombre = ${rol}`;
    if (rolResult.length > 0) {
      const rolId = rolResult[0].id;
      // 3. Actualizar o insertar en usuario_rol
      const existe = await sql`SELECT id FROM usuario_rol WHERE user_id = ${userId}`;
      if (existe.length > 0) {
        await sql`UPDATE usuario_rol SET rol_id = ${rolId}, activo = true WHERE user_id = ${userId}`;
      } else {
        await sql`INSERT INTO usuario_rol (user_id, rol_id, activo) VALUES (${userId}, ${rolId}, true)`;
      }
    }
    
    const usuario = await sql`SELECT id, email, created_at, rol FROM users WHERE id = ${userId}`;
    
    if (usuario.length === 0) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ 
      status: "success", 
      message: "Rol actualizado exitosamente", 
      data: usuario[0] 
    });

  } catch (err) {
    console.error("Error al actualizar rol:", err);
    return NextResponse.json({ error: "Error interno del servidor", detail: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
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

    const userId = Number(params.id);

    if (isNaN(userId) || userId <= 0) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    // No permitir eliminar el propio usuario
    if (decoded.id === userId) {
      return NextResponse.json({ error: "Operación no permitida", detail: "No puedes eliminar tu propio usuario" }, { status: 400 });
    }

    const sql = neon(process.env.DATABASE_URL);

    // Intentar eliminar de la tabla usuario_rol primero (si existe)
    try {
      await sql`DELETE FROM usuario_rol WHERE user_id = ${userId}`;
    } catch (error) {
      // Si no existe la tabla, continuar
    }

    const result = await sql`DELETE FROM users WHERE id = ${userId} RETURNING id, email`;

    if (result.length === 0) {
      return NextResponse.json({ error: "No encontrado", detail: `No existe un usuario con id ${userId}` }, { status: 404 });
    }

    return NextResponse.json({ status: "success", message: "Usuario eliminado exitosamente", data: result[0] });

  } catch (err) {
    console.error("Error al eliminar usuario:", err);
    return NextResponse.json({ error: "Error interno del servidor", detail: err.message }, { status: 500 });
  }
}