"use client";

import { useState, useEffect } from "react";

const API_BASE = "/api";

export default function EditorialesHomeGrid() {
  const [editoriales, setEditoriales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarEditoriales();
  }, []);

  const cargarEditoriales = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/editoriales/publicas`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Error al cargar editoriales");
      }

      // Tomar las primeras 3 (ya vienen filtradas del backend)
      setEditoriales((data.data || []).slice(0, 3));
    } catch (err) {
      console.error("Error al cargar editoriales:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "";
    try {
      return new Date(fecha).toLocaleDateString("es-MX", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return fecha;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-dark" role="status"></div>
      </div>
    );
  }

  if (editoriales.length === 0) {
    return (
      <p className="text-muted text-center py-4" style={{ color: "#666" }}>
        No hay editoriales publicadas en este momento.
      </p>
    );
  }

  return (
    <div className="row g-4">
      {editoriales.map((editorial) => (
        <div className="col-md-4" key={editorial.id}>
          <div className="card h-100 border-0 shadow-sm" style={{ backgroundColor: "#fff" }}>
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
                <p className="card-text flex-grow-1 small" style={{ color: "var(--text)" }}>
                  {editorial.resumen}
                </p>
                <span className="badge align-self-start bg-success">
                  Publicada
                </span>
              </div>
          </div>
        </div>
      ))}
    </div>
  );
}