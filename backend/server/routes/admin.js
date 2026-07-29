const express = require("express");
const router = express.Router();
const { authenticate, isAdmin } = require("../middlewares/auth");
const pool = require("../config/database");

// ════════════════════════════════════════
//  PARTNERS — conectado a PostgreSQL
// ════════════════════════════════════════

/**
 * GET /api/admin/partners
 * Listar todas las páginas hermanas registradas en la DB.
 */
router.get("/partners", authenticate, isAdmin, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM sitios_partners ORDER BY creado_en DESC");
    res.json({ status: "success", count: result.rows.length, data: result.rows });
  } catch (err) {
    console.error("Error al obtener partners:", err);
    res.status(500).json({ error: "Error interno del servidor", detail: err.message });
  }
});

/**
 * POST /api/admin/partners
 * Registrar una nueva página hermana (nombre y url_api).
 */
router.post("/partners", authenticate, isAdmin, async (req, res) => {
  try {
    const { nombre, url_api } = req.body || {};

    console.log("📝 Intentando crear partner:", { nombre, url_api });

    if (!nombre?.trim()) {
      return res.status(400).json({ error: "Datos inválidos", detail: "El campo 'nombre' es obligatorio" });
    }
    if (!url_api?.trim()) {
      return res.status(400).json({ error: "Datos inválidos", detail: "El campo 'url_api' es obligatorio" });
    }

    try {
      new URL(url_api);
    } catch {
      return res.status(400).json({ error: "URL inválida", detail: "url_api debe ser una URL válida (ej: https://ejemplo.com)" });
    }

    const existe = await pool.query("SELECT id FROM sitios_partners WHERE url_api = $1", [url_api.trim()]);
    if (existe.rows.length > 0) {
      return res.status(409).json({ error: "Conflicto", detail: "Ya existe un partner registrado con esa URL" });
    }

    const result = await pool.query(
      "INSERT INTO sitios_partners (nombre, url_api, activo, creado_en) VALUES ($1, $2, $3, NOW()) RETURNING *",
      [nombre.trim(), url_api.trim(), true]
    );

    console.log("✅ Partner creado en BD:", result.rows[0]);
    res.status(201).json({ status: "success", message: "Partner registrado exitosamente", data: result.rows[0] });
  } catch (err) {
    console.error("❌ Error al crear partner:", err);
    res.status(500).json({ error: "Error interno del servidor", detail: err.message });
  }
});

/**
 * DELETE /api/admin/partners/:id
 * Dar de baja o eliminar un feed del Hub (baja lógica).
 */
router.delete("/partners/:id", authenticate, isAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: "ID inválido", detail: "El parámetro id debe ser un número entero positivo" });
    }

    console.log("🗑️ Desactivando partner ID:", id);

    const result = await pool.query("UPDATE sitios_partners SET activo = false WHERE id = $1 RETURNING *", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No encontrado", detail: `No existe un partner con id ${id}` });
    }

    console.log("✅ Partner desactivado:", result.rows[0]);
    res.json({ status: "success", message: "Partner desactivado exitosamente", data: result.rows[0] });
  } catch (err) {
    console.error("❌ Error al eliminar partner:", err);
    res.status(500).json({ error: "Error interno del servidor", detail: err.message });
  }
});

/**
 * PATCH /api/admin/partners/:id/activar
 * Reactivar un partner.
 */
router.patch("/partners/:id/activar", authenticate, isAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await pool.query("UPDATE sitios_partners SET activo = true WHERE id = $1 RETURNING *", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No encontrado", detail: `No existe un partner con id ${id}` });
    }

    res.json({ status: "success", message: "Partner activado", data: result.rows[0] });
  } catch (err) {
    console.error("Error al activar partner:", err);
    res.status(500).json({ error: "Error interno del servidor", detail: err.message });
  }
});

// ════════════════════════════════════════
//  USUARIOS — gestión de usuarios
// ════════════════════════════════════════

/**
 * GET /api/admin/usuarios
 * Listar todos los usuarios con su rol.
 */
