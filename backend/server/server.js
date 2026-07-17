const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const sisterStoreRouter = require("./routes/sisterStore");
const rssRouter = require("./routes/rss");
const adminRouter = require("./routes/admin");
const authRouter = require("./routes/auth");
const userAuthRouter = require("./routes/userAuth");
const pool = require("./config/database");

dotenv.config();

const app = express();
const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:3000";
const port = Number(process.env.PORT || 4000);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || origin === frontendOrigin) {
        return callback(null, true);
      }
      return callback(new Error("CORS policy: origin not allowed"));
    },
    methods: ["GET", "POST", "OPTIONS"],
  })
);

app.use(express.json());
app.use("/api/sister-store", sisterStoreRouter);
app.use("/api/rss", rssRouter);

// ── Endpoint público de editoriales (sin autenticación) ───────────────────────
app.get("/api/editoriales/publicas", async (req, res) => {
  try {
    console.log("📰 [PÚBLICO] Solicitando editoriales públicas");
    const result = await pool.query("SELECT * FROM editoriales WHERE publicado = true ORDER BY fecha DESC");
    console.log(`✅ [PÚBLICO] Enviando ${result.rows.length} editoriales`);
    res.json({ status: "success", total: result.rows.length, data: result.rows });
  } catch (err) {
    console.error("❌ [PÚBLICO] Error:", err);
    res.status(500).json({ error: "Error al obtener editoriales", detail: err.message });
  }
});

app.use("/api/admin", adminRouter);
app.use("/api/admin", authRouter);
app.use("/api/auth", userAuthRouter);

// Log de rutas cargadas para debugging
console.log("\n========================================");
console.log("RUTAS DISPONIBLES:");
console.log("========================================");
console.log("GET  /api/admin/partners");
console.log("POST /api/admin/partners");
console.log("DELETE /api/admin/partners/:id");
console.log("PATCH /api/admin/partners/:id/activar");
console.log("GET  /api/admin/editoriales");
console.log("GET  /api/editoriales/publicas");
console.log("POST /api/admin/editoriales");
console.log("PATCH /api/admin/editoriales/:id");
console.log("DELETE /api/admin/editoriales/:id");
console.log("GET  /api/admin/usuarios");
console.log("PATCH /api/admin/usuarios/:id");
console.log("DELETE /api/admin/usuarios/:id");
console.log("GET  /api/admin/sesiones");
console.log("DELETE /api/admin/sesiones/:id");
console.log("POST /api/admin/login");
console.log("GET  /api/admin/verify");
console.log("POST /api/admin/logout");
console.log("========================================\n");

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok", message: "Sister store backend is ready." });
});

app.use((err, _req, res, _next) => {
  if (err?.message?.includes("CORS")) {
    return res.status(403).json({ error: "Forbidden origin", detail: err.message });
  }
  console.error(err);
  res.status(500).json({ error: "Internal Server Error", detail: err?.message || "Unknown error" });
});

app.listen(port, () => {
  console.log(`Express API server listening on http://localhost:${port}`);
});
