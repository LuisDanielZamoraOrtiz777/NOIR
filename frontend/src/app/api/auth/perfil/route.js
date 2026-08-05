import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { neon } from "@neondatabase/serverless";

const JWT_SECRET = process.env.JWT_SECRET || "noiratelier_secret_key_change_in_production";

export async function PATCH(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado", detail: "Token no proporcionado" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const { nombre, email, telefono, passwordActual, passwordNuevo } = await request.json();

    // Conectar a Neon
    const sql = neon(process.env.DATABASE_URL);

    // Verificar que el usuario existe
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS nombre TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS telefono TEXT`;
    const usuarios = await sql`SELECT id, email, password_hash, nombre, telefono FROM users WHERE id = ${decoded.id}`;
    if (usuarios.length === 0) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const usuario = usuarios[0];

    // Si quiere cambiar la contraseña, verificar la actual
    if (passwordNuevo) {
      if (!passwordActual) {
        return NextResponse.json({ error: "Contraseña actual requerida", detail: "Debes ingresar tu contraseña actual para cambiarla" }, { status: 400 });
      }

      const passwordValido = await bcrypt.compare(passwordActual, usuario.password_hash);
      if (!passwordValido) {
        return NextResponse.json({ error: "Contraseña incorrecta", detail: "La contraseña actual no es correcta" }, { status: 401 });
      }

      if (passwordNuevo.length < 6) {
        return NextResponse.json({ error: "Password muy corto", detail: "El password debe tener al menos 6 caracteres" }, { status: 400 });
      }
    }

    // Verificar si el email ya existe (si lo está cambiando)
    if (email !== usuario.email) {
      const emailExiste = await sql`SELECT id FROM users WHERE email = ${email} AND id != ${decoded.id}`;
      if (emailExiste.length > 0) {
        return NextResponse.json({ error: "Email ya en uso", detail: "Este correo electrónico ya está registrado por otro usuario" }, { status: 409 });
      }
    }

    // Actualizar usuario con email, nombre y teléfono
    let result;
    if (passwordNuevo) {
      const passwordHash = await bcrypt.hash(passwordNuevo, 10);
      result = await sql`
        UPDATE users 
        SET email = ${email}, nombre = ${nombre || usuario.nombre || email.split('@')[0]}, telefono = ${telefono || null}, password_hash = ${passwordHash}
        WHERE id = ${decoded.id}
        RETURNING id, email, rol, nombre, telefono, created_at
      `;
    } else {
      result = await sql`
        UPDATE users 
        SET email = ${email}, nombre = ${nombre || usuario.nombre || email.split('@')[0]}, telefono = ${telefono || null}
        WHERE id = ${decoded.id}
        RETURNING id, email, rol, nombre, telefono, created_at
      `;
    }

    const usuarioActualizado = result[0];

    // Generar nuevo token con los datos actualizados
    const nuevoToken = jwt.sign(
      { id: usuarioActualizado.id, email: usuarioActualizado.email, rol: usuarioActualizado.rol, nombre: nombre || email.split('@')[0] },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      status: "success",
      message: "Perfil actualizado exitosamente",
      token: nuevoToken,
      user: {
        id: usuarioActualizado.id,
        nombre: usuarioActualizado.nombre || nombre || email.split('@')[0],
        email: usuarioActualizado.email,
        telefono: usuarioActualizado.telefono || null,
        rol: usuarioActualizado.rol,
      },
    });

  } catch (err) {
    console.error("❌ Error actualizando perfil:", err);
    return NextResponse.json({ 
      error: "Error interno del servidor", 
      detail: err.message 
    }, { status: 500 });
  }
}