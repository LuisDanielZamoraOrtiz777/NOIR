import { query } from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return Response.json(
        { error: "Email y contraseña son obligatorios." },
        { status: 400 }
      );
    }

    const result = await query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return Response.json(
        { error: "Credenciales inválidas." },
        { status: 401 }
      );
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return Response.json(
        { error: "Credenciales inválidas." },
        { status: 401 }
      );
    }

    if (user.rol !== "admin") {
      return Response.json(
        { error: "No tienes permisos de administrador." },
        { status: 403 }
      );
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol },
      process.env.JWT_SECRET || "noir_atelier_secret_2025",
      { expiresIn: "24h" }
    );

    return Response.json({
      status: "success",
      message: "Login exitoso",
      token,
      user: { id: user.id, email: user.email, rol: user.rol },
    });
  } catch (error) {
    console.error("Error en /api/admin/login:", error);
    return Response.json(
      { error: "Error en el servidor." },
      { status: 500 }
    );
  }
}