const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const app = express();

// ════════════════════════════════════════
//  SEGURIDAD - Configuración global
// ════════════════════════════════════════

// 1. Helmet - Headers HTTP seguros
app.use(helmet({
  contentSecurityPolicy: false, // Desactivado para permitir Bootstrap/Google Fonts
  crossOriginEmbedderPolicy: false,
}));

// 2. CORS - Configurado para producción
const allowedOrigins = [
  "https://noiratelier-two.vercel.app",
  "http://localhost:3000",
  "http://localhost:3001",
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("No autorizado por CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// 3. Rate Limiting Global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 requests por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas solicitudes", detail: "Intenta de nuevo en 15 minutos" },
});

// 4. Rate Limiting para Login (más restrictivo)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // solo 5 intentos por IP cada 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados intentos de login", detail: "Espera 15 minutos antes de intentar de nuevo" },
  skipSuccessfulRequests: true, // no contar logins exitosos
});

// 5. Rate Limiting para Registro
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // solo 3 registros por IP por hora
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados registros", detail: "Espera 1 hora antes de intentar de nuevo" },
});

// Aplicar rate limiters
app.use("/api/", globalLimiter);
app.use("/api/admin/login", loginLimiter);
app.use("/api/auth/login", loginLimiter);
app.use("/api/auth/register", registerLimiter);

// Body parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ════════════════════════════════════════
//  RUTAS
// ════════════════════════════════════════

const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const userAuthRoutes = require("./routes/userAuth");

app.use("/api/admin", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/auth", userAuthRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ════════════════════════════════════════
//  Error handling global
// ════════════════════════════════════════
app.use((err, req, res, next) => {
  console.error("❌ Error global:", err);

  if (err.name === "ValidationError") {
    return res.status(400).json({ error: "Error de validación", detail: err.message });
  }

  if (err.message?.includes("CORS")) {
    return res.status(403).json({ error: "Acceso denegado por CORS" });
  }

  res.status(500).json({ error: "Error interno del servidor" });
});

// ════════════════════════════════════════
//  INICIO DEL SERVIDOR
// ════════════════════════════════════════
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Servidor seguro corriendo en puerto ${PORT}`);
  console.log(`🔒 Helmet activado - Headers HTTP seguros`);
  console.log(`🔒 Rate limiting activado - 100 req/15min`);
  console.log(`🔒 Login rate limit: 5 intentos/15min`);
});

module.exports = app;