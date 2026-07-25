const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const pool = require("../config/database");

const JWT_SECRET = process.env.JWT_SECRET || "noiratelier_secret_key_change_in_production";

/**
 * POST /api/auth/register
 * Registrar un nuevo usuario normal.
 * Body: { nombre, email, password, telefono? }
 */
router.post("/register", async (req, res) => {
  try {
    const { nombre, email, password, telefono } = req.body || {};

    // Validaciones
    if (!nombre?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ 
        error: "Datos incompletos", 
        detail: "Nombre, email y password son obligatorios" 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: "Password muy corto", 
        detail: "El password debe tener al menos 6 caracteres" 
      });
    }

    // Verificar si el email ya existe
    const existe = await pool.query("SELECT id FROM users WHERE email = $1", [email.trim()]);
    if (existe.rows.length > 0) {
      return res.status(409).json({ 
        error: "Email ya registrado", 
        detail: "Este correo electrónico ya está en uso" 
      });
    }

    // Hash del password
    const passwordHash = await bcrypt.hash(password, 10);

    // Obtener rol de usuario por defecto
    const rolResult = await pool.query("SELECT id FROM roles WHERE nombre = 'usuario'");
    const rolId = rolResult.rows.length > 0 ? rolResult.rows[0].id : null;

    // Crear usuario
    const result = await pool.query(
      `INSERT INTO users (nombre, email, password_hash, telefono, rol_id, activo, creado_en) 
       VALUES ($1, $2, $3, $4, $5, true, NOW()) RETURNING id, nombre, email, telefono, creado_en`,
      [nombre.trim(), email.trim(), passwordHash, telefono?.trim() || null, rolId]
    );

    const usuario = result.rows[0];
    console.log("✅ Usuario registrado:", usuario.email);

    // Generar JWT
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: "usuario" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      status: "success",
      message: "Usuario registrado exitosamente",
      token,
      user: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        telefono: usuario.telefono,
        rol: "usuario",
      },
    });
  } catch (err) {
    console.error("❌ Error en registro:", err);
    res.status(500).json({ error: "Error interno del servidor", detail: err.message });
  }
});

/**
 * POST /api/auth/login
 * Autenticar usuario normal (no admin).
 * Body: { email, password }
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("🔐 Intento de login usuario:", email);

    // Validaciones
    if (!email || !password) {
      return res.status(400).json({ error: "Datos incompletos", detail: "Email y password son obligatorios" });
    }

    // Consultar usuario
    const result = await pool.query(`
      SELECT u.*, r.nombre as rol_nombre
      FROM users u
      LEFT JOIN roles r ON r.id = u.rol_id
      WHERE u.email = $1 AND u.activo = true
    `, [email]);

    if (result.rows.length === 0) {
      console.log("❌ Usuario no encontrado:", email);
      return res.status(401).json({ error: "Credenciales inválidas", detail: "Email o password incorrectos" });
    }

    const usuario = result.rows[0];
    const rolNombre = usuario.rol_nombre || usuario.rol || "usuario";

    // Verificar password
    const passwordValido = await bcrypt.compare(password, usuario.password_hash);

    if (!passwordValido) {
      console.log("❌ Password incorrecto para:", email);
      return res.status(401).json({ error: "Credenciales inválidas", detail: "Email o password incorrectos" });
    }

    // No permitir admins en este login
    if (rolNombre === "administrador" || usuario.rol === "admin") {
      return res.status(403).json({ 
        error: "Acceso denegado", 
        detail: "Los administradores deben usar el panel de administración" 
      });
    }

    // Generar JWT
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: rolNombre, nombre: usuario.nombre },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log("✅ Login usuario exitoso:", email);

    res.status(200).json({
      status: "success",
      message: "Login exitoso",
      token,
      user: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        telefono: usuario.telefono,
        rol: rolNombre,
      },
    });
  } catch (err) {
    console.error("❌ Error en login usuario:", err);
    res.status(500).json({ error: "Error interno del servidor", detail: err.message });
  }
});

/**
 * GET /api/auth/verify
 * Verificar si el token de usuario es válido.
 */
router.get("/verify", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No autorizado", detail: "Token no proporcionado" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // Verificar que el usuario existe y está activo
    const result = await pool.query(
      "SELECT id, nombre, email, telefono, activo FROM users WHERE id = $1",
      [decoded.id]
    );

    if (result.rows.length === 0 || !result.rows[0].activo) {
      return res.status(401).json({ error: "Token inválido", detail: "Usuario no encontrado o inactivo" });
    }

    const usuario = result.rows[0];

    res.status(200).json({
      status: "success",
      user: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        telefono: usuario.telefono,
        rol: decoded.rol,
      },
    });
  } catch (err) {
    return res.status(401).json({ error: "Token inválido o expirado", detail: err.message });
  }
});

/**
 * POST /api/auth/logout
 * Cerrar sesión de usuario.
 */
router.post("/logout", (req, res) => {
  res.status(200).json({ status: "success", message: "Sesión cerrada" });
});

module.exports = router;