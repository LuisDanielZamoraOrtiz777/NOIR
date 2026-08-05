"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import RouteProtector from "@/components/RouteProtector";

function getApiBase() {
  const base = process.env.NEXT_PUBLIC_API_BASE?.trim() || "";
  if (!base) return "";
  const normalized = base.replace(/\/$/, "");
  return normalized.endsWith("/api") ? normalized.slice(0, -4) : normalized;
}

const API_BASE = getApiBase();

export default function PerfilPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
    passwordActual: "",
    passwordNuevo: "",
    passwordConfirmar: ""
  });

  useEffect(() => {
    cargarPerfil();
  }, []);

  const cargarPerfil = async () => {
    try {
      const token = localStorage.getItem("user_token");
      if (!token) {
        router.push("/acceso");
        return;
      }

      const res = await fetch(`${API_BASE}/api/auth/verify`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!res.ok) {
        localStorage.removeItem("user_token");
        localStorage.removeItem("user_data");
        router.push("/acceso");
        return;
      }

      const data = await res.json();
      const userData = data.user;
      
      setUser(userData);
      setForm({
        nombre: userData.nombre || "",
        email: userData.email || "",
        telefono: userData.telefono || "",
        passwordActual: "",
        passwordNuevo: "",
        passwordConfirmar: ""
      });
    } catch (error) {
      console.error("Error cargando perfil:", error);
      router.push("/acceso");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const token = localStorage.getItem("user_token");
      const updates = {
        nombre: form.nombre,
        email: form.email,
        telefono: form.telefono || null
      };

      // Si quiere cambiar la contraseña
      if (form.passwordNuevo) {
        if (!form.passwordActual) {
          setMessage({ type: "danger", text: "Debes ingresar tu contraseña actual" });
          setSaving(false);
          return;
        }
        if (form.passwordNuevo !== form.passwordConfirmar) {
          setMessage({ type: "danger", text: "Las contraseñas nuevas no coinciden" });
          setSaving(false);
          return;
        }
        if (form.passwordNuevo.length < 6) {
          setMessage({ type: "danger", text: "La contraseña debe tener al menos 6 caracteres" });
          setSaving(false);
          return;
        }
        updates.passwordActual = form.passwordActual;
        updates.passwordNuevo = form.passwordNuevo;
      }

      const res = await fetch(`${API_BASE}/api/auth/perfil`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || data.error || "Error al actualizar perfil");
      }

      // Actualizar localStorage y estado sin recargar la página
      localStorage.setItem("user_data", JSON.stringify(data.user));
      setUser(data.user);
      setForm({
        nombre: data.user.nombre || "",
        email: data.user.email || "",
        telefono: data.user.telefono || "",
        passwordActual: "",
        passwordNuevo: "",
        passwordConfirmar: ""
      });
      setMessage({ type: "success", text: "Perfil actualizado exitosamente" });

    } catch (error) {
      setMessage({ type: "danger", text: error.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-dark">
        <div className="text-center">
          <div className="spinner-border text-light mb-3" role="status"></div>
          <p className="text-light">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <RouteProtector tokenKey="user_token" redirectTo="/acceso">
      <main className="auth-page">
        <div className="auth-card" style={{ width: "100%", maxWidth: 620, padding: "48px 40px" }}>
          <div className="auth-icon">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="text-center mb-4">
            <h1 className="auth-title">Mi Perfil</h1>
            <p className="auth-subtitle">Personaliza tu información</p>
          </div>

          {message.text && (
            <div className={`alert alert-${message.type}`} role="alert" style={{ position: "relative" }}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="checkout-form">
            <div>
              <label htmlFor="nombre">Nombre completo *</label>
              <input
                type="text"
                className="form-control"
                id="nombre"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                required
                disabled={saving}
                placeholder="Tu nombre"
                autoComplete="name"
              />
            </div>

            <div>
              <label htmlFor="email">Correo electrónico *</label>
              <input
                type="email"
                className="form-control"
                id="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                disabled={saving}
                placeholder="tu@correo.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="telefono">Teléfono (opcional)</label>
              <input
                type="tel"
                className="form-control"
                id="telefono"
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                disabled={saving}
                placeholder="+52 123 456 7890"
                autoComplete="tel"
              />
            </div>

            <hr />
            <div>
              <h5>Cambiar contraseña</h5>
              <p className="text-muted small">Déjala en blanco si no quieres cambiarla</p>
            </div>

            <div>
              <label htmlFor="passwordActual">Contraseña actual</label>
              <input
                type="password"
                className="form-control"
                id="passwordActual"
                value={form.passwordActual}
                onChange={(e) => setForm({ ...form, passwordActual: e.target.value })}
                disabled={saving}
                autoComplete="current-password"
              />
            </div>

            <div>
              <label htmlFor="passwordNuevo">Nueva contraseña</label>
              <input
                type="password"
                className="form-control"
                id="passwordNuevo"
                value={form.passwordNuevo}
                onChange={(e) => setForm({ ...form, passwordNuevo: e.target.value })}
                disabled={saving}
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            <div>
              <label htmlFor="passwordConfirmar">Confirmar nueva contraseña</label>
              <input
                type="password"
                className="form-control"
                id="passwordConfirmar"
                value={form.passwordConfirmar}
                onChange={(e) => setForm({ ...form, passwordConfirmar: e.target.value })}
                disabled={saving}
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            <div className="d-grid gap-2">
              <button type="submit" className="primary-button" disabled={saving}>
                {saving ? (
                  <span className="btn-spinner" role="status" aria-hidden="true" style={{ marginRight: 10 }}></span>
                ) : null}
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </RouteProtector>
  );
}
