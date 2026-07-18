"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "bootstrap/dist/css/bootstrap.min.css";

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
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-dark">
        <div className="text-white">Cargando...</div>
      </div>
    );
  }

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center px-3 py-5 position-relative overflow-hidden"
      style={{
        background:
          "radial-gradient(circle at top left, rgba(255,255,255,0.08), transparent 25%), linear-gradient(135deg, #06070b 0%, #151a2d 50%, #090b12 100%)",
      }}
    >
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-sm-10 col-md-7 col-lg-5">
            <div
              className="card shadow-lg border-0 rounded-4 overflow-hidden"
              style={{
                background: "rgba(15, 23, 42, 0.95)",
                color: "#fff",
                boxShadow: "0 25px 80px rgba(0, 0, 0, 0.45)",
              }}
            >
              <div className="card-body p-4 p-md-5">
                <div className="text-center mb-4">
                  <div
                    className="d-inline-flex align-items-center justify-content-center mb-3"
                    style={{
                      width: "72px",
                      height: "72px",
                      borderRadius: "20px",
                      background: "linear-gradient(135deg, #f8fafc 0%, #8b5cf6 100%)",
                      color: "#111827",
                    }}
                  >
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h2 className="fw-bold mb-2">
                    {isLogin ? "Iniciar sesión" : "Crear cuenta"}
                  </h2>
                  <p className="text-light-emphasis small mb-0">
                    {isLogin
                      ? "Ingresa tus credenciales para continuar"
                      : "Únete a Noir Atelier"}
                  </p>
                </div>

                {error && (
                  <div className="alert alert-danger border-0 rounded-3" role="alert" aria-live="polite">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  {!isLogin && (
                    <div className="mb-3">
                      <label htmlFor="nombre" className="form-label text-light">
                        Nombre completo *
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-lg border-0 px-3 py-3"
                        id="nombre"
                        value={form.nombre}
                        onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                        placeholder="Tu nombre"
                        required
                        disabled={loading}
                        autoComplete="name"
                        style={{
                          backgroundColor: "rgba(255,255,255,0.06)",
                          color: "#f8fafc",
                          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)",
                        }}
                      />
                    </div>
                  )}

                  <div className="mb-3">
                    <label htmlFor="email" className="form-label text-light">
                      Correo electrónico *
                    </label>
                    <input
                      type="email"
                      className="form-control form-control-lg border-0 px-3 py-3"
                      id="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="tu@correo.com"
                      required
                      disabled={loading}
                      autoComplete="email"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.06)",
                        color: "#f8fafc",
                        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)",
                      }}
                    />
                  </div>

                  {!isLogin && (
                    <div className="mb-3">
                      <label htmlFor="telefono" className="form-label text-light">
                        Teléfono (opcional)
                      </label>
                      <input
                        type="tel"
                        className="form-control form-control-lg border-0 px-3 py-3"
                        id="telefono"
                        value={form.telefono}
                        onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                        placeholder="+52 123 456 7890"
                        disabled={loading}
                        autoComplete="tel"
                        style={{
                          backgroundColor: "rgba(255,255,255,0.06)",
                          color: "#f8fafc",
                          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)",
                        }}
                      />
                    </div>
                  )}

                  <div className="mb-4">
                    <label htmlFor="password" className="form-label text-light">
                      Contraseña *
                    </label>
                    <input
                      type="password"
                      className="form-control form-control-lg border-0 px-3 py-3"
                      id="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="••••••••"
                      required
                      disabled={loading}
                      minLength={6}
                      autoComplete={isLogin ? "current-password" : "new-password"}
                      style={{
                        backgroundColor: "rgba(255,255,255,0.06)",
                        color: "#f8fafc",
                        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)",
                      }}
                    />
                    {!isLogin && (
                      <small className="text-muted">Mínimo 6 caracteres</small>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="btn btn-lg w-100 fw-semibold rounded-pill border-0 mb-3"
                    disabled={loading}
                    style={{
                      background: "linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)",
                      color: "#fff",
                      boxShadow: "0 12px 25px rgba(59, 130, 246, 0.25)",
                    }}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        {isLogin ? "Verificando..." : "Registrando..."}
                      </>
                    ) : isLogin ? (
                      "Iniciar sesión"
                    ) : (
                      "Registrarse"
                    )}
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      className="btn btn-link text-light-emphasis small"
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

                  <div className="mt-4 pt-3 border-top border-secondary text-center">
                    <p className="small mb-0 text-light-emphasis">
                      {isLogin ? "Usa este formulario para iniciar sesión. Si eres administrador, usa el mismo acceso." : (
                        <>
                          Al registrarte aceptas nuestros{" "}
                          <Link href="/terminos" className="text-info text-decoration-none">términos</Link>{" "}
                          y{" "}
                          <Link href="/privacidad" className="text-info text-decoration-none">privacidad</Link>
                        </>
                      )}
                    </p>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        body {
          background: #06070b;
        }
      `}</style>
    </div>
  );
}
