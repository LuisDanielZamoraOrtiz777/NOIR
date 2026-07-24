// ═══════════════════════════════════════════════════════════════════
//  Administración de cuentas de Sistema Operativo (Windows-style)
//  Permite crear, modificar, habilitar, deshabilitar, eliminar y
//  simular inicio de sesión de cuentas locales. Pensado como apoyo
//  a la práctica de "administración de cuentas de usuario en un SO".
// ═══════════════════════════════════════════════════════════════════
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const pool = require("../config/database");
const { authenticate, isAdmin } = require("../middlewares/auth");
const asyncHandler = require("../utils/asyncHandler");

const SALT_ROUNDS = 10;
const PASSWORD_COMUN = "P@ssw0rd2026"; // contraseña para las cuentas de práctica

// ── Helpers ────────────────────────────────────────────────────
function actorDe(req) {
  return req.user?.email || req.user?.id?.toString() || "sistema";
}

async function audit(actor, action, target, detail) {
  try {
    await pool.query(
      "INSERT INTO os_audit_log (actor, action, target, detail) VALUES ($1, $2, $3, $4)",
      [actor, action, target, detail ? JSON.stringify(detail) : null]
    );
  } catch (e) {
    console.warn("No se pudo escribir en os_audit_log:", e.message);
  }
}

const USERNAME_RE = /^[a-z0-9_.-]{2,32}$/i;

function validarUsername(s) {
  if (!s || !USERNAME_RE.test(s)) {
    return "username inválido (2-32 caracteres: letras, números, _ . -)";
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════
//  GET /api/admin/os/users
//  Lista todas las cuentas de SO con sus grupos agregados.
// ═══════════════════════════════════════════════════════════════
router.get(
  "/users",
  authenticate,
  isAdmin,
  asyncHandler(async (_req, res) => {
    const r = await pool.query(`
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
    `);
    res.json({ status: "success", count: r.rows.length, data: r.rows });
  })
);

// ═══════════════════════════════════════════════════════════════
//  GET /api/admin/os/groups
// ═══════════════════════════════════════════════════════════════
router.get(
  "/groups",
  authenticate,
  isAdmin,
  asyncHandler(async (_req, res) => {
    const r = await pool.query(`
      SELECT g.id, g.nombre, g.descripcion, g.created_at,
             (SELECT count(*) FROM os_user_groups ug WHERE ug.group_id = g.id) AS miembros
      FROM os_groups g
      ORDER BY g.nombre
    `);
    res.json({ status: "success", data: r.rows });
  })
);

// ═══════════════════════════════════════════════════════════════
//  POST /api/admin/os/users
//  Crear cuenta de SO.
//  Body: { username, full_name, description?, groups?: string[], password?, must_change_password? }
// ═══════════════════════════════════════════════════════════════
router.post(
  "/users",
  authenticate,
  isAdmin,
  asyncHandler(async (req, res) => {
    const { username, full_name, description, groups, password, must_change_password } =
      req.body || {};

    const errUsername = validarUsername(username);
    if (errUsername) {
      return res.status(400).json({ error: "Datos inválidos", detail: errUsername });
    }
    if (!full_name?.trim()) {
      return res.status(400).json({ error: "Datos inválidos", detail: "full_name es obligatorio" });
    }

    const dup = await pool.query("SELECT id FROM os_users WHERE username = $1", [username]);
    if (dup.rows.length > 0) {
      return res.status(409).json({ error: "Conflicto", detail: `Ya existe la cuenta '${username}'` });
    }

    const plainPassword = password?.trim() || PASSWORD_COMUN;
    const hash = await bcrypt.hash(plainPassword, SALT_ROUNDS);

    const ins = await pool.query(
      `INSERT INTO os_users (username, full_name, description, password_hash, enabled, must_change_password)
       VALUES ($1, $2, $3, $4, TRUE, $5) RETURNING id, username, full_name, enabled, must_change_password, created_at`,
      [
        username.trim(),
        full_name.trim(),
        description?.trim() || null,
        hash,
        typeof must_change_password === "boolean" ? must_change_password : true,
      ]
    );
    const created = ins.rows[0];

    // Asignar grupos si los proporcionaron (si no, queda sin grupo = nivel "sin permisos")
    if (Array.isArray(groups) && groups.length > 0) {
      const placeholders = groups.map((_, i) => `$${i + 1}`).join(",");
      const g = await pool.query(
        `SELECT id, nombre FROM os_groups WHERE nombre IN (${placeholders})`,
        groups
      );
      for (const row of g.rows) {
        await pool.query(
          "INSERT INTO os_user_groups (user_id, group_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
          [created.id, row.id]
        );
      }
    }

    await audit(actorDe(req), "create", username, { groups: groups || [] });

    res.status(201).json({
      status: "success",
      message: `Cuenta '${username}' creada correctamente`,
      data: { ...created, grupos: groups || [] },
    });
  })
);

// ═══════════════════════════════════════════════════════════════
//  PATCH /api/admin/os/users/:id
//  Modificar full_name, description, must_change_password o groups.
//  Body: { full_name?, description?, must_change_password?, groups? }
// ═══════════════════════════════════════════════════════════════
router.patch(
  "/users/:id",
  authenticate,
  isAdmin,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: "ID inválido" });
    }
    const { full_name, description, must_change_password, groups } = req.body || {};

    const u = await pool.query("SELECT * FROM os_users WHERE id = $1", [id]);
    if (u.rows.length === 0) {
      return res.status(404).json({ error: "No encontrado", detail: "Cuenta no existe" });
    }
    const target = u.rows[0].username;

    const fields = [];
    const values = [];
    let i = 1;
    if (full_name !== undefined) {
      if (!full_name?.trim())
        return res.status(400).json({ error: "full_name no puede ser vacío" });
      fields.push(`full_name = $${i++}`);
      values.push(full_name.trim());
    }
    if (description !== undefined) {
      fields.push(`description = $${i++}`);
      values.push(description?.trim() || null);
    }
    if (typeof must_change_password === "boolean") {
      fields.push(`must_change_password = $${i++}`);
      values.push(must_change_password);
    }
    if (fields.length) {
      values.push(id);
      await pool.query(
        `UPDATE os_users SET ${fields.join(", ")} WHERE id = $${i}`,
        values
      );
    }

    if (Array.isArray(groups)) {
      await pool.query("DELETE FROM os_user_groups WHERE user_id = $1", [id]);
      if (groups.length) {
        const placeholders = groups.map((_, j) => `$${j + 2}`).join(",");
        const g = await pool.query(
          `SELECT id, nombre FROM os_groups WHERE nombre IN (${placeholders})`,
          [id, ...groups]
        );
        for (const row of g.rows) {
          await pool.query(
            "INSERT INTO os_user_groups (user_id, group_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            [id, row.id]
          );
        }
      }
    }

    await audit(actorDe(req), "update", target, { full_name, description, must_change_password, groups });

    const final = await pool.query(
      `SELECT u.id, u.username, u.full_name, u.description, u.enabled,
              u.must_change_password, u.created_at, u.last_login_at,
              COALESCE(
                (SELECT array_agg(g.nombre ORDER BY g.nombre)
                   FROM os_user_groups ug JOIN os_groups g ON g.id = ug.group_id
                  WHERE ug.user_id = u.id), ARRAY[]::TEXT[]) AS grupos
         FROM os_users u WHERE u.id = $1`,
      [id]
    );

    res.json({ status: "success", message: "Cuenta actualizada", data: final.rows[0] });
  })
);

