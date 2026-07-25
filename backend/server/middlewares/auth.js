const jwt = require("jsonwebtoken");
const { Pool } = require('pg');
const crypto = require('crypto');
const bcrypt = require("bcrypt");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgres://postgres:12345678@localhost:5432/noir_atelier",
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

const JWT_SECRET = process.env.JWT_SECRET || "noitatelier_secret_key_change_in_production";

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Middleware que verifica que el usuario esté autenticado mediante JWT y que la sesión esté activa.
 * Extrae el token del header Authorization: Bearer <token>.
 */
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No autorizado", detail: "Token no proporcionado" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Verificar que la sesión esté activa en la base de datos
    const tokenHash = hashToken(token);
    const sessionResult = await pool.query(
      "SELECT * FROM sessions WHERE user_id = $1 AND token_hash = $2 AND activa = true AND expires_at > NOW()",
      [decoded.id, tokenHash]
    );

    if (sessionResult.rowCount === 0) {
      return res.status(401).json({ error: "Token inválido o sesión expirada", detail: "Sesión no encontrada o inactiva" });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido o expirado", detail: err.message });
  }
}

/**
 * Middleware que verifica que el usuario autenticado tenga rol de 'admin'.
 * Debe usarse DESPUÉS de authenticate.
 */
function isAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "No autorizado", detail: "Usuario no autenticado" });
  }

  if (req.user.rol !== "admin" && req.user.rol !== "administrador") {
    return res.status(403).json({ error: "Acceso denegado", detail: "Se requiere rol de administrador" });
  }

  next();
}

/**
 * Middleware que verifica que el usuario autenticado tenga rol de 'editor' o 'admin'.
 * Debe usarse DESPUÉS de authenticate.
 */
function isEditor(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "No autorizado", detail: "Usuario no autenticado" });
  }

  if (req.user.rol !== "editor" && req.user.rol !== "admin" && req.user.rol !== "administrador") {
    return res.status(403).json({ error: "Acceso denegado", detail: "Se requiere rol de editor o administrador" });
  }

  next();
}

module.exports = { authenticate, isAdmin, isEditor };