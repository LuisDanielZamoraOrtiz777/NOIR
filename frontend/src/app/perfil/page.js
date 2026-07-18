"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import RouteProtector from "@/components/RouteProtector";
import "bootstrap/dist/css/bootstrap.min.css";

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

      // Actualizar localStorage
      localStorage.setItem("user_data", JSON.stringify(data.user));
      setUser(data.user);
      setMessage({ type: "success", text: "Perfil actualizado exitosamente" });
      
      // Limpiar campos de contraseña
      setForm({
        ...form,
        passwordActual: "",
        passwordNuevo: "",
        passwordConfirmar: ""
      });

      // Recargar la página para actualizar el Header
      setTimeout(() => {
        window.location.reload();
      }, 1500);

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
      <div className="min-vh-100 bg-dark text-light py-5">
        <div className="container" style={{ maxWidth: 700 }}>
          <div className="text-center mb-5">
            <h1 className="fw-bold">Mi Perfil</h1>
            <p className="text-muted">Personaliza tu información</p>
          </div>

          {message.text && (
            <div className={`alert alert-${message.type} alert-dismissible`} role="alert">
              {message.text}
              <button type="button" className="btn-close" onClick={() => setMessage({ type: "", text: "" })}></button>
            </div>
          )}

          <div className="card border-0" style={{ background: "#1a1a1a" }}>
            <div className="card-body p-4 p-md-5">
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="nombre" className="form-label text-light">Nombre *</label>
                  <input
                    type="text"
                    className="form-control bg-dark text-white border-secondary"
                    id="nombre"
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    required
                    disabled={saving}
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="email" className="form-label text-light">Correo electrónico *</label>
                  <input
                    type="email"
                    className="form-control bg-dark text-white border-secondary"
                    id="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    disabled={saving}
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="telefono" className="form-label text-light">Teléfono (opcional)</label>
                  <input
                    type="tel"
                    className="form-control bg-dark text-white border-secondary"
                    id="telefono"
                    value={form.telefono}
                    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                    disabled={saving}
                  />
                </div>

                <hr className="border-secondary my-4" />
                <h5 className="text-white mb-3">Cambiar Contraseña</h5>
                <p className="text-muted small mb-3">Déjala en blanco si no quieres cambiarla</p>

                <div className="mb-4">
                  <label htmlFor="passwordActual" className="form-label text-light">Contraseña actual</label>
                  <input
                    type="password"
                    className="form-control bg-dark text-white border-secondary"
                    id="passwordActual"
                    value={form.passwordActual}
                    onChange={(e) => setForm({ ...form, passwordActual: e.target.value })}
                    disabled={saving}
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="passwordNuevo" className="form-label text-light">Nueva contraseña</label>
                  <input
                    type="password"
                    className="form-control bg-dark text-white border-secondary"
                    id="passwordNuevo"
                    value={form.passwordNuevo}
                    onChange={(e) => setForm({ ...form, passwordNuevo: e.target.value })}
                    disabled={saving}
                    minLength={6}
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="passwordConfirmar" className="form-label text-light">Confirmar nueva contraseña</label>
                  <input
                    type="password"
                    className="form-control bg-dark text-white border-secondary"
                    id="passwordConfirmar"
                    value={form.passwordConfirmar}
                    onChange={(e) => setForm({ ...form, passwordConfirmar: e.target.value })}
                    disabled={saving}
                    minLength={6}
                  />
                </div>

                <div className="d-grid gap-2">
                  <button
                    type="submit"
                    className="btn btn-light btn-lg"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Guardando...
                      </>
                    ) : (
                      "Guardar Cambios"
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-light"
                    onClick={() => router.push("/")}
                  >
                    Volver al Inicio
                  </button>
                </div>
              </form>
            </div>
          </div>
          
          {/* Envío de mensajes al admin movido a la sección Opinión */}

        </div>
      </div>
    </RouteProtector>
  );
}

function SendToAdmin({ user }) {
  const [messageText, setMessageText] = useState("");
  const [loadingMsg, setLoadingMsg] = useState(false);
  const [status, setStatus] = useState({ type: "", text: "" });

  const name = user?.nombre || user?.email || "";
  const email = user?.email || "";

  const send = async (e) => {
    e && e.preventDefault();
    if (!messageText.trim()) return setStatus({ type: "danger", text: "El mensaje no puede estar vacío" });
    setLoadingMsg(true); setStatus({ type: "", text: "" });
    try {
      const res = await fetch(`/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message: messageText }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || data.error || "Error al enviar mensaje");
      setStatus({ type: "success", text: "Mensaje enviado. Gracias por tu sugerencia." });
      setMessageText("");
    } catch (err) {
      setStatus({ type: "danger", text: err.message || "No se pudo enviar el mensaje." });
    } finally { setLoadingMsg(false); }
  };

  return (
    <form onSubmit={send}>
      {status.text && (
        <div className={`alert alert-${status.type} alert-dismissible`}>
          {status.text}
          <button type="button" className="btn-close" onClick={() => setStatus({ type: "", text: "" })}></button>
        </div>
      )}
      <div className="mb-3">
        <label className="form-label text-light small">Mensaje</label>
        <textarea className="form-control bg-dark text-white border-secondary" rows={4} value={messageText} onChange={(e) => setMessageText(e.target.value)} required disabled={loadingMsg} />
      </div>
      <div className="d-flex gap-2">
        <button className="btn btn-primary" type="submit" disabled={loadingMsg}>{loadingMsg ? "Enviando..." : "Enviar al admin"}</button>
        <button className="btn btn-outline-light" type="button" onClick={() => setMessageText("")}>Limpiar</button>
      </div>
    </form>
  );
}