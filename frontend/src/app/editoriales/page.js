"use client";

import { useState, useEffect } from "react";

// Ahora usa rutas relativas (/api/...) gracias a las API Routes de Next.js
const API_BASE = "/api";

export default function EditorialesPage() {
  const [editoriales, setEditoriales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarEditoriales();
  }, []);

  const cargarEditoriales = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/editoriales/publicas`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Error al cargar editoriales");
      }

      setEditoriales(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "";
    try {
      return new Date(fecha).toLocaleDateString("es-MX", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return fecha;
    }
  };

  if (loading) {
    return (
      <div className="min-vh-100 flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="text-center">
          <div className="spinner-border text-dark mb-3" role="status"></div>
          <p style={{ color: "var(--text-muted)" }}>Cargando editoriales...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-vh-100 flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 py-5" style={{ background: "var(--bg)" }}>
      <div className="container" style={{ maxWidth: 900 }}>
        <div className="text-center mb-5">
          <h1 className="display-4 fw-bold mb-3" style={{ fontFamily: "Playfair Display, Georgia, serif", color: "var(--text-heading)" }}>
            Editoriales
          </h1>
          <p className="lead" style={{ color: "var(--text-muted)" }}>
            Descubre las últimas tendencias y análisis de moda
          </p>
        </div>

        {editoriales.length === 0 ? (
          <div className="alert alert-info" role="alert">
            No hay editoriales publicadas en este momento.
          </div>
        ) : (
          <div className="row g-4">
            {editoriales.map((editorial) => (
              <div className="col-md-6 col-lg-4" key={editorial.id}>
                <div className="card h-100 border-0 shadow-sm" style={{ backgroundColor: "var(--bg-card)" }}>
              <div className="card-body d-flex flex-column">
                {editorial.imagen_url && (
                  <img 
                    src={editorial.imagen_url} 
                    alt={editorial.titulo}
                    className="card-img-top mb-3"
                    style={{ 
                      height: 200, 
                      objectFit: "cover",
                      borderRadius: "8px"
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                )}
                <h5 className="card-title mb-3" style={{ fontFamily: "Playfair Display, Georgia, serif", color: "var(--text-heading)" }}>
                  {editorial.titulo}
                </h5>
                <p className="small mb-2" style={{ color: "var(--text-muted)" }}>
                  Por <strong style={{ color: "var(--text)" }}>{editorial.autor}</strong>
                </p>
                <p className="small mb-3" style={{ color: "var(--text-muted)" }}>
                  {formatearFecha(editorial.fecha)}
                </p>
                <p className="card-text flex-grow-1" style={{ color: "var(--text)" }}>
                  {editorial.resumen}
                </p>
                <span className={`badge align-self-start ${editorial.publicado ? "bg-success" : "bg-warning"}`}>
                  {editorial.publicado ? "Publicada" : "Borrador"}
                </span>
              </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-5">
          <a href="/" className="btn btn-outline-dark">
            ← Volver al inicio
          </a>
        </div>
      </div>
    </div>
  );
}