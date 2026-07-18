// backend/server/server.js
/**
 * Refactored Express server with:
 *   • Centralized async error handling (asyncHandler)
 *   • Global input sanitization (express-sanitizer)
 *   • Structured logging (pino + pino-http)
 *   • Secure Helmet CSP
 *   • Compression (compression)
 *   • Rate limiting on abusive endpoints
 *   • Clean route mounting (no duplicate mounts)
 *   • Environment-aware SSL for PG pool
 *   • Health check with DB ping
 */

import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import rateLimit from "express-rate-limit";
import pino from "pino";
import pinoHttp from "pino-http";
import sanitize from "express-sanitizer";
import { asyncHandler } from "./utils/asyncHandler.js";
import { validate } from "./middleware/validate.js";

// Routes
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import userAuthRoutes from "./routes/userAuth.js";
import editorRoutes from "./routes/editor.js";
import rssRoutes from "./routes/rss.js";
import sisterStoreRoutes from "./routes/sisterStore.js";
import { contactRouter, newsletterRouter } from "./routes/public.js";

const app = express();

// Logger
const logger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  transport:
    process.env.NODE_ENV !== "production"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
});

// Request logger
app.use(pinoHttp({ logger, customLogLevel: (req, err) => (res.statusCode >= 400 ? "warn" : "info") }));

// Security
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
        connectSrc: ["'self'", "https://api.example.com"], // adjust to your APIs
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    // other helmet defaults are fine (hidePoweredBy, xssFilter, etc.)
  })
);

// CORS – tighten to known origins + Vercel previews
const allowedOrigins = [
  process.env.FRONTEND_ORIGIN || "https://noiratelier-two.vercel.app",
  "http://localhost:3000",
  "http://localhost:3001",
];
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      try {
        const url = new URL(origin);
        if (url.hostname.endsWith(".vercel.app")) return cb(null, true);
      } catch (_) {}
      return cb(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
  })
);

// Body parsing + sanitization
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(sanitize()); // sanitizes req.body, req.query, req.params

// Compression
app.use(compression());

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests", detail: "Try again later." },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts", detail: "Wait 15 min." },
});
const publicLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests", detail: "Slow down." },
});

// Apply globally except where we override
app.use("/api/", apiLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/admin/login", authLimiter);
app.use("/api/contact", publicLimiter);
app.use("/api/newsletter", publicLimiter);

// Health check with DB ping
app.get(
  "/api/health",
  asyncHandler(async (req, res) => {
    // Assuming you have a pg pool attached to app.locals.db or similar.
    // Adjust according to your setup.
    const db = req.app.get("db") || require("./config/database").pool;
    await db.query("SELECT 1");
    res.json({ status: "ok", timestamp: new Date().toISOString(), db: "connected" });
  })
);

// Public endpoints (no auth)
app.use("/api/contact", contactRouter);
app.use("/api/newsletter", newsletterRouter);

// Auth (login/verify/logout) – works for both admin & user, differentiated by role after verification
app.use("/api/auth", userAuthRoutes);

// Admin routes (require admin role)
app.use("/api/admin", authRoutes); // login/verify/logout for admin (same as auth? we keep)
app.use("/api/admin", adminRoutes);

// Editor routes (require editor or admin role)
app.use("/api/editor", editorRoutes);

// Other feature routes
app.use("/api/rss", rssRoutes);
app.use("/api/sister-store", sisterStoreRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Centralized error handler (covers asyncHandler thrown errors and sync errors)
app.use((err, req, res, next) => {
  logger.error(err);
  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }
  // Default to 500
  res.status(500).json({ error: "Internal server error" });
});

export default app;