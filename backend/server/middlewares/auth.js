const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "noiratelier_secret_key_change_in_production";

/**
 * Middleware que verifica que el usuario esté autenticado mediante JWT.
 * Extrae el token del header Authorization: Bearer <token>.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No autorizado", detail: "Token no proporcionado" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
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

  if (req.user.rol !== "admin") {
    return res.status(403).json({ error: "Acceso denegado", detail: "Se requiere rol de administrador" });
  }

  next();
}

module.exports = { authenticate, isAdmin };