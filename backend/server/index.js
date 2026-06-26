const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const sisterStoreRouter = require("./routes/sisterStore");
const rssRouter         = require("./routes/rss");
const adminRouter       = require("./routes/admin");
const authRouter        = require("./routes/auth");
const pool              = require("./config/database");

dotenv.config();

const app = express();
const allowedOrigins = [process.env.FRONTEND_ORIGIN || "http://localhost:3000"];

// ── CORS: permite todos los métodos incluyendo DELETE y OPTIONS preflight ──────
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("CORS: origen no permitido"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
  })
);
app.options("*", cors()); // preflight explícito para todas las rutas

app.use(express.json());

// ── Rutas ─────────────────────────────────────────────────────────────────────
app.use("/api/sister-store", sisterStoreRouter);
app.use("/api/rss",          rssRouter);
app.use("/api/admin",        authRouter);   // POST /api/admin/login, GET /api/admin/verify
app.use("/api/admin",        adminRouter);  // CRUD partners + editoriales (autenticado)

// ── Editoriales PÚBLICAS (sin autenticación) ──────────────────────────────────
// Separada del router de admin para que sea accesible sin token
app.get("/api/editoriales/publicas", async (_req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, titulo, autor, fecha, categoria, resumen, contenido, imagen_url FROM editoriales WHERE publicado = true ORDER BY fecha DESC"
    );
    res.json({ status: "success", total: result.rows.length, data: result.rows });
  } catch (err) {
    console.error("Error editoriales públicas:", err.message);
    res.status(500).json({ error: "No se pudieron cargar las editoriales." });
  }
});

// ── Contacto ──────────────────────────────────────────────────────────────────
app.post("/api/contact", async (req, res) => {
  const { name, email, message } = req.body || {};
  if (!name || !email || !message)
    return res.status(400).json({ error: "Todos los campos son obligatorios." });
  try {
    const r = await pool.query(
      "INSERT INTO contacts(name, email, message, created_at) VALUES ($1,$2,$3,NOW()) RETURNING id",
      [name, email, message]
    );
    res.status(201).json({ ok: true, id: r.rows[0].id });
  } catch (err) {
    console.error("Contact error:", err.message);
    res.status(500).json({ error: "No se pudo enviar el mensaje." });
  }
});

// ── Newsletter ────────────────────────────────────────────────────────────────
app.post("/api/newsletter", async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: "Correo requerido." });
  try {
    await pool.query(
      "INSERT INTO newsletter_subscriptions(email,subscribed_at) VALUES ($1,NOW()) ON CONFLICT (email) DO NOTHING",
      [email]
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error("Newsletter error:", err.message);
    res.status(500).json({ error: "No se pudo suscribir." });
  }
});

// ── Chat ──────────────────────────────────────────────────────────────────────
app.post("/api/chat", async (req, res) => {
  const { message } = req.body || {};
  if (!message) return res.status(400).json({ error: "Mensaje requerido." });
  const reply = "Gracias por tu mensaje. Nuestro equipo editorial responderá pronto.";
  try {
    await pool.query(
      "INSERT INTO chat_messages(user_message,assistant_reply,created_at) VALUES ($1,$2,NOW())",
      [message, reply]
    );
  } catch (err) { console.error("Chat warn:", err.message); }
  res.status(200).json({ reply });
});

// ── Health ────────────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// ── 404 catch-all ─────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: "Ruta no encontrada." }));

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`\n🚀  Express API  →  http://localhost:${port}`);
  console.log("📌  Rutas públicas:");
  console.log("      GET  /api/editoriales/publicas");
  console.log("      GET  /api/rss/tendencias");
  console.log("📌  Rutas admin (requieren token):");
  console.log("      POST   /api/admin/login");
  console.log("      GET    /api/admin/partners");
  console.log("      GET    /api/admin/editoriales\n");
});
