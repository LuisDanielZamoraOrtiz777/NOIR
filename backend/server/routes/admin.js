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
//  EDITORIALES — conectado a PostgreSQL
// ════════════════════════════════════════

/**
 * GET /api/admin/editoriales
 * Listar todas las editoriales (requiere autenticación).
 */
router.get("/editoriales", authenticate, isAdmin, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM editoriales ORDER BY fecha DESC");
    res.json({ status: "success", total: result.rows.length, data: result.rows });
  } catch (err) {
    console.error("Error al obtener editoriales:", err);
    res.status(500).json({ error: "Error interno del servidor", detail: err.message });
  }
});

/**
 * POST /api/admin/editoriales
 * Crear una nueva editorial.
 */
router.post("/editoriales", authenticate, isAdmin, async (req, res) => {
  try {
    const { titulo, autor, fecha, categoria, resumen, contenido, imagen_url, publicado } = req.body || {};

    console.log("📝 Intentando crear editorial:", { titulo, autor, categoria });

    if (!titulo?.trim()) {
      return res.status(400).json({ error: "Datos inválidos", detail: "El título es obligatorio" });
    }
    if (!resumen?.trim()) {
      return res.status(400).json({ error: "Datos inválidos", detail: "El resumen es obligatorio" });
    }

    const result = await pool.query(
      `INSERT INTO editoriales (titulo, autor, fecha, categoria, resumen, contenido, imagen_url, publicado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        titulo.trim(),
        autor?.trim() || "Equipo Editorial Noir",
        fecha || new Date().toISOString().split("T")[0],
        categoria?.trim() || "Editorial",
        resumen.trim(),
        contenido?.trim() || "",
        imagen_url?.trim() || null,
        publicado === true || publicado === "true"
      ]
    );

    console.log("✅ Editorial creada en BD:", result.rows[0]);
    res.status(201).json({ status: "success", message: "Editorial creada", data: result.rows[0] });
  } catch (err) {
    console.error("❌ Error al crear editorial:", err);
    res.status(500).json({ error: "Error interno del servidor", detail: err.message });
  }
});

/**
 * PATCH /api/admin/editoriales/:id
 * Actualizar una editorial.
 */
router.patch("/editoriales/:id", authenticate, isAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const { titulo, autor, fecha, categoria, resumen, contenido, imagen_url, publicado } = req.body || {};

    const result = await pool.query(
      `UPDATE editoriales SET
        titulo = COALESCE($1, titulo),
        autor = COALESCE($2, autor),
        fecha = COALESCE($3, fecha),
        categoria = COALESCE($4, categoria),
        resumen = COALESCE($5, resumen),
        contenido = COALESCE($6, contenido),
        imagen_url = COALESCE($7, imagen_url),
        publicado = COALESCE($8, publicado)
       WHERE id = $9 RETURNING *`,
      [
        titulo?.trim(),
        autor?.trim(),
        fecha,
        categoria?.trim(),
        resumen?.trim(),
        contenido?.trim(),
        imagen_url?.trim() || null,
        publicado === true || publicado === "true",
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No encontrado", detail: `No existe editorial ${id}` });
    }

    console.log("✅ Editorial actualizada:", result.rows[0]);
    res.json({ status: "success", message: "Editorial actualizada", data: result.rows[0] });
  } catch (err) {
    console.error("❌ Error al actualizar editorial:", err);
    res.status(500).json({ error: "Error interno del servidor", detail: err.message });
  }
});

/**
 * DELETE /api/admin/editoriales/:id
 * Eliminar una editorial.
 */
router.delete("/editoriales/:id", authenticate, isAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const result = await pool.query("DELETE FROM editoriales WHERE id = $1 RETURNING *", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No encontrado", detail: `No existe editorial ${id}` });
    }

    console.log("✅ Editorial eliminada:", result.rows[0]);
    res.json({ status: "success", message: "Editorial eliminada", data: result.rows[0] });
  } catch (err) {
    console.error("❌ Error al eliminar editorial:", err);
    res.status(500).json({ error: "Error interno del servidor", detail: err.message });
  }
});

module.exports = router;
