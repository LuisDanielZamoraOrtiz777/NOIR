import FavoriteButton from "@/components/FavoriteButton";

const PALETAS = {
  Editorial:    ["#0b0b0b", "#1a1a2e", "#16213e", "#2a2a2a"],
  Look:         ["#2c1810", "#3d2314", "#1a0a00", "#261206"],
  Pasarela:     ["#0d1b2a", "#1b2838", "#243447", "#0a1628"],
  Trend:        ["#1a0d2e", "#2d1b69", "#1a0a3d", "#120825"],
  Tendencia:    ["#0a2e1a", "#0d3d26", "#0f4a30", "#1a5c3d"],
  Colaboración: ["#2e1a0a", "#3d2610", "#4a3018", "#5c3d1e"],
};

function obtenerColor(id, categoria) {
  const paleta = PALETAS[categoria] || PALETAS.Editorial;
  const idx = id?.charCodeAt(id.length - 1) % paleta.length || 0;
  return paleta[idx];
}

function PostCardPlaceholder({ post }) {
  const bg = obtenerColor(post.id, post.categoria || post.category);
  const inicial = (post.titulo || post.title)?.charAt(0) || "N";
  return (
    <div className="post-card-placeholder" style={{ background: bg }} aria-hidden="true">
      <span className="post-card-placeholder-letra">{inicial}</span>
      <span className="post-card-placeholder-cat">{post.categoria || post.category}</span>
    </div>
  );
}

export default function PostCard({ post }) {
  const titulo = post.titulo || post.title;
  const autor  = post.autor;
  const fecha  = post.fecha;
  const tags   = post.tags || [];

  return (
    <article className="post-card" id={`post-${post.id}`} data-element="tarjeta-articulo">
      {/* Imagen / Placeholder */}
      <div className="post-card-image-container">
        <PostCardPlaceholder post={post} />
      </div>

      {/* Cuerpo */}
      <div className="post-card-copy">
        {/* Categoría + fecha */}
        <div className="post-card-meta-row">
          <p className="post-category">{post.categoria || post.category}</p>
          {fecha && <time className="post-card-fecha">{fecha}</time>}
        </div>

        <h3>{titulo}</h3>
        <p>{post.summary}</p>

        {/* Autor */}
        {autor && (
          <p className="post-card-autor">Por <strong>{autor}</strong></p>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="post-card-tags" aria-label="Etiquetas">
            {tags.map((tag) => (
              <span key={tag} className="post-tag">{tag}</span>
            ))}
          </div>
        )}
      </div>

      <FavoriteButton postId={post.id} />
    </article>
  );
}
