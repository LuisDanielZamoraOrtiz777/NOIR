const { body, validationResult } = require("express-validator");

/**
 * Middleware para validar campos de login
 */
const validateLogin = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Email inválido"),
  body("password")
    .isString()
    .isLength({ min: 1 })
    .withMessage("Password es obligatorio"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Error de validación",
        detail: errors.array().map(e => e.msg).join(", "),
      });
    }
    next();
  },
];

/**
 * Middleware para validar registro de usuario
 * Password policy: mínimo 8 chars, 1 mayúscula, 1 número
 */
const validateRegister = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Email inválido"),
  body("password")
    .isString()
    .isLength({ min: 8 })
    .withMessage("La contraseña debe tener al menos 8 caracteres")
    .matches(/[A-Z]/)
    .withMessage("La contraseña debe contener al menos una mayúscula")
    .matches(/[0-9]/)
    .withMessage("La contraseña debe contener al menos un número"),
  body("nombre")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("El nombre debe tener entre 2 y 100 caracteres"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Error de validación",
        detail: errors.array().map(e => e.msg).join(", "),
      });
    }
    next();
  },
];

/**
 * Middleware para validar creación/edición de editoriales
 */
const validateEditorial = [
  body("titulo")
    .isString()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage("El título debe tener entre 3 y 200 caracteres"),
  body("resumen")
    .isString()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage("El resumen debe tener entre 10 y 500 caracteres"),
  body("contenido")
    .optional()
    .isString()
    .trim(),
  body("categoria")
    .optional()
    .isString()
    .trim()
    .isIn(["Editorial", "Pasarela", "Trend", "Tendencia", "Colaboración", "Opinión"])
    .withMessage("Categoría inválida"),
  body("imagen_url")
    .optional({ values: "null" })
    .isURL()
    .withMessage("URL de imagen inválida"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Error de validación",
        detail: errors.array().map(e => e.msg).join(", "),
      });
    }
    next();
  },
];

/**
 * Middleware para validar partners
 */
const validatePartner = [
  body("nombre")
    .isString()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("El nombre debe tener entre 2 y 100 caracteres"),
  body("url_api")
    .isURL()
    .withMessage("URL inválida"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Error de validación",
        detail: errors.array().map(e => e.msg).join(", "),
      });
    }
    next();
  },
];

/**
 * Middleware para sanitizar strings (XSS prevention)
 */
function sanitizeInput(req, res, next) {
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === "string") {
        // Remover tags HTML peligrosos
        req.body[key] = req.body[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
          .replace(/on\w+="[^"]*"/gi, "")
          .replace(/on\w+='[^']*'/gi, "")
          .trim();
      }
    }
  }
  next();
}

module.exports = {
  validateLogin,
  validateRegister,
  validateEditorial,
  validatePartner,
  sanitizeInput,
};