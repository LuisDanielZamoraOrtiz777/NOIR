import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { neon } from "@neondatabase/serverless";

const JWT_SECRET = process.env.JWT_SECRET || "noiratelier_secret_key_change_in_production";

export async function POST(request) {
  try {
    const { nombre, email, password, telefono } = await request.json();

    // Validaciones
    if (!email?.trim() || !password) {
      return NextResponse.json({ 
        error: "Datos incompletos", 
        detail: "Email y password son obligatorios" 
      }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ 
        error: "Password muy corto", 
        detail: "El password debe tener al menos 6 caracteres" 
      }, { status: 400 });
    }

    // Conectar a Neon
    const sql = neon(process.env.DATABASE_URL);

    // Verificar si el email ya existe
    const existing = await sql`SELECT id FROM users WHERE email = ${email.trim()}`;
    if (existing.length > 0) {
      return NextResponse.json({ 
        error: "Email ya registrado", 
        detail: "Este correo electrónico ya está en uso" 
      }, { status: 409 });
    }

    // Hash del password
    const passwordHash = await bcrypt.hash(password, 10);

    // Asegurar que la tabla puede guardar nombre y teléfono cuando no existan aún
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS nombre TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS telefono TEXT`;

    // Crear usuario con nombre y teléfono
    const result = await sql`
      INSERT INTO users (email, password_hash, rol, nombre, telefono)
      VALUES (${email.trim()}, ${passwordHash}, 'usuario', ${nombre?.trim() || email.split('@')[0]}, ${telefono?.trim() || null})
      RETURNING id, email, rol, nombre, telefono, created_at
    `;

    const usuario = result[0];

    // Generar JWT
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol, nombre: usuario.nombre, telefono: usuario.telefono },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      status: "success",
      message: "Usuario registrado exitosamente",
      token,
      user: {
        id: usuario.id,
        nombre: usuario.nombre || nombre || email.split('@')[0],
        email: usuario.email,
        telefono: usuario.telefono || null,
        rol: usuario.rol,
      },
    }, { status: 201 });

  } catch (err) {
    console.error("❌ Error en registro:", err);
    return NextResponse.json({ 
      error: "Error interno del servidor", 
      detail: err.message 
    }, { status: 500 });
  }
}