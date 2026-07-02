"use client";

import Link from "next/link";
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

      {/* ── REVISTAS HERMANAS ─────────────────────────────────────────────────── */}
      <section id="revistas-section" className="section-block revistas-hermanas" data-element="revistas-hermanas">
        <h2>Publicaciones de referencia</h2>
        <p className="section-subtitle">
          Sitios que Noir Atelier sigue de cerca. Haz clic para visitar cada publicación directamente.
        </p>
        <div className="revistas-grid">
          <a href="https://www.harpersbazaar.com" target="_blank" rel="noopener noreferrer" className="revista-card">
            <div className="revista-inicial">HB</div>
            <div className="revista-info">
              <strong>Harper&apos;s Bazaar</strong>
              <span>Nueva York, EE.UU.</span>
              <p>Moda de lujo, belleza y cultura desde 1867.</p>
            </div>
            <span className="revista-arrow">↗</span>
          </a>
          <a href="https://www.elle.com" target="_blank" rel="noopener noreferrer" className="revista-card">
            <div className="revista-inicial">EL</div>
            <div className="revista-info">
              <strong>Elle</strong>
              <span>París, Francia</span>
              <p>La referencia global de moda femenina y tendencias.</p>
            </div>
            <span className="revista-arrow">↗</span>
          </a>
          <a href="https://www.highsnobiety.com" target="_blank" rel="noopener noreferrer" className="revista-card">
            <div className="revista-inicial">HS</div>
            <div className="revista-info">
              <strong>Highsnobiety</strong>
              <span>Berlín, Alemania</span>
              <p>Streetwear, cultura urbana y moda de vanguardia.</p>
            </div>
            <span className="revista-arrow">↗</span>
          </a>
          <a href="https://www.vogue.com" target="_blank" rel="noopener noreferrer" className="revista-card">
            <div className="revista-inicial">VG</div>
            <div className="revista-info">
              <strong>Vogue</strong>
              <span>Nueva York, EE.UU.</span>
              <p>El icónico referente de la moda internacional.</p>
            </div>
            <span className="revista-arrow">↗</span>
          </a>
        </div>
      </section>

      {/* ── TIENDA HERMANA ───────────────────────────────────────────────────── */}
      <SisterStoreCatalog />

    </main>
  );
}
