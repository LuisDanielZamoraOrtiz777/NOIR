import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { neon } from "@neondatabase/serverless";

/**
 * POST /api/admin/os/login
 * Simula el inicio de sesión de una cuenta de SO.
 * NO requiere JWT (es la simulación del cliente).
 * Body: { username, password }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { username, password } = body || {};

    if (!username || !password) {
      return NextResponse.json({ error: "Datos incompletos", detail: "username y password son obligatorios" }, { status: 400 });
    }

    const sql = neon(process.env.DATABASE_URL);
    const r = await sql`
      SELECT id, username, full_name, enabled, password_hash FROM os_users WHERE username = ${username}
    `;

    // Función para registrar intento
    const registrar = async (exitoso, motivo) => {
      try {
        await sql`
          INSERT INTO os_login_attempts (username, exitoso, motivo) VALUES (${username}, ${exitoso}, ${motivo})
        `;
      } catch { /* noop */ }
    };

    if (r.length === 0) {
      await registrar(false, "usuario_no_existe");
      return NextResponse.json({
        status: "error",
        detail: "El nombre de usuario o la contraseña es incorrecta.",
        code: "INVALID_CREDENTIALS",
      }, { status: 401 });
    }

    const cuenta = r[0];

    if (!cuenta.enabled) {
      await registrar(false, "cuenta_deshabilitada");
      return NextResponse.json({
        status: "error",
        detail: "La cuenta del usuario está deshabilitada. El usuario no puede iniciar sesión.",
        code: "ACCOUNT_DISABLED",
        data: { username: cuenta.username, enabled: false },
      }, { status: 403 });
    }

    const ok = await bcrypt.compare(password, cuenta.password_hash);
    if (!ok) {
      await registrar(false, "credenciales_invalidas");
      return NextResponse.json({
        status: "error",
        detail: "El nombre de usuario o la contraseña es incorrecta.",
        code: "INVALID_CREDENTIALS",
      }, { status: 401 });
    }

    await sql`UPDATE os_users SET last_login_at = NOW() WHERE id = ${cuenta.id}`;
    await registrar(true, "ok");

    return NextResponse.json({
      status: "success",
      message: `Inicio de sesión exitoso para '${cuenta.username}'.`,
      data: {
        id: cuenta.id,
        username: cuenta.username,
        full_name: cuenta.full_name,
        enabled: cuenta.enabled,
        last_login_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("Error en login simulado SO:", err);
    return NextResponse.json({ error: "Error interno del servidor", detail: err.message }, { status: 500 });
  }
}