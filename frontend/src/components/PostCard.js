import FavoriteButton from "@/components/FavoriteButton";

// Paletas para los placeholders según categoría
const PALETAS = {
  Editorial: ["#0b0b0b", "#2a2a2a", "#1a1a2e", "#16213e"],
  Look:      ["#2c1810", "#3d2314", "#1a0a00", "#261206"],
};

function obtenerColor(id, paleta) {
  const idx = id?.charCodeAt(id.length - 1) % paleta.length || 0;
  return paleta[idx];
}

function PostCardPlaceholder({ post }) {
  const paleta = PALETAS[post.category] || PALETAS.Editorial;
  const color  = obtenerColor(post.id, paleta);
  const inicial = post.title?.charAt(0) || "N";

  return (
    <div
      className="post-card-placeholder"
      style={{ background: color }}
      aria-hidden="true"
    >
      <span className="post-card-placeholder-letra">{inicial}</span>
      <span className="post-card-placeholder-cat">{post.category}</span>
    </div>
  );
}

export default function PostCard({ post }) {
  return (
    <article className="post-card" id={`post-${post.id}`} data-element="tarjeta-articulo">
      <div className="post-card-image-container">
        <PostCardPlaceholder post={post} />
      </div>
      <div className="post-card-copy">
        <p className="post-category">{post.category}</p>
        <h3>{post.title}</h3>
        <p>{post.summary}</p>
      </div>
      <FavoriteButton postId={post.id} />
    </article>
  );
}
