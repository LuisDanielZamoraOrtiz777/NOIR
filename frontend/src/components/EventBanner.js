"use client";
import { useMemo, useState, useEffect } from "react";
import { getActiveEvent, getCurrentDateTimestamp } from "@/lib/eventUtils";

export default function EventBanner({ currentDate }) {
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

  const nowTs = useMemo(() => {
    if (currentDate) {
      const parsed = new Date(currentDate);
      return Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate());
    }
    return getCurrentDateTimestamp();
  }, [currentDate]);

  const activeEvent = useMemo(() => getActiveEvent(nowTs, events), [nowTs, events]);

  if (loadError) {
    return null;
  }

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
