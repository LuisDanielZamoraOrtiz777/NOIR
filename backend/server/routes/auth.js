const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const pool = require("../config/database");

const JWT_SECRET = process.env.JWT_SECRET || "noiratelier_secret_key_change_in_production";

/**
 * POST /api/admin/login
 * Autenticar usuario contra PostgreSQL y devolver JWT.
 * Body: { email, password }
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("🔐 Intento de login:", email);

    // Validaciones básicas
    if (!email || !password) {
      return res.status(400).json({ error: "Datos incompletos", detail: "Email y password son obligatorios" });
    }

    // Consultar usuario en PostgreSQL con su rol
    const result = await pool.query(`
      SELECT u.*, r.nombre as rol_nombre, r.descripcion as rol_descripcion
      FROM users u
      LEFT JOIN roles r ON r.id = u.rol_id
      WHERE u.email = $1
    `, [email]);

    if (result.rows.length === 0) {
      console.log("❌ Usuario no encontrado:", email);
      return res.status(401).json({ error: "Credenciales inválidas", detail: "Email o password incorrectos" });
    }

    const usuario = result.rows[0];
    const rolNombre = usuario.rol_nombre || usuario.rol;
    console.log("✅ Usuario encontrado:", usuario.email, "Rol:", rolNombre);

    // Verificar password
    const passwordValido = await bcrypt.compare(password, usuario.password_hash);

    if (!passwordValido) {
      console.log("❌ Password incorrecto para:", email);
      return res.status(401).json({ error: "Credenciales inválidas", detail: "Email o password incorrectos" });
    }

    // Verificar que sea admin (soporta tanto rol legacy como nuevo sistema)
    const esAdmin = rolNombre === "administrador" || usuario.rol === "admin" || usuario.rol === "administrador";
    
    if (!esAdmin) {
      console.log("❌ Usuario no es admin:", email);
      return res.status(403).json({ error: "Acceso denegado", detail: "Se requiere rol de administrador" });
    }

    // Generar JWT
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol },
      JWT_SECRET,
      { expiresIn: "24h" }
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
 * Cerrar sesión (en el futuro podría invalidar el token en la DB).
 */
router.post("/logout", (req, res) => {
  res.status(200).json({ status: "success", message: "Sesión cerrada" });
});

module.exports = router;