// ═══════════════════════════════════════════════════════════════
//  POST /api/admin/os/users/:id/disable
//  Deshabilita la cuenta (enabled = false). El usuario no podrá
//  iniciar sesión, pero la información se conserva.
// ═══════════════════════════════════════════════════════════════
router.post(
  "/users/:id/disable",
  authenticate,
  isAdmin,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: "ID inválido" });
    }
    const r = await pool.query(
      "UPDATE os_users SET enabled = FALSE WHERE id = $1 RETURNING username, enabled",
      [id]
    );
    if (r.rows.length === 0) {
      return res.status(404).json({ error: "No encontrado", detail: "Cuenta no existe" });
    }
    await audit(actorDe(req), "disable", r.rows[0].username, null);
    res.json({
      status: "success",
      message: `Cuenta '${r.rows[0].username}' deshabilitada`,
      data: r.rows[0],
    });
  })
);

// ═══════════════════════════════════════════════════════════════
//  POST /api/admin/os/users/:id/enable
// ═══════════════════════════════════════════════════════════════
router.post(
  "/users/:id/enable",
  authenticate,
  isAdmin,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: "ID inválido" });
    }
    const r = await pool.query(
      "UPDATE os_users SET enabled = TRUE WHERE id = $1 RETURNING username, enabled",
      [id]
    );
    if (r.rows.length === 0) {
      return res.status(404).json({ error: "No encontrado", detail: "Cuenta no existe" });
    }
    await audit(actorDe(req), "enable", r.rows[0].username, null);
    res.json({
      status: "success",
      message: `Cuenta '${r.rows[0].username}' habilitada`,
      data: r.rows[0],
    });
  })
);

