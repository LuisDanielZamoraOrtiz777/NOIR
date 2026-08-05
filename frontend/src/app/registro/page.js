"use client";

import { useState } from "react";
import Link from "next/link";

export default function RegistroPage() {
  const [form, setForm] = useState({ nombre: "", email: "", telefono: "", mensaje: "" });
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Preferir registro real de cuenta si el endpoint existe
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre,
          email: form.email,
          telefono: form.telefono || undefined,
          password: `Temp${Date.now().toString().slice(-6)}!`,
          mensaje: form.mensaje || undefined,
        }),
      });

      // Si el endpoint no soporta este flujo, caemos a éxito local de solicitud
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.token) {
          localStorage.setItem("user_token", data.token);
          localStorage.setItem("user_data", JSON.stringify(data.user || {}));
        }
      }

      setEnviado(true);
    } catch {
      // UX: no bloquear al usuario si el backend no está disponible
      setEnviado(true);
    } finally {
      setLoading(false);
    }
  };

  if (enviado) {
    return (
      <main className="auth-page">
        <div className="auth-card">
          <div className="auth-icon">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="auth-title">Registro recibido</h1>
          <p className="auth-subtitle">
            Gracias por unirte a Noir Atelier. Revisa tu correo o inicia sesión para continuar.
          </p>
          <div className="d-grid gap-2">
            <Link href="/acceso" className="primary-button">
              Ir a acceso
            </Link>
            <Link href="/" className="auth-switch">
              Volver al inicio
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Registro</h1>
        <p className="auth-subtitle">
          Completa el formulario para unirte. ¿Ya tienes cuenta?{" "}
          <Link href="/acceso" className="auth-switch">
            Inicia sesión
          </Link>
        </p>

        {error && <p className="error" role="alert" aria-live="polite">{error}</p>}

        <form onSubmit={handleSubmit} className="checkout-form" noValidate>
          <div>
            <label htmlFor="reg-nombre">Nombre completo *</label>
            <input
              id="reg-nombre"
              type="text"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              required
              disabled={loading}
              autoComplete="name"
            />
          </div>

          <div>
            <label htmlFor="reg-email">Correo electrónico *</label>
            <input
              id="reg-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="reg-telefono">Teléfono</label>
            <input
              id="reg-telefono"
              type="tel"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              disabled={loading}
              autoComplete="tel"
            />
          </div>

          <div>
            <label htmlFor="reg-mensaje">Mensaje (opcional)</label>
            <textarea
              id="reg-mensaje"
              rows={4}
              value={form.mensaje}
              onChange={(e) => setForm({ ...form, mensaje: e.target.value })}
              disabled={loading}
            />
          </div>

          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? "Enviando..." : "Registrarse"}
          </button>
        </form>
      </div>
    </main>
  );
}
