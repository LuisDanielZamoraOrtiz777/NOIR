import PostCard from "@/components/PostCard";
import SavedFavorites from "@/components/SavedFavorites";
import posts from "@/data/posts";

export const metadata = {
  title: "Looks — Noir Atelier",
  description: "Una selección de looks destacados con inspiración contemporánea. Descubre tendencias, estilos y propuestas de moda.",
};

export default function LooksPage({ searchParams }) {
  const query = searchParams?.q || "";

  const allLooks = posts.filter((post) => post.category === "Look");

  const filteredLooks = query
    ? allLooks.filter(
        (look) =>
          look.title.toLowerCase().includes(query.toLowerCase()) ||
          look.summary.toLowerCase().includes(query.toLowerCase())
      )
    : allLooks;

  return (
    <main className="section-block page-content">
      <section className="looks-hero" data-element="looks-hero">
        <h1>Looks</h1>
        <p className="looks-intro">
          Una selección de looks destacados con inspiración contemporánea.
          Cada propuesta es una declaración de estilo personal.
        </p>
        <div className="looks-stats">
          <div className="stat-item">
            <strong>{allLooks.length}</strong>
            <span>Looks destacados</span>
          </div>
          <div className="stat-item">
            <strong>{new Set(allLooks.map(l => l.autor)).size}</strong>
            <span>Estilistas de referencia</span>
          </div>
          <div className="stat-item">
            <strong>{new Set(allLooks.flatMap(l => l.tags || [])).size}</strong>
            <span>Marcas de referencia</span>
          </div>
        </div>
      </section>

      {query && (
        <div className="search-results-banner">
          <p>
            Resultados de búsqueda para: <strong>&ldquo;{query}&rdquo;</strong> ({filteredLooks.length} {filteredLooks.length === 1 ? "resultado encontrado" : "resultados encontrados"})
          </p>
          <a href="/loits" className="clear-search-link">
            Limpiar búsqueda
          </a>
        </div>
      )}

      <section className="looks-trends" data-element="looks-trends">
        <h2>Tendencias 2026</h2>
        <div className="trends-grid">
          <div className="trend-card">
            <h4>Minimalismo Radical</h4>
            <p>Menos es más: siluetas limpias, paletas neutras y atención al detalle.</p>
          </div>
          <div className="trend-card">
            <h4>Sostenibilidad</h4>
            <p>Materiales eco-friendly y producción consciente marcan la temporada.</p>
          </div>
          <div className="trend-card">
            <h4>Retro-Futurismo</h4>
            <p>Referencias de los 90 con un giro tecnológico y vanguardista.</p>
          </div>
        </div>
      </section>

      <section className="looks-grid-section" data-element="looks-grid-section">
        <h2>Todos los Looks</h2>
        {filteredLooks.length > 0 ? (
          <div className="card-grid">
            {filteredLooks.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="no-results-box">
            <p>No se encontraron looks que coincidan con tu búsqueda.</p>
            <a href="/loits" className="button">
              Ver todos los looks
            </a>
          </div>
        )}
      </section>

      <section className="looks-influencers" data-element="looks-influencers">
        <h2>Quién lo usa</h2>
        <p className="looks-influencers-note">
          Perfiles editoriales de referencia que han aparecido en las propuestas
          de looks de la temporada.
        </p>
        <div className="influencers-grid">
          {Object.entries(
            allLooks.reduce((acc, look) => {
              if (look.autor && !acc[look.autor]) {
                acc[look.autor] = { count: 0, tags: new Set() };
              }
              if (look.autor) {
                acc[look.autor].count += 1;
                (look.tags || []).forEach((t) => acc[look.autor].tags.add(t));
              }
              return acc;
            }, {})
          ).map(([name, info]) => {
            const initials = name
              .split(/\s+/)
              .map((p) => p.charAt(0))
              .join("")
              .slice(0, 2)
              .toUpperCase();
            return (
              <div className="influencer-card" key={name}>
                <div className="influencer-avatar">{initials}</div>
                <h4>{name}</h4>
                <p>
                  {info.count} {info.count === 1 ? "look publicado" : "looks publicados"} ·
                  {" "}
                  {Array.from(info.tags).slice(0, 2).join(" / ") || "editorial"}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <hr className="section-divider" />

      <SavedFavorites />
    </main>
  );
}