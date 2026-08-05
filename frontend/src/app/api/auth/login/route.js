import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { neon } from "@neondatabase/serverless";
import { saveSession } from "@/lib/sessionUtils";

const JWT_SECRET = process.env.JWT_SECRET || "noiratelier_secret_key_change_in_production";

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    console.log("🔐 Intento de login usuario:", email);

    // Validaciones
    if (!email || !password) {
      return NextResponse.json({ 
        error: "Datos incompletos", 
        detail: "Email y password son obligatorios" 
      }, { status: 400 });
    }

    // Conectar a Neon
    const sql = neon(process.env.DATABASE_URL);

    // Consultar usuario y campos opcionales
    const usuarios = await sql`
      SELECT id, email, password_hash, rol, created_at, nombre, telefono
      FROM users
      WHERE email = ${email}
    `;

    if (usuarios.length === 0) {
      console.log("❌ Usuario no encontrado:", email);
      return NextResponse.json({ 
        error: "Credenciales inválidas", 
        detail: "Email o password incorrectos" 
      }, { status: 401 });
    }

    const usuario = usuarios[0];
    const rolNombre = usuario.rol || "usuario";

    // Verificar password
    const passwordValido = await bcrypt.compare(password, usuario.password_hash);

    if (!passwordValido) {
      console.log("❌ Password incorrecto para:", email);
      return NextResponse.json({ 
        error: "Credenciales inválidas", 
        detail: "Email o password incorrectos" 
      }, { status: 401 });
    }

    // Nota: ahora permitimos que administradores inicien sesión desde el acceso unificado.

    // Generar JWT
    const expiresInSeconds = 7 * 24 * 60 * 60;
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: rolNombre, nombre: email.split('@')[0] },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null;
    const userAgent = request.headers.get("user-agent") || null;

    await saveSession({ userId: usuario.id, token, expiresAt, ip, userAgent });

    console.log("✅ Login usuario exitoso:", email);

    return NextResponse.json({
      status: "success",
      message: "Login exitoso",
      token,
      user: {
        id: usuario.id,
        nombre: usuario.nombre || email.split('@')[0],
        email: usuario.email,
        telefono: usuario.telefono || null,
        rol: rolNombre,
      },
    });

  } catch (err) {
    console.error("❌ Error en login usuario:", err);
    return NextResponse.json({ 
      error: "Error interno del servidor", 
      detail: err.message 
    }, { status: 500 });
  }
}