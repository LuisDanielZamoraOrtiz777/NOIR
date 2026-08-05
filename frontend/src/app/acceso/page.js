"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function getApiBase() {
  const base = process.env.NEXT_PUBLIC_API_BASE?.trim() || "/api";
  const normalized = base.replace(/\/$/, "");
  return normalized.endsWith("/api") ? normalized.slice(0, -4) : normalized;
}

const API_BASE = getApiBase();

export default function AccesoPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    password: "",
    telefono: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("user_token");
    const role = localStorage.getItem("user_rol")?.toLowerCase();
    if (token) {
      if (role === "admin" || role === "administrador") {
        router.push("/admin");
        return;
      }
      if (role === "editor") {
        router.push("/editor");
        return;
      }
      router.push("/");
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      let data = await res.json().catch(() => ({}));

      // Si este login de usuario falla por ser admin, reintentar contra /admin/login
      if (!res.ok && res.status === 403 && (data.detail || "").toString().toLowerCase().includes("administrador")) {
        const r2 = await fetch(`${API_BASE}/admin/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email, password: form.password }),
        });
        data = await r2.json().catch(() => ({}));
        if (!r2.ok) {
          throw new Error(data.detail || data.error || "Credenciales admin inválidas.");
        }
      }

      if (!res.ok && res.status !== 403) {
        if (res.status === 429) {
          throw new Error(
            data.detail ||
              data.error ||
              "Demasiados intentos. Espera unos minutos e inténtalo de nuevo."
          );
        }
        if (res.status === 401) {
          throw new Error(data.detail || data.error || "Credenciales incorrectas.");
        }
        if (res.status === 409) {
          throw new Error(data.detail || data.error || "Este correo ya está registrado.");
        }
        throw new Error(data.detail || data.error || "Error en la operación");
      }

      if (!data.token) {
        throw new Error("Respuesta inválida del servidor. Intenta de nuevo.");
      }

      localStorage.setItem("user_token", data.token);
      localStorage.setItem("user_data", JSON.stringify(data.user || {}));
      if (data.user?.rol) {
        localStorage.setItem("user_rol", data.user.rol);
      }

      const destination = data.user?.rol === "editor"
        ? "/editor"
        : data.user?.rol === "administrador" || data.user?.rol === "admin"
          ? "/admin"
        : isLogin
          ? "/"
          : "/perfil";

      router.push(destination);
      router.refresh();
    } catch (err) {
      setError(err.message || "No se pudo completar la operación.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return <main className="auth-page"><p className="state-message">Cargando…</p></main>;
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-icon">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h1 className="auth-title">{isLogin ? "Iniciar sesión" : "Crear cuenta"}</h1>
        <p className="auth-subtitle">
          {isLogin ? "Ingresa tus credenciales para continuar" : "Únete a Noir Atelier"}
        </p>

        {error && <p className="error" role="alert" aria-live="polite">{error}</p>}

        <form onSubmit={handleSubmit} className="checkout-form">
          {!isLogin && (
            <div>
              <label htmlFor="nombre">Nombre completo *</label>
              <input
                type="text" id="nombre" value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Tu nombre" required disabled={loading} autoComplete="name"
              />
            </div>
          )}

          <div>
            <label htmlFor="email">Correo electrónico *</label>
            <input
              type="email" id="email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="tu@correo.com" required disabled={loading} autoComplete="email"
            />
          </div>

          {!isLogin && (
            <div>
              <label htmlFor="telefono">Teléfono (opcional)</label>
              <input
                type="tel" id="telefono" value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                placeholder="+52 123 456 7890" disabled={loading} autoComplete="tel"
              />
            </div>
          )}

          <div>
            <label htmlFor="password">Contraseña *</label>
            <input
              type="password" id="password" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••" required disabled={loading} minLength={6}
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
            {!isLogin && <small style={{ color: "var(--text-faint)" }}>Mínimo 6 caracteres</small>}
          </div>

          <button type="submit" className="primary-button" disabled={loading}>
            {loading
              ? (isLogin ? "Verificando…" : "Registrando…")
              : (isLogin ? "Iniciar sesión" : "Registrarse")}
          </button>

          <div style={{ textAlign: "center" }}>
            <button
              type="button"
              className="auth-switch"
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
                setForm({ nombre: "", email: "", password: "", telefono: "" });
              }}
            >
              {isLogin ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
            </button>
          </div>
        </form>

        <p className="auth-footer-note">
          {isLogin ? (
            "Usa este formulario para iniciar sesión. Si eres administrador, usa el mismo acceso."
          ) : (
            <>
              Al registrarte aceptas nuestros{" "}
              <Link href="/terminos">términos</Link>{" "}y{" "}
              <Link href="/privacidad">privacidad</Link>
            </>
          )}
        </p>
      </div>
    </main>
  );
}
