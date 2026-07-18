const express = require("express");
const router = express.Router();
const { authenticate, isEditor } = require("../middlewares/auth");
const pool = require("../config/database");

// ════════════════════════════════════════
//  EDITORIALES — conectado a PostgreSQL
//  Accesible para editores y administradores
// ════════════════════════════════════════

/**
 * GET /api/editor/editoriales
 * Listar todas las editoriales (requiere autenticación de editor/admin).
 */
router.get("/editoriales", authenticate, isEditor, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM editoriales ORDER BY fecha DESC");
    res.json({ status: "success", total: result.rows.length, data: result.rows });
  } catch (err) {
    console.error("Error al obtener editoriales:", err);
    res.status(500).json({ error: "Error interno del servidor", detail: err.message });
  }
});

/**
 * POST /api/editor/editoriales
 * Crear una nueva editorial.
 */
router.post("/editoriales", authenticate, isEditor, async (req, res) => {
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
 * PATCH /api/editor/editoriales/:id
 * Actualizar una editorial.
 */
router.patch("/editoriales/:id", authenticate, isEditor, async (req, res) => {
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
 * DELETE /api/editor/editoriales/:id
 * Eliminar una editorial.
 */
router.delete("/editoriales/:id", authenticate, isEditor, async (req, res) => {
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