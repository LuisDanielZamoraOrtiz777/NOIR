import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { neon } from "@neondatabase/serverless";

const JWT_SECRET = process.env.JWT_SECRET || "noiratelier_secret_key_change_in_production";
const SALT_ROUNDS = 10;
const PASSWORD_COMUN = "P@ssw0rd2026";

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
 * GET /api/admin/os/users
 * Lista todas las cuentas de SO con sus grupos.
 */
export async function GET(request) {
  const auth = verifyAdmin(request);
  if (auth.status !== 200) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const usuarios = await sql`
      SELECT u.id, u.username, u.full_name, u.description, u.enabled,
             u.must_change_password, u.created_at, u.last_login_at,
             u.password_changed_at,
             COALESCE(
               (SELECT array_agg(g.nombre ORDER BY g.nombre)
                  FROM os_user_groups ug
                  JOIN os_groups g ON g.id = ug.group_id
                 WHERE ug.user_id = u.id),
               ARRAY[]::TEXT[]
             ) AS grupos
      FROM os_users u
      ORDER BY u.created_at DESC
    `;
    return NextResponse.json({ status: "success", count: usuarios.length, data: usuarios });
  } catch (err) {
    console.error("Error al obtener cuentas SO:", err);
    return NextResponse.json({ error: "Error interno del servidor", detail: err.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/os/users
 * Crear una nueva cuenta de SO.
 */
export async function POST(request) {
  const auth = verifyAdmin(request);
  if (auth.status !== 200) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { username, full_name, description, groups, password, must_change_password } = body || {};

    // Validaciones
    const USERNAME_RE = /^[a-z0-9_.-]{2,32}$/i;
    if (!username || !USERNAME_RE.test(username)) {
      return NextResponse.json({ error: "Datos inválidos", detail: "username inválido (2-32 caracteres: letras, números, _ . -)" }, { status: 400 });
    }
    if (!full_name?.trim()) {
      return NextResponse.json({ error: "Datos inválidos", detail: "full_name es obligatorio" }, { status: 400 });
    }

    const sql = neon(process.env.DATABASE_URL);

    // Verificar duplicado
    const dup = await sql`SELECT id FROM os_users WHERE username = ${username}`;
    if (dup.length > 0) {
      return NextResponse.json({ error: "Conflicto", detail: `Ya existe la cuenta '${username}'` }, { status: 409 });
    }

    const plainPassword = password?.trim() || PASSWORD_COMUN;
    const hash = await bcrypt.hash(plainPassword, SALT_ROUNDS);

    const created = await sql`
      INSERT INTO os_users (username, full_name, description, password_hash, enabled, must_change_password)
      VALUES (${username.trim()}, ${full_name.trim()}, ${description?.trim() || null}, ${hash}, TRUE, ${typeof must_change_password === "boolean" ? must_change_password : true})
      RETURNING id, username, full_name, enabled, must_change_password, created_at
    `;

    const newUser = created[0];

    // Asignar grupos
    if (Array.isArray(groups) && groups.length > 0) {
      for (const groupName of groups) {
        const g = await sql`SELECT id, nombre FROM os_groups WHERE nombre = ${groupName}`;
        if (g.length > 0) {
          await sql`
            INSERT INTO os_user_groups (user_id, group_id) VALUES (${newUser.id}, ${g[0].id})
            ON CONFLICT DO NOTHING
          `;
        }
      }
    }

    // Auditoría
    try {
      const actor = auth.user?.email || "sistema";
      await sql`
        INSERT INTO os_audit_log (actor, action, target, detail)
        VALUES (${actor}, 'create', ${username}, ${JSON.stringify({ groups: groups || [] })})
      `;
    } catch { /* noop */ }

    return NextResponse.json({
      status: "success",
      message: `Cuenta '${username}' creada correctamente`,
      data: { ...newUser, grupos: groups || [] },
    }, { status: 201 });
  } catch (err) {
    console.error("Error al crear cuenta SO:", err);
    return NextResponse.json({ error: "Error interno del servidor", detail: err.message }, { status: 500 });
  }
}