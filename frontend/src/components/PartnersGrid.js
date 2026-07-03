"use client";
import { useState, useEffect, useCallback } from "react";

function getInicial(nombre) {
  return nombre
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getDomain(url) {
  try { return new URL(url).hostname.replace("www.", ""); }
  catch { return url; }
}

export default function PartnersGrid({ limite }) {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/partners/publicos", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      const j = await r.json();
      setPartners(j.data || []);
    } catch {} 
    finally { setLoading(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const lista = limite ? partners.slice(0, limite) : partners;

  if (loading) return <p className="tendencias-estado">Cargando publicaciones…</p>;
  if (lista.length === 0) return null;

  return (
    <div className="revistas-grid">
      {lista.map((p) => (
        <a
          key={p.id}
          href={p.url_api}
          target="_blank"
          rel="noopener noreferrer"
          className="revista-card"
        >
          <div className="revista-inicial">{getInicial(p.nombre)}</div>
          <div className="revista-info">
            <strong>{p.nombre}</strong>
            <span>{getDomain(p.url_api)}</span>
          </div>
          <span className="revista-arrow">↗</span>
        </a>
      ))}
    </div>
  );
}