router.get("/usuarios", authenticate, isAdmin, async (req, res) => {
  try {
    // Intentar con el sistema de roles (usando usuario_rol)
    try {
      const result = await pool.query(`
        SELECT u.id, u.email, u.created_at, 
               COALESCE(r.nombre, u.rol, 'usuario') as rol
        FROM users u
        LEFT JOIN usuario_rol ur ON u.id = ur.user_id AND ur.activo = true
        LEFT JOIN roles r ON ur.rol_id = r.id
        ORDER BY u.created_at DESC
      `);
      return res.json({ status: "success", count: result.rows.length, data: result.rows });
    } catch (error) {
      // Si falla, usar consulta simple con la columna rol
      const result = await pool.query(`
        SELECT id, email, created_at, rol
        FROM users
        ORDER BY created_at DESC
      `);
      return res.json({ status: "success", count: result.rows.length, data: result.rows });
    }
  } catch (err) {
    console.error("Error al obtener usuarios:", err);
    res.status(500).json({ error: "Error interno del servidor", detail: err.message });
  }
});

/**
 * PATCH /api/admin/usuarios/:id
 * Cambiar el rol de un usuario.
 * Body: { rol: "administrador" | "editor" | "usuario" }
 */
router.patch("/usuarios/:id", authenticate, isAdmin, async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const { rol } = req.body;

    if (isNaN(userId) || userId <= 0) {
      return res.status(400).json({ error: "ID inválido", detail: "El parámetro id debe ser un número entero positivo" });
    }

    if (!rol || !["administrador", "editor", "usuario"].includes(rol)) {
      return res.status(400).json({ error: "Rol inválido", detail: "El rol debe ser: administrador, editor o usuario" });
    }

    // 1. Actualizar la columna rol en la tabla users
    await pool.query("UPDATE users SET rol = $1 WHERE id = $2", [rol, userId]);

    // 2. Obtener el ID del rol desde la tabla roles
    const rolResult = await pool.query("SELECT id FROM roles WHERE nombre = $1", [rol]);
    if (rolResult.rows.length > 0) {
      const rolId = rolResult.rows[0].id;
      // 3. Actualizar o insertar en usuario_rol
      const existe = await pool.query("SELECT id FROM usuario_rol WHERE user_id = $1", [userId]);
      if (existe.rows.length > 0) {
        await pool.query("UPDATE usuario_rol SET rol_id = $1, activo = true WHERE user_id = $2", [rolId, userId]);
      } else {
        await pool.query("INSERT INTO usuario_rol (user_id, rol_id, activo) VALUES ($1, $2, true)", [userId, rolId]);
      }
    }

    // Obtener el usuario actualizado
    const result = await pool.query("SELECT id, email, created_at, rol FROM users WHERE id = $1", [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado", detail: `No existe un usuario con id ${userId}` });
    }

    console.log("✅ Rol actualizado para usuario", userId, "a", rol);
    res.json({ status: "success", message: "Rol actualizado exitosamente", data: result.rows[0] });
  } catch (err) {
    console.error("Error al actualizar rol:", err);
    res.status(500).json({ error: "Error interno del servidor", detail: err.message });
  }
});

/**
 * DELETE /api/admin/usuarios/:id
 * Eliminar un usuario.
 */
router.delete("/usuarios/:id", authenticate, isAdmin, async (req, res) => {
  try {
    const userId = Number(req.params.id);

    if (isNaN(userId) || userId <= 0) {
      return res.status(400).json({ error: "ID inválido", detail: "El parámetro id debe ser un número entero positivo" });
    }

    // No permitir eliminar el propio usuario
    if (req.user.id === userId) {
      return res.status(400).json({ error: "Operación no permitida", detail: "No puedes eliminar tu propio usuario" });
    }

    const result = await pool.query("DELETE FROM users WHERE id = $1 RETURNING id, email", [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No encontrado", detail: `No existe un usuario con id ${userId}` });
    }

    res.json({ status: "success", message: "Usuario eliminado exitosamente", data: result.rows[0] });
  } catch (err) {
    console.error("Error al eliminar usuario:", err);
    res.status(500).json({ error: "Error interno del servidor", detail: err.message });
  }
});

// ════════════════════════════════════════
//  SESIONES — gestión de sesiones activas
// ════════════════════════════════════════

/**
 * GET /api/admin/contactos
 * Listar mensajes enviados por usuarios desde el formulario de contacto.
 */
router.get("/contactos", authenticate, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, message, created_at FROM contacts ORDER BY created_at DESC"
    );
    res.json({ status: "success", count: result.rows.length, data: result.rows });
  } catch (err) {
    console.error("Error al obtener contactos:", err);
    res.status(500).json({ error: "Error interno del servidor", detail: err.message });
  }
});


/**
 * GET /api/admin/sesiones
 * Listar todas las sesiones activas.
 */
