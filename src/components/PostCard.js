import Image from "next/image";
import FavoriteButton from "@/components/FavoriteButton";

export default function PostCard({ post }) {
  return (
    <article className="post-card" id={`post-${post.id}`} data-element="tarjeta-articulo">
      {post.image && (
        <div className="post-card-image-container">
          <Image
            src={post.image}
            alt={post.title}
            width={480}
            height={320}
            className="post-card-image"
            sizes="(max-width: 768px) 100vw, 480px"
          />
        </div>
      )}
      <div className="post-card-copy">
        <p className="post-category">{post.category}</p>
        <h3>{post.title}</h3>
        <p>{post.summary}</p>
      </div>
      <FavoriteButton postId={post.id} />
    </article>
  );
}
