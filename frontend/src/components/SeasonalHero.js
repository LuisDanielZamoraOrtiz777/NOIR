"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getActiveEvent, getCurrentDateTimestamp } from "@/lib/eventUtils";

const heroTiles = [
  {
    key: "dark",
    variant: "mag-tile--dark",
    title: "Harper's Bazaar",
    subtitle: "Nueva York",
    description: "Un clásico editorial para inspirar la temporada con notas de contraste intenso.",
  },
  {
    key: "light",
    variant: "mag-tile--light",
    title: "Elle",
    subtitle: "París",
    description: "Texturas ligeras, cortes fluidos y patchwork de tendencias para el nuevo ciclo.",
  },
  {
    key: "mid",
    variant: "mag-tile--mid",
    title: "Highsnobiety",
    subtitle: "Berlín",
    description: "Streetwear contemporáneo y estilo urbano que resalta en cada temporada.",
  },
  {
    key: "accent",
    variant: "mag-tile--accent",
    title: "Noir Atelier",
    subtitle: "Editorial",
    description: "Curaduría visual que transforma cada look en una experiencia de temporada.",
  },
];

const tileDetails = {
  dark: "Puntero activo: descubre una vista previa de la edición nocturna y observa cómo se destaca el contenido.",
  light: "Puntero activo: este tile resalta el contenido fresco con un estilo editorial ligero.",
  mid: "Puntero activo: accede al contenido urbano y descubre tendencias audaces del ciclo actual.",
  accent: "Puntero activo: contempla la selección de Noir Atelier como pieza clave de la actualización de temporada.",
};

export default function SeasonalHero() {
  const [highlightedTile, setHighlightedTile] = useState(null);
  const [events, setEvents] = useState([]);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    async function loadEvents() {
      try {
        const response = await fetch("/api/events");
        const json = await response.json();
        if (!response.ok) throw new Error(json.error || "No se pudieron cargar los eventos.");
        setEvents(Array.isArray(json.events) ? json.events : []);
      } catch (error) {
        console.error("Error cargando eventos:", error);
        setLoadError(error.message);
      }
    }
    loadEvents();
  }, []);

  const nowTs = useMemo(() => getCurrentDateTimestamp(), []);
  const activeEvent = useMemo(() => getActiveEvent(nowTs, events), [nowTs, events]);
  const heroThemeClass = activeEvent
    ? activeEvent.backgroundClass.replace("event-banner-", "hero-event-")
    : "";

  return (
    <section id="hero-section" className={`hero-section ${heroThemeClass}`} data-element="hero" aria-labelledby="home-title">
      <div className="hero-copy">
        <p className="eyebrow">Alta costura editorial</p>
        <h1 id="home-title">Noir Atelier</h1>
        <p className="hero-text">
          Un espacio donde el minimalismo, la moda vanguardista y la narración visual convergen.
          Curación editorial desde las revistas más influyentes del mundo.
        </p>

        {activeEvent ? (
          <div className="season-update-summary">
            <strong>{activeEvent.label}</strong>
            <p>{activeEvent.details || activeEvent.message}</p>
            <p className="event-dates-inline">
              {activeEvent.start} — {activeEvent.end}
            </p>
          </div>
        ) : null}

        <div className="hero-buttons">
          <Link href="/tendencias" className="button cta-button" id="cta-principal">
            Ver tendencias globales
          </Link>
          <Link href="/editoriales" className="button" id="cta-editoriales">
            Explorar editoriales
          </Link>
        </div>
      </div>

      <div className="hero-magazine-grid" aria-hidden="true">
        {heroTiles.map((tile) => (
          <div
            key={tile.key}
            className={`mag-tile ${tile.variant} ${highlightedTile === tile.key ? "is-highlighted" : ""}`}
            onPointerEnter={() => setHighlightedTile(tile.key)}
            onPointerLeave={() => setHighlightedTile(null)}
            onFocus={() => setHighlightedTile(tile.key)}
            onBlur={() => setHighlightedTile(null)}
            role="button"
            tabIndex={0}
            aria-label={`${tile.title} desde ${tile.subtitle}`}
          >
            <span className="mag-name">{tile.title}</span>
            <span className="mag-tag">{tile.subtitle}</span>
          </div>
        ))}
      </div>

      {highlightedTile ? (
        <div className="hero-tile-tooltip" aria-live="polite">
          {tileDetails[highlightedTile]}
        </div>
      ) : null}
    </section>
  );
}