router.get("/sesiones", authenticate, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.id, s.user_id, u.email, s.token_hash, s.activa, s.expires_at, s.creado_en
      FROM sesiones s
      LEFT JOIN users u ON s.user_id = u.id
      ORDER BY s.creado_en DESC
    `);
    res.json({ status: "success", count: result.rows.length, data: result.rows });
  } catch (err) {
    console.error("Error al obtener sesiones:", err);
    res.status(500).json({ error: "Error interno del servidor", detail: err.message });
  }
});

/**
 * DELETE /api/admin/sesiones/:id
 * Revocar una sesión individual.
 */
router.delete("/sesiones/:id", authenticate, isAdmin, async (req, res) => {
  try {
    const sessionId = Number(req.params.id);

    if (isNaN(sessionId) || sessionId <= 0) {
      return res.status(400).json({ error: "ID inválido", detail: "El parámetro id debe ser un número entero positivo" });
    }

    const result = await pool.query("UPDATE sesiones SET activa = false WHERE id = $1 RETURNING id, user_id", [sessionId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No encontrado", detail: `No existe una sesión con id ${sessionId}` });
    }

    res.json({ status: "success", message: "Sesión revocada exitosamente" });
  } catch (err) {
    console.error("Error al revocar sesión:", err);
    res.status(500).json({ error: "Error interno del servidor", detail: err.message });
  }
});


// ══════════════════════════════════════════
//  PEDIDOS — gestión de pedidos
// ══════════════════════════════════════════

/**
 * GET /api/admin/pedidos
 * Listar pedidos con filtro opcional por estado.
 */
router.get("/pedidos", authenticate, isAdmin, async (req, res) => {
  try {
    const { estado } = req.query;
    let query = `SELECT p.id, p.user_id, p.cliente_nombre, p.cliente_telefono, p.cliente_email, p.total, p.estado, p.canal, p.notas, p.creado_en,
                 u.email AS user_email
                 FROM pedidos p
                 LEFT JOIN users u ON p.user_id = u.id`;
    const values = [];
    if (estado) {
      query += ` WHERE p.estado = $1`;
      values.push(estado);
    }
    query += ` ORDER BY p.creado_en DESC`;

    const result = await pool.query(query, values);

    // For each order, fetch the items
    const ordersWithItems = [];
    for (const order of result.rows) {
      const itemsResult = await pool.query(
        `SELECT pi.id, pi.producto_id, pi.nombre_producto, pi.precio_unitario, pi.cantidad, pi.subtotal
         FROM pedido_items pi
         WHERE pi.pedido_id = $1
         ORDER BY pi.id`,
        [order.id]
      );
      order.items = itemsResult.rows;
      ordersWithItems.push(order);
    }

    res.json({ status: 'success', count: ordersWithItems.length, data: ordersWithItems });
  } catch (err) {
    console.error('Error al obtener pedidos:', err);
    res.status(500).json({ error: 'Error interno del servidor', detail: err.message });
  }
});

/**
 * PATCH /api/admin/pedidos/:id
 * Actualizar el estado de un pedido.
 * Body: { estado: 'pendiente' | 'contactado' | 'completado' | 'cancelado' */
router.patch('/pedidos/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!estado || !['pendiente', 'contactado', 'completado', 'cancelado'].includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido', detail: 'El estado debe ser uno de: pendiente, contactado, completado, cancelado' });
    }

    const result = await pool.query(
      'UPDATE pedidos SET estado = $1 WHERE id = $2 RETURNING *',
      [estado, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Pedido no encontrado', detail: `No existe un pedido con id ${id}` });
    }

    // Fetch the updated order with items and user info
    const orderResult = await pool.query(
      `SELECT p.id, p.user_id, p.cliente_nombre, p.cliente_telefono, p.cliente_email, p.total, p.estado, p.canal, p.notas, p.creado_en,
              u.email AS user_email
       FROM pedidos p
       LEFT JOIN users u ON p.user_id = u.id
       WHERE p.id = $1`,
      [id]
    );

    const order = orderResult.rows[0];

    // Fetch items
    const itemsResult = await pool.query(
      `SELECT pi.id, pi.producto_id, pi.nombre_producto, pi.precio_unitario, pi.cantidad, pi.subtotal
       FROM pedido_items pi
       WHERE pi.pedido_id = $1
       ORDER BY pi.id`,
      [id]
    );
    order.items = itemsResult.rows;

    res.json({ status: 'success', message: 'Estado del pedido actualizado exitosamente', data: order });
  } catch (err) {
    console.error('Error al actualizar el pedido:', err);
    res.status(500).json({ error: 'Error interno del servidor', detail: err.message });
  }
});


module.exports = router;

