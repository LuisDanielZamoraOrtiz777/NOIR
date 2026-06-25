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
  return new Date(Date.UTC(year, month - 1, day));
}

export default function EventBanner({ currentDate }) {
  const date = currentDate ? new Date(currentDate) : new Date();

  const activeEvent = useMemo(() => {
    return eventDefinitions.find((event) => {
      const start = parseDate(event.start);
      const end = parseDate(event.end);
      return date >= start && date <= end;
    });
  }, [date]);

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
