const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const pool = require("../config/database");
const { validateLogin, sanitizeInput } = require("../middlewares/validate");
const { hashToken } = require("../middlewares/auth"); // Import the hash function from auth middleware

const JWT_SECRET = process.env.JWT_SECRET || "noitatelier_secret_key_change_in_production";

/**
 * POST /api/admin/login
 * Autenticar usuario contra PostgreSQL y devolver JWT.
 * Body: { email, password }
 */
router.post("/login", sanitizeInput, validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("🔐 Intento de login:", email);

    // Consultar usuario en PostgreSQL con su rol
    const result = await pool.query(`
      SELECT u.*, r.nombre as rol_nombre, r.descripcion as rol_descripcion
      FROM users u
      LEFT JOIN roles r ON r.id = u.rol_id
      WHERE u.email = $1
    `, [email]);

    if (result.rows.length === 0) {
      // Logging de intento fallido
      await logLoginAttempt(email, req.ip, false);
      return res.status(401).json({ error: "Credenciales inválidas", detail: "Email o password incorrectos" });
    }

    const usuario = result.rows[0];
    const rolNombre = usuario.rol_nombre || usuario.rol;

    // Verificar password
    const passwordValido = await bcrypt.compare(password, usuario.password_hash);

    if (!passwordValido) {
      // Logging de intento fallido
      await logLoginAttempt(email, req.ip, false);
      return res.status(401).json({ error: "Credenciales inválidas", detail: "Email o password incorrectos" });
    }

    // Verificar que sea admin (soporta tanto rol legacy como nuevo sistema)
    const esAdmin = rolNombre === "administrador" || usuario.rol === "admin" || usuario.rol === "administrador";

    if (!esAdmin) {
      // Logging de intento fallido
      await logLoginAttempt(email, req.ip, false);
      return res.status(403).json({ error: "Acceso denegado", detail: "Se requiere rol de administrador" });
    }

    // Logging de intento exitoso
    await logLoginAttempt(email, req.ip, true);

    // Generar JWT
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Decodificar el token para obtener la fecha de expiración
    const decoded = jwt.decode(token, { complete: true });
    const expiresAt = new Date(decoded.payload.exp * 1000); // exp is in seconds

    // Hash del token para almacenamiento seguro
    const tokenHash = hashToken(token);

    // Obtener IP y User-Agent
    const ip = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Guardar sesión en la base de datos
    await pool.query(
      `INSERT INTO sessions (user_id, token_hash, activa, expires_at, ip, user_agent)
       VALUES ($1, $2, true, $3, $4, $5)`,
      [usuario.id, tokenHash, expiresAt, ip, userAgent]
    );

    console.log("✅ Login exitoso:", email);

    res.status(200).json({
      status: "success",
      message: "Login exitoso",
      token,
      user: {
        id: usuario.id,
        email: usuario.email,
        rol: usuario.rol,
      },
    });
  } catch (err) {
    console.error("❌ Error en login:", err);
    res.status(500).json({ error: "Error interno del servidor", detail: err.message });
  }
});

/**
 * Función para registrar intentos de login en la BD
 */
async function logLoginAttempt(email, ip, exitoso) {
  try {
    await pool.query(
      "INSERT INTO login_intentos (email, ip, exitoso) VALUES ($1, $2, $3)",
      [email, ip, exitoso]
    );
  } catch (err) {
    // Si la tabla no existe, ignorar silenciosamente
    console.warn("⚠️ No se pudo registrar intento de login (tabla login_intentos no existe)");
  }
}

/**
 * GET /api/admin/verify
 * Verificar si el token actual es válido y retornar datos del usuario.
 * Protegido: requiere autenticación.
 */
router.get("/verify", require("../middlewares/auth").authenticate, (req, res) => {
  res.status(200).json({
    status: "success",
    user: {
      id: req.user.id,
      email: req.user.email,
      rol: req.user.rol,
    },
  });
});

/**
 * POST /api/admin/logout
 * Cerrar sesión invalidando el token en la base de datos.
 */
router.post("/logout", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No autorizado", detail: "Token no proporcionado" });
    }

    const token = authHeader.split(" ")[1];

    // Decodificar el token para obtener el user_id
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded) {
      return res.status(401).json({ error: "Token inválido", detail: "No se pudo decodificar el token" });
    }

    const userId = decoded.payload.id;

    // Hash del token para buscar en la base de datos
    const tokenHash = hashToken(token);

    // Invalidar la sesión
    await pool.query(
      "UPDATE sessions SET activa = false WHERE user_id = $1 AND token_hash = $2 AND activa = true",
      [userId, tokenHash]
    );

    res.status(200).json({ status: "success", message: "Sesión cerrada" });
  } catch (err) {
    console.error("❌ Error en logout:", err);
    res.status(500).json({ error: "Error interno del servidor", detail: err.message });
  }
});

module.exports = router;