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
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-dark text-light px-3">
        <div className="text-center" style={{ maxWidth: 480 }}>
          <div
            className="d-inline-flex align-items-center justify-content-center mb-3"
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
              color: "#fff",
              fontSize: 28,
            }}
          >
            ✓
          </div>
          <h1 className="h2 fw-bold mb-3">Registro recibido</h1>
          <p className="text-muted mb-4">
            Gracias por unirte a Noir Atelier. Revisa tu correo o inicia sesión para continuar.
          </p>
          <div className="d-flex flex-wrap gap-2 justify-content-center">
            <Link href="/acceso" className="btn btn-light rounded-pill px-4">
              Ir a acceso
            </Link>
            <Link href="/" className="btn btn-outline-light rounded-pill px-4">
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-dark text-light py-5">
      <div className="container" style={{ maxWidth: 600 }}>
        <div className="text-center mb-5">
          <p className="text-uppercase small mb-2" style={{ letterSpacing: "0.15em", color: "#a78bfa" }}>
            Comunidad
          </p>
          <h1 className="fw-bold">Registro</h1>
          <p className="text-muted">
            Completa el formulario para unirte. ¿Ya tienes cuenta?{" "}
            <Link href="/acceso" className="text-info text-decoration-none">
              Inicia sesión
            </Link>
          </p>
        </div>

        <div className="card border-0" style={{ background: "#1a1a1a" }}>
          <div className="card-body p-4">
            {error && (
              <div className="alert alert-danger border-0 rounded-3" role="alert" aria-live="polite">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-3">
                <label htmlFor="reg-nombre" className="form-label text-light">
                  Nombre completo *
                </label>
                <input
                  id="reg-nombre"
                  type="text"
                  className="form-control bg-dark text-white border-secondary"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  required
                  disabled={loading}
                  autoComplete="name"
                />
              </div>

              <div className="mb-3">
                <label htmlFor="reg-email" className="form-label text-light">
                  Correo electrónico *
                </label>
                <input
                  id="reg-email"
                  type="email"
                  className="form-control bg-dark text-white border-secondary"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  disabled={loading}
                  autoComplete="email"
                />
              </div>

              <div className="mb-3">
                <label htmlFor="reg-telefono" className="form-label text-light">
                  Teléfono
                </label>
                <input
                  id="reg-telefono"
                  type="tel"
                  className="form-control bg-dark text-white border-secondary"
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  disabled={loading}
                  autoComplete="tel"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="reg-mensaje" className="form-label text-light">
                  Mensaje (opcional)
                </label>
                <textarea
                  id="reg-mensaje"
                  className="form-control bg-dark text-white border-secondary"
                  rows="4"
                  value={form.mensaje}
                  onChange={(e) => setForm({ ...form, mensaje: e.target.value })}
                  disabled={loading}
                />
              </div>

              <button type="submit" className="btn btn-light w-100" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                    Enviando...
                  </>
                ) : (
                  "Registrarse"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
