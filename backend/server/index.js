const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const dotenv = require("dotenv");
const sisterStoreRouter = require("./routes/sisterStore");
const rssRouter = require("./routes/rss");

dotenv.config();

const app = express();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

const allowedOrigins = [process.env.FRONTEND_ORIGIN || "http://localhost:3000"];
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
      return callback(new Error("CORS policy: origin not allowed"));
    },
    methods: ["GET", "POST", "OPTIONS"],
    credentials: false,
  })
);
app.use(express.json());
app.use("/api/sister-store", sisterStoreRouter);
app.use("/api/rss", rssRouter);

app.post("/api/contact", async (req, res) => {
  const { name, email, message } = req.body || {};
  if (!name || !email || !message) {
    return res.status(400).json({ error: "Todos los campos son obligatorios." });
  }

  try {
    const result = await pool.query(
      "INSERT INTO contacts(name, email, message, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id",
      [name, email, message]
    );
    return res.status(201).json({ ok: true, id: result.rows[0].id });
  } catch (error) {
    console.error("Contact API error:", error);
    return res.status(500).json({ error: "No se pudo enviar el mensaje." });
  }
});

app.post("/api/newsletter", async (req, res) => {
  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ error: "Correo electrónico requerido." });
  }

  try {
    await pool.query(
      "INSERT INTO newsletter_subscriptions(email, subscribed_at) VALUES ($1, NOW()) ON CONFLICT (email) DO NOTHING",
      [email]
    );
    return res.status(201).json({ ok: true });
  } catch (error) {
    console.error("Newsletter API error:", error);
    return res.status(500).json({ error: "No se pudo suscribir al newsletter." });
  }
});

app.post("/api/chat", async (req, res) => {
  const { message } = req.body || {};
  if (!message) {
    return res.status(400).json({ error: "Mensaje requerido." });
  }

  const reply = `Gracias por tu mensaje: "${message}". Nuestro equipo editorial responderá pronto.`;

  try {
    await pool.query(
      "INSERT INTO chat_messages(user_message, assistant_reply, created_at) VALUES ($1, $2, NOW())",
      [message, reply]
    );
  } catch (error) {
    console.error("Chat API warning: could not persist message", error);
  }

  return res.status(200).json({ reply });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada." });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Express API server listening on http://localhost:${port}`);
});
