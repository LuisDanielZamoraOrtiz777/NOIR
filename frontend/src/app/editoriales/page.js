import PostCard from "@/components/PostCard";
import posts from "@/data/posts";

export const metadata = {
  title: "Editoriales — Noir Atelier",
  description: "Las últimas publicaciones de moda y estética editorial. Descubre tendencias, fotógrafos y procesos creativos.",
};

export default function EditorialesPage({ searchParams }) {
  const query = searchParams?.q || "";
  
  const allEditoriales = posts.filter((post) => post.category === "Editorial");
  
  const filteredEditoriales = query
    ? allEditoriales.filter(
        (post) =>
          post.title.toLowerCase().includes(query.toLowerCase()) ||
          post.summary.toLowerCase().includes(query.toLowerCase())
      )
    : allEditoriales;

  return (
    <main className="section-block page-content">
      <section className="editoriales-hero" data-element="editoriales-hero">
        <h1>Editoriales</h1>
        <p className="editoriales-intro">
          Las últimas publicaciones de moda y estética editorial. 
          Cada número es una exploración visual entre el minimalismo y la vanguardia.
        </p>
        <div className="editoriales-stats">
          <div className="stat-item">
            <strong>12</strong>
            <span>Editoriales publicadas</span>
          </div>
          <div className="stat-item">
            <strong>5</strong>
            <span>Fotógrafos colaboradores</span>
          </div>
          <div className="stat-item">
            <strong>3</strong>
            <span>Temporadas</span>
          </div>
        </div>
      </section>

      {query && (
        <div className="search-results-banner">
          <p>
            Resultados de búsqueda para: <strong>"{query}"</strong> ({filteredEditoriales.length} {filteredEditoriales.length === 1 ? "resultado encontrado" : "resultados encontrados"})
          </p>
          <a href="/editoriales" className="clear-search-link">
            Limpiar búsqueda
          </a>
        </div>
      )}

      <section className="editoriales-featured" data-element="editoriales-featured">
        <h2>Editorial Destacada</h2>
        {filteredEditoriales.length > 0 && (
          <article className="featured-editorial">
            <h3>{filteredEditoriales[0].title}</h3>
            <p className="editorial-meta">
              Por <strong>{filteredEditoriales[0].author || "Equipo Editorial Noir"}</strong> · 
              {filteredEditoriales[0].date || "Junio 2026"} · 
              <span className="read-time">12 min lectura</span>
            </p>
            <p>{filteredEditoriales[0].summary}</p>
            <a href={`/editoriales/${filteredEditoriales[0].id}`} className="button">
              Ver editorial completa
            </a>
          </article>
        )}
      </section>

      <section className="editoriales-grid" data-element="editoriales-grid">
        <h2>Todas las Editoriales</h2>
        {filteredEditoriales.length > 0 ? (
          <div className="card-grid">
            {filteredEditoriales.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="no-results-box">
            <p>No se encontraron editoriales que coincidan con tu búsqueda.</p>
            <a href="/editoriales" className="button">
              Ver todas las editoriales
            </a>
          </div>
        )}
      </section>

      <section className="editoriales-process" data-element="editoriales-process">
        <h2>Proceso Editorial</h2>
        <div className="process-steps">
          <div className="process-step">
            <span className="step-number">01</span>
            <h4>Concepto</h4>
            <p>Definimos la narrativa visual y el moodboard de la temporada.</p>
          </div>
          <div className="process-step">
            <span className="step-number">02</span>
            <h4>Fotografía</h4>
            <p>Capturamos cada prenda con luz natural y composición editorial.</p>
          </div>
          <div className="process-step">
            <span className="step-number">03</span>
            <h4>Edición</h4>
            <p>Retoque minimalista que respeta la esencia de la prenda.</p>
          </div>
          <div className="process-step">
            <span className="step-number">04</span>
            <h4>Publicación</h4>
            <p>Lanzamos la editorial con contenido exclusivo para lectores y creadores inspirados en la moda.</p>
          </div>
        </div>
      </section>

      <section className="editoriales-cta" data-element="editoriales-cta">
        <h3>Descarga el Lookbook</h3>
        <p>Obtén la colección completa en alta resolución para inspiración profesional.</p>
        <a href="/contacto" className="button">Solicitar lookbook</a>
      </section>
    </main>
  );
}