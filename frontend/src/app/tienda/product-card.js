import AddToCartButton from "@/components/AddToCartButton";
import Image from "next/image";

export default function ProductCard({ product }) {
  return (
    <article className="product-card">
      <div className="product-image" style={{ position: "relative", minHeight: 220 }}>
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, 33vw"
            style={{ objectFit: "cover", borderRadius: "8px" }}
            unoptimized
          />
        ) : (
          <div className="product-placeholder">
            {product.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div className="product-info">
        <span className="product-category">{product.category}</span>
        <h2>{product.name}</h2>
        {product.description && (
          <p className="product-description">{product.description}</p>
        )}
        <div className="product-price">
          {product.currency || "MXN"} {product.price.toFixed(2)}
        </div>
        <div className="product-actions">
          <AddToCartButton productId={product.id} />
        </div>
      </div>
    </article>
  );
}