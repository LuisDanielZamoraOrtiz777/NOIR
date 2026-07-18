// routes/public.js
const express = require("express");
const router = express.Router();
const pool = require("../config/database");

// ── Contacto ────────────────────────────────────────────────────────────────
router.post("/contact", async (req, res) => {
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

// ── Newsletter ─────────────────────────────────────────────────────────────
router.post("/newsletter", async (req, res) => {
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

module.exports = { contactRouter: router, newsletterRouter: router };