// ═══════════════════════════════════════════════════════════════
//  POST /api/admin/os/users/:id/reset-password
//  Restablece la contraseña a la contraseña común de la práctica.
// ═══════════════════════════════════════════════════════════════
router.post(
  "/users/:id/reset-password",
  authenticate,
  isAdmin,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: "ID inválido" });
    }
    const u = await pool.query("SELECT username FROM os_users WHERE id = $1", [id]);
    if (u.rows.length === 0) {
      return res.status(404).json({ error: "No encontrado" });
    }
    const hash = await bcrypt.hash(PASSWORD_COMUN, SALT_ROUNDS);
    await pool.query(
      "UPDATE os_users SET password_hash = $1, must_change_password = TRUE, password_changed_at = NOW() WHERE id = $2",
      [hash, id]
    );
    await audit(actorDe(req), "change_password", u.rows[0].username, { reset: true });
    res.json({ status: "success", message: `Contraseña de '${u.rows[0].username}' restablecida` });
  })
);

// ═══════════════════════════════════════════════════════════════
//  DELETE /api/admin/os/users/:id
//  Elimina la cuenta (información y archivos se pierden).
// ═══════════════════════════════════════════════════════════════
router.delete(
  "/users/:id",
  authenticate,
  isAdmin,
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: "ID inválido" });
    }
    const r = await pool.query(
      "DELETE FROM os_users WHERE id = $1 RETURNING username",
      [id]
    );
    if (r.rows.length === 0) {
      return res.status(404).json({ error: "No encontrado" });
    }
    await audit(actorDe(req), "delete", r.rows[0].username, null);
    res.json({
      status: "success",
      message: `Cuenta '${r.rows[0].username}' eliminada (información no recuperable)`,
    });
  })
);

// ═══════════════════════════════════════════════════════════════
//  POST /api/admin/os/login
//  Simula el inicio de sesión. NO requiere JWT de admin (es la
//  simulación del cliente que quiere saber si la cuenta entra o no).
//  Body: { username, password }
// ═══════════════════════════════════════════════════════════════
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: "Datos incompletos", detail: "username y password son obligatorios" });
    }
    const r = await pool.query(
      "SELECT id, username, full_name, enabled, password_hash FROM os_users WHERE username = $1",
      [username]
    );

    // Registrar intento siempre (auditoría)
    const registrar = async (exitoso, motivo) => {
      try {
        await pool.query(
          "INSERT INTO os_login_attempts (username, exitoso, motivo) VALUES ($1, $2, $3)",
          [username, exitoso, motivo]
        );
      } catch (_) {}
    };

    if (r.rows.length === 0) {
      await registrar(false, "usuario_no_existe");
      return res.status(401).json({
        status: "error",
        detail: "El nombre de usuario o la contraseña es incorrecta.",
        code: "INVALID_CREDENTIALS",
      });
    }
    const cuenta = r.rows[0];

    if (!cuenta.enabled) {
      await registrar(false, "cuenta_deshabilitada");
      return res.status(403).json({
        status: "error",
        detail: "La cuenta del usuario está deshabilitada. El usuario no puede iniciar sesión.",
        code: "ACCOUNT_DISABLED",
        data: { username: cuenta.username, enabled: false },
      });
    }

    const ok = await bcrypt.compare(password, cuenta.password_hash);
    if (!ok) {
      await registrar(false, "credenciales_invalidas");
      return res.status(401).json({
        status: "error",
        detail: "El nombre de usuario o la contraseña es incorrecta.",
        code: "INVALID_CREDENTIALS",
      });
    }

    await pool.query("UPDATE os_users SET last_login_at = NOW() WHERE id = $1", [cuenta.id]);
    await registrar(true, "ok");

    res.json({
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
  })
);

// ═══════════════════════════════════════════════════════════════
//  GET /api/admin/os/audit
//  Bitácora de cambios sobre las cuentas.
// ═══════════════════════════════════════════════════════════════
router.get(
  "/audit",
  authenticate,
  isAdmin,
  asyncHandler(async (_req, res) => {
    const r = await pool.query(
      "SELECT id, actor, action, target, detail, created_at FROM os_audit_log ORDER BY created_at DESC LIMIT 200"
    );
    res.json({ status: "success", count: r.rows.length, data: r.rows });
  })
);

// ═══════════════════════════════════════════════════════════════
//  GET /api/admin/os/login-attempts
//  Historial de intentos de login (simulación).
// ═══════════════════════════════════════════════════════════════
router.get(
  "/login-attempts",
  authenticate,
  isAdmin,
  asyncHandler(async (_req, res) => {
    const r = await pool.query(
      "SELECT id, username, exitoso, motivo, created_at FROM os_login_attempts ORDER BY created_at DESC LIMIT 200"
    );
    res.json({ status: "success", count: r.rows.length, data: r.rows });
  })
);

module.exports = router;
