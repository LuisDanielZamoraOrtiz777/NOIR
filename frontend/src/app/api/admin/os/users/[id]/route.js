import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { neon } from "@neondatabase/serverless";

const JWT_SECRET = process.env.JWT_SECRET || "noiratelier_secret_key_change_in_production";

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
 * PATCH /api/admin/os/users/[id]
 * Modificar full_name, description, must_change_password o groups.
 */
export async function PATCH(request, { params }) {
  const auth = verifyAdmin(request);
  if (auth.status !== 200) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const body = await request.json();
    const { full_name, description, must_change_password, groups } = body || {};

    // Verificar que la cuenta existe
    const u = await sql`SELECT * FROM os_users WHERE id = ${id}`;
    if (u.length === 0) {
      return NextResponse.json({ error: "No encontrado", detail: "Cuenta no existe" }, { status: 404 });
    }
    const target = u[0].username;

    // Actualizar campos individuales
    for (const field of Object.keys(body)) {
      if (field === "groups") continue;
      if (field === "full_name" && full_name !== undefined) {
        if (!full_name?.trim()) {
          return NextResponse.json({ error: "full_name no puede ser vacío" }, { status: 400 });
        }
        await sql`UPDATE os_users SET full_name = ${full_name.trim()} WHERE id = ${id}`;
      } else if (field === "description" && description !== undefined) {
        await sql`UPDATE os_users SET description = ${description?.trim() || null} WHERE id = ${id}`;
      } else if (field === "must_change_password" && typeof must_change_password === "boolean") {
        await sql`UPDATE os_users SET must_change_password = ${must_change_password} WHERE id = ${id}`;
      }
    }

    // Actualizar grupos
    if (Array.isArray(groups)) {
      await sql`DELETE FROM os_user_groups WHERE user_id = ${id}`;
      for (const groupName of groups) {
        const g = await sql`SELECT id FROM os_groups WHERE nombre = ${groupName}`;
        if (g.length > 0) {
          await sql`
            INSERT INTO os_user_groups (user_id, group_id) VALUES (${id}, ${g[0].id})
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
        VALUES (${actor}, 'update', ${target}, ${JSON.stringify({ full_name, description, must_change_password, groups })})
      `;
    } catch { /* noop */ }

    // Obtener datos actualizados
    const final = await sql`
      SELECT u.id, u.username, u.full_name, u.description, u.enabled,
             u.must_change_password, u.created_at, u.last_login_at,
             COALESCE(
               (SELECT array_agg(g.nombre ORDER BY g.nombre)
                  FROM os_user_groups ug JOIN os_groups g ON g.id = ug.group_id
                 WHERE ug.user_id = u.id), ARRAY[]::TEXT[]) AS grupos
      FROM os_users u WHERE u.id = ${id}
    `;

    return NextResponse.json({ status: "success", message: "Cuenta actualizada", data: final[0] });
  } catch (err) {
    console.error("Error al actualizar cuenta SO:", err);
    return NextResponse.json({ error: "Error interno del servidor", detail: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/os/users/[id]
 * Elimina la cuenta físicamente.
 */
export async function DELETE(request, { params }) {
  const auth = verifyAdmin(request);
  if (auth.status !== 200) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const r = await sql`DELETE FROM os_users WHERE id = ${id} RETURNING username`;
    if (r.length === 0) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    // Auditoría
    try {
      const actor = auth.user?.email || "sistema";
      await sql`
        INSERT INTO os_audit_log (actor, action, target, detail)
        VALUES (${actor}, 'delete', ${r[0].username}, null)
      `;
    } catch { /* noop */ }

    return NextResponse.json({
      status: "success",
      message: `Cuenta '${r[0].username}' eliminada (información no recuperable)`,
    });
  } catch (err) {
    console.error("Error al eliminar cuenta SO:", err);
    return NextResponse.json({ error: "Error interno del servidor", detail: err.message }, { status: 500 });
  }
}