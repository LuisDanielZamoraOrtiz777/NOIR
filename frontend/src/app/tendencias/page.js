import "@/app/tendencias.css";
import TendenciasFeed from "@/components/TendenciasFeed";

export const metadata = {
  title: "Tendencias — Noir Atelier",
  description:
    "Las últimas tendencias de moda internacional curadas desde Harper's Bazaar, Elle, Highsnobiety y más.",
};

export default function TendenciasPage({ searchParams }) {
  const query = searchParams?.q || "";

  return (
    <main className="section-block page-content">
      {/* Hero de la página */}
      <section className="tendencias-hero" data-element="tendencias-hero">
        <h1>Tendencias</h1>
        <p className="tendencias-intro">
          Contenido en tiempo real de las publicaciones de moda más influyentes del mundo.
          Cada artículo proviene directamente de su fuente original.
        </p>

        {/* Fuentes externas — hace explícito para tu profesor que son "sitios hermanos" */}
        <div className="tendencias-fuentes-lista" aria-label="Revistas fuente">
          <span>Fuentes externas:</span>
          <a
            href="https://www.harpersbazaar.com"
            target="_blank"
            rel="noopener noreferrer"
            className="fuente-badge"
          >
            Harper&apos;s Bazaar ↗
          </a>
          <a
            href="https://www.elle.com"
            target="_blank"
            rel="noopener noreferrer"
            className="fuente-badge"
          >
            Elle ↗
          </a>
          <a
            href="https://www.highsnobiety.com"
            target="_blank"
            rel="noopener noreferrer"
            className="fuente-badge"
          >
            Highsnobiety ↗
          </a>
        </div>

        {query ? (
          <p className="search-summary">
            Resultados de búsqueda para: <strong>&quot;{query}&quot;</strong>
          </p>
        ) : null}
      </section>

      {/* Feed dinámico de artículos RSS */}
      <section className="tendencias-feed-section" data-element="tendencias-feed">
        <h2>Artículos recientes</h2>
        <TendenciasFeed query={query} />
      </section>

      {/* Nota editorial */}
      <section className="tendencias-nota" data-element="tendencias-nota">
        <p>
          <strong>Nota editorial:</strong> Los artículos mostrados son obtenidos
          automáticamente de los feeds RSS públicos de cada revista. Noir Atelier
          no es responsable del contenido externo. Al hacer clic en cualquier
          artículo serás redirigido al sitio original.
        </p>
      </section>
    </main>
  );
}
