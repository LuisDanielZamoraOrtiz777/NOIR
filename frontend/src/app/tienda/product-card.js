import { useState } from "react";
import AddToCartButton from "@/components/AddToCartButton";

export default function ProductCard({ product }) {
  const [hovered, setHovered] = useState(false);

  return (
    <article
      className={`product-card ${hovered ? "is-hovered" : ""}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      tabIndex={0}
    >
      <div className="product-card-image-container">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="product-card-image"
          />
        ) : (
          <div className="product-card-placeholder" style={{ background: "#ccc" }}>
            <span className="product-card-placeholder-letra">{product.name.charAt(0).toUpperCase()}</span>
            <span className="product-card-placeholder-cat">{product.category}</span>
          </div>
        )}
      </div>

      <div className="product-card-content">
        <h3>{product.name}</h3>
        <p className="product-category">{product.category}</p>
        {product.description && (
          <p className="product-description">{product.description}</p>
        )}
        <div className="product-card-footer">
          <span className="product-price">
            {product.currency} {product.price.toFixed(2)}
          </span>
          <span className={`product-availability ${product.availability}`}>
            {product.availability === "in_stock" ? "En stock" : "Agotado"}
          </span>
        </div>
        {hovered && (
          <div className="product-card-actions">
            <AddToCartButton productId={product.id} product={product} />
          </div>
        )}
      </div>
    </article>
  );
}