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
            <strong>24</strong>
            <span>Looks destacados (ejemplo)</span>
          </div>
          <div className="stat-item">
            <strong>8</strong>
            <span>Estilistas de referencia (ejemplo)</span>
          </div>
          <div className="stat-item">
            <strong>15</strong>
            <span>Marcas de referencia (ejemplo)</span>
          </div>
        </div>
      </section>

      {query && (
        <div className="search-results-banner">
          <p>
            Resultados de búsqueda para: <strong>"{query}"</strong> ({filteredLooks.length} {filteredLooks.length === 1 ? "resultado encontrado" : "resultados encontrados"})
          </p>
          <a href="/looks" className="clear-search-link">
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
            <a href="/looks" className="button">
              Ver todos los looks
            </a>
          </div>
        )}
      </section>

      <section className="looks-influencers" data-element="looks-influencers">
        <h2>Quién lo usa</h2>
        <div className="influencers-grid">
          <div className="influencer-card">
            <div className="influencer-avatar">CM</div>
            <h4>Carolina M.</h4>
            <p>Estilista · @carolinastyle</p>
          </div>
          <div className="influencer-card">
            <div className="influencer-avatar">DR</div>
            <h4>Diego R.</h4>
            <p>Director creativo · @diegoramos</p>
          </div>
          <div className="influencer-card">
            <div className="influencer-avatar">VT</div>
            <h4>Valentina T.</h4>
            <p>Modelo · @valentinatrends</p>
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      <SavedFavorites />
    </main>
  );
}