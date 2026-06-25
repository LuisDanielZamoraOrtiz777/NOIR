"use client";
import { useMemo } from "react";

const eventDefinitions = [
  {
    id: "fashion-week",
    label: "Semana de Moda Noir",
    start: "2026-07-10",
    end: "2026-07-16",
    backgroundClass: "event-banner-fashion-week",
    message: "Edición especial: descubre contenido exclusivo de nuestra Semana de Moda Noir.",
  },
  {
    id: "sustainability-day",
    label: "Día de la Sostenibilidad",
    start: "2026-06-05",
    end: "2026-06-05",
    backgroundClass: "event-banner-sustainability",
    message: "Hoy celebramos la moda sostenible con colecciones y artículos dedicados.",
  },
];

function parseDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

export default function EventBanner({ currentDate }) {
  const nowTs = useMemo(() => {
    if (currentDate) return Date.parse(currentDate);
    const d = new Date();
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  }, [currentDate]);

  const activeEvent = useMemo(() => {
    return eventDefinitions.find((event) => {
      const startTs = parseDate(event.start);
      const endTs = parseDate(event.end) + 24 * 60 * 60 * 1000 - 1; // include end day
      return nowTs >= startTs && nowTs <= endTs;
    });
  }, [nowTs]);

  if (!activeEvent) {
    return null;
  }

  return (
    <section className={`event-banner ${activeEvent.backgroundClass}`} aria-live="polite">
      <div className="event-banner-inner">
        <p className="event-label">{activeEvent.label}</p>
        <h2>{activeEvent.message}</h2>
        <p className="event-dates">
          {activeEvent.start} — {activeEvent.end}
        </p>
      </div>
    </section>
  );
}
