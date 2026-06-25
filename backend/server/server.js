const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const sisterStoreRouter = require("./routes/sisterStore");

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
