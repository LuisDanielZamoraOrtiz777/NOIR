"use client";

import { useState, useEffect } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE?.trim() || "";

const PALETAS = {
  Pasarela:     "#0d1b2a",
  Editorial:    "#0b0b0b",
  Trend:        "#1a0d2e",
  Tendencia:    "#0a2e1a",
  Colaboración: "#2e1a0a",
  Opinión:      "#1a1a2e",
};

function formatearFecha(fecha) {
  if (!fecha) return "";
  try {
    return new Date(fecha).toLocaleDateString("es-MX", {
      year: "numeric", month: "long", day: "numeric",
    });
  } catch { return fecha; }
}

function EditorialCard({ ed, refreshCount }) {
  const [imgError, setImgError] = useState(false);
  const bg = PALETAS[ed.categoria] || "#0b0b0b";
  const inicial = ed.titulo?.charAt(0) || "N";

  useEffect(() => {
    setImgError(false);
  }, [ed.imagen_url]);

  const getImageSrc = (url) => {
    if (!url) return url;
    if (refreshCount === 0) return url;
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}bc=${refreshCount}`;
  };

  return (
    <article className="editorial-card">
      {/* Imagen o placeholder */}
      <div className="editorial-card-img-wrap">
        {ed.imagen_url && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${ed.id}-${refreshCount}`}
            src={getImageSrc(ed.imagen_url)}
            alt={ed.titulo}
            className="editorial-card-img"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              setImgError(true);
            }}
            loading="lazy"
          />
        ) : (
          <div className="editorial-card-placeholder" style={{ background: bg }}>
            <span className="editorial-placeholder-letra">{inicial}</span>
            <span className="editorial-placeholder-cat">{ed.categoria}</span>
          </div>
        )}
        <span className="editorial-cat-badge">{ed.categoria}</span>
      </div>

      {/* Cuerpo */}
      <div className="editorial-card-body">
        <div className="editorial-card-meta">
          {ed.autor && <span className="editorial-autor">Por {ed.autor}</span>}
          {ed.fecha && (
            <time className="editorial-fecha" dateTime={ed.fecha}>
              {formatearFecha(ed.fecha)}
            </time>
          )}
        </div>
        <h3 className="editorial-titulo">{ed.titulo}</h3>
        {ed.resumen && <p className="editorial-resumen">{ed.resumen}</p>}
      </div>
    </article>
  );
}

export default function EditorialesPage() {
  const [editoriales, setEditoriales] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    async function cargar() {
      try {
        const r = await fetch(`${API_BASE}/api/editoriales/publicas`, { cache: "no-store" });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "Error al cargar editoriales");
        setEditoriales(j.data || []);
      } catch (e) { setError(e.message); }
      finally { setLoading(false); }
    }

    cargar();

    if (typeof window === "undefined") return;

    const handleUpdate = () => {
      cargar();
      setRefreshCount((count) => count + 1);
    };

    let channel;
    if (typeof BroadcastChannel !== "undefined") {
      channel = new BroadcastChannel("noir-editoriales");
      channel.addEventListener("message", (event) => {
        if (event?.data?.type === "editoriales-updated") {
          handleUpdate();
        }
      });
    }

    const onStorage = (event) => {
      if (event.key === "noir-editoriales-refresh") {
        handleUpdate();
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("storage", onStorage);
      if (channel) {
        channel.close();
      }
    };
  }, []);

  const getImageSrc = (url) => {
    if (!url) return url;
    if (refreshCount === 0) return url;
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}bc=${refreshCount}`;
  };

  return (
    <main className="page-content">
      {/* Hero */}
      <section className="editoriales-hero" data-element="editoriales-hero">
        <h1>Editoriales</h1>
        <p className="editoriales-intro">
          Análisis, tendencias y narrativa visual desde las pasarelas más influyentes del mundo.
        </p>
        <div className="editoriales-stats">
          <div className="stat-item"><strong>{editoriales.length}</strong><span>Publicaciones</span></div>
          <div className="stat-item"><strong>5</strong><span>Autores</span></div>
          <div className="stat-item"><strong>SS26</strong><span>Temporada</span></div>
        </div>
      </section>

      {/* Contenido */}
      <section data-element="editoriales-grid">
        {loading && (
          <div className="tendencias-estado">Cargando editoriales…</div>
        )}

        {error && !loading && (
          <div className="tendencias-error" role="alert">
            <p>No se pudieron cargar las editoriales.</p>
            <p className="error-detail">{error}</p>
          </div>
        )}

        {!loading && !error && editoriales.length === 0 && (
          <div className="tendencias-estado">
            No hay editoriales publicadas aún.
          </div>
        )}

        {!loading && !error && editoriales.length > 0 && (
          <div className="card-grid editoriales-grid-cards">
            {editoriales.map((ed) => (
              <EditorialCard key={ed.id} ed={ed} refreshCount={refreshCount} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
