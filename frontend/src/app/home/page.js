"use client";

import Link from "next/link";
import PartnersGrid from "@/components/PartnersGrid";
import EventBanner from "@/components/EventBanner";
import InteractiveMenu from "@/components/InteractiveMenu";
import SeasonalHero from "@/components/SeasonalHero";
import SocialButtons from "@/components/SocialButtons";
import SisterStoreCatalog from "@/components/SisterStoreCatalog";
import TendenciasFeed from "@/components/TendenciasFeed";

export default function HomePage() {
  return (
    <main id="main-content">
      <EventBanner />
      <InteractiveMenu />
      <SeasonalHero />

      {/* ── TENDENCIAS EN TIEMPO REAL (contenido externo) ─────────────────────── */}
      <section id="tendencias-section" className="section-block" data-element="tendencias-home">
        <div className="section-header">
          <div>
            <h2>Tendencias internacionales</h2>
            <p className="section-subtitle">
              Artículos en tiempo real de Harper&apos;s Bazaar, Elle y Highsnobiety
            </p>
          </div>
          <Link href="/tendencias" className="button ver-mas-btn">
            Ver todas →
          </Link>
        </div>
        <TendenciasFeed limite={3} />
      </section>

      {/* ── REVISTAS HERMANAS ─────────────────────────── */}
      <section id="revistas-section" className="section-block revistas-hermanas" data-element="revistas-hermanas">
        <div className="section-header">
          <div>
            <h2>Publicaciones de referencia</h2>
            <p className="section-subtitle">
              Sitios hermanos que Noir Atelier sigue de cerca.
            </p>
          </div>
          <Link href="/revistas" className="button ver-mas-btn">
            Ver todas →
          </Link>
        </div>
        <PartnersGrid limite={4} />
      </section>

      {/* ── TIENDA HERMANA ───────────────────────────────────────────────────── */}
      <SisterStoreCatalog />

    </main>
  );
}
