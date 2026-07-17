"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "bootstrap/dist/css/bootstrap.min.css";

// Usar rutas relativas (/api/...) o una API externa si se configura NEXT_PUBLIC_API_BASE
const API_BASE = process.env.NEXT_PUBLIC_API_BASE?.trim() || "/api";

export default function AdminLogin() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error("Demasiados intentos de inicio de sesión. Por favor, espera unos minutos antes de intentar nuevamente.");
        }
        throw new Error(data.detail || data.error || "Error en el login");
      }

      localStorage.setItem("admin_token", data.token);
      localStorage.setItem("admin_user", JSON.stringify(data.user));
      localStorage.setItem("admin_rol", data.user.rol || "");

      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err.message);
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
    <>
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
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div className="d-inline-flex align-items-center px-3 py-2 rounded-pill mb-3" style={{ backgroundColor: "rgba(139, 92, 246, 0.16)", color: "#d8b4fe" }}>
                      <span className="me-2">🔐</span>
                      Área segura
                    </div>
                    <h2 className="fw-bold mb-2">Acceso administrativo</h2>
                    <p className="text-light-emphasis small mb-0">Ingresa tus datos para continuar al panel de gestión.</p>
                  </div>

                  {error && (
                    <div className="alert alert-danger border-0 rounded-3" role="alert">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <label htmlFor="email" className="form-label text-light">
                        Correo electrónico
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
                        style={{
                          backgroundColor: "rgba(255,255,255,0.06)",
                          color: "#f8fafc",
                          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)",
                        }}
                      />
                    </div>

                    <div className="mb-4">
                      <label htmlFor="password" className="form-label text-light">
                        Contraseña
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
                        style={{
                          backgroundColor: "rgba(255,255,255,0.06)",
                          color: "#f8fafc",
                          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)",
                        }}
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-lg w-100 fw-semibold rounded-pill border-0"
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
                          Verificando...
                        </>
                      ) : (
                        "Iniciar sesión"
                      )}
                    </button>
                  </form>

                  <div className="mt-4 pt-3 border-top border-secondary text-center">
                    <p className="small mb-0 text-light-emphasis">
                      Solo personal autorizado puede ingresar a este panel.
                    </p>
                  </div>
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
    </>
  );
}