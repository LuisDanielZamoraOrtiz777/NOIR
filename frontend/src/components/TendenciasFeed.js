"use client";

import { useEffect, useState } from "react";

function formatearFecha(fechaStr) {
  if (!fechaStr) return null;
  try {
    return new Date(fechaStr).toLocaleDateString("es-MX", {
      day: "numeric", month: "long", year: "numeric",
    });
  } catch { return null; }
}

function ImagenPlaceholder({ fuente }) {
  return (
    <div className="tendencia-img-placeholder" aria-hidden="true">
      <span>{fuente?.charAt(0) || "N"}</span>
    </div>
  );
}

function TendenciaCard({ articulo }) {
  const [imgError, setImgError] = useState(false);

  return (
    <article className="tendencia-card">
      <div className="tendencia-img-wrapper">
        {articulo.imagen && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={articulo.imagen}
            alt={articulo.titulo}
            className="tendencia-img"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <ImagenPlaceholder fuente={articulo.fuente} />
        )}
        <span className="tendencia-fuente-badge">{articulo.fuente}</span>
      </div>

      <div className="tendencia-card-body">
        <div className="tendencia-card-meta">
          {articulo.pais && <span className="tendencia-pais">{articulo.pais}</span>}
          {articulo.fecha && (
            <time className="tendencia-fecha" dateTime={articulo.fecha}>
              {formatearFecha(articulo.fecha)}
            </time>
          )}
        </div>
        <h3 className="tendencia-titulo">{articulo.titulo}</h3>
        {articulo.resumen && (
          <p className="tendencia-resumen">{articulo.resumen}&hellip;</p>
        )}
        <a
          href={articulo.enlace}
          target="_blank"
          rel="noopener noreferrer"
          className="tendencia-link button"
          aria-label={`Leer en ${articulo.fuente}: ${articulo.titulo}`}
        >
          Leer en {articulo.fuente} ↗
        </a>
      </div>
    </article>
  );
}

export default function TendenciasFeed({ limite }) {
  const [articulos, setArticulos] = useState([]);
  const [fuentes, setFuentes]     = useState([]);
  const [filtro, setFiltro]       = useState("Todas");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState(null);

  useEffect(() => {
    async function fetchTendencias() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/rss/tendencias");
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.mensaje || `Error ${res.status}`);
        }
        const data = await res.json();
        setArticulos(data.articulos || []);
        setFuentes(["Todas", ...(data.fuentes || [])]);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTendencias();
  }, []);

  const articulosFiltrados = (
    filtro === "Todas" ? articulos : articulos.filter((a) => a.fuente === filtro)
  ).slice(0, limite || 999);

  return (
    <div className="tendencias-feed">
      {!limite && fuentes.length > 1 && (
        <div className="tendencias-filtros" role="group" aria-label="Filtrar por revista">
          {fuentes.map((f) => (
            <button
              key={f}
              className={`filtro-btn ${filtro === f ? "activo" : ""}`}
              onClick={() => setFiltro(f)}
              aria-pressed={filtro === f}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {isLoading && (
        <p className="tendencias-estado" aria-live="polite">Cargando tendencias internacionales…</p>
      )}

      {error && !isLoading && (
        <div className="tendencias-error" role="alert">
          <p>No se pudieron cargar las tendencias en este momento.</p>
          <p className="error-detail">{error}</p>
        </div>
      )}

      {!isLoading && !error && articulosFiltrados.length > 0 && (
        <div className="card-grid tendencias-grid">
          {articulosFiltrados.map((articulo) => (
            <TendenciaCard key={articulo.id} articulo={articulo} />
          ))}
        </div>
      )}

      {!isLoading && !error && articulosFiltrados.length === 0 && (
        <p className="tendencias-estado">No hay artículos disponibles para esta fuente ahora mismo.</p>
      )}
    </div>
  );
}
