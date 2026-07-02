"use client";

import { useEffect, useState } from "react";
import FavoriteButton from "@/components/FavoriteButton";

export default function SisterStoreCatalog() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredProduct, setHoveredProduct] = useState(null);

  useEffect(() => {
    const url = "/api/sister-store/products";

    async function fetchProducts() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Accept": "application/json",
          },
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.error || "No se pudieron cargar los productos.");
        }

        const data = await response.json();

        if (!Array.isArray(data.products)) {
          throw new Error("Respuesta de API inválida.");
        }

        setProducts(data.products);
      } catch (fetchError) {
        setError(fetchError.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProducts();
  }, []);

  return (
    <section id="sister-store-section" className="section-block sister-store-section">
      <div className="section-header">
        <h2>Tienda hermana</h2>
        <p>Descubre productos seleccionados con estética editorial y material premium.</p>
      </div>

      {isLoading ? (
        <p aria-live="polite">Cargando catálogo...</p>
      ) : error ? (
        <p role="status" className="error-message">
          Error: {error}
        </p>
      ) : products.length === 0 ? (
        <p aria-live="polite">No hay productos disponibles en este momento.</p>
      ) : (
        <div className="card-grid sister-store-grid">
          {products.map((product) => (
            <article
              key={product.id}
              className={`product-card ${hoveredProduct === product.id ? "is-hovered" : ""}`}
              onMouseEnter={() => setHoveredProduct(product.id)}
              onMouseLeave={() => setHoveredProduct(null)}
              onFocus={() => setHoveredProduct(product.id)}
              onBlur={() => setHoveredProduct(null)}
              tabIndex={0}
            >
              <div className="product-card-body">
                <h3>{product.name}</h3>
                <p className="product-category">{product.category}</p>
                <p className="product-description">{product.description}</p>
              </div>
              <div className="product-card-footer">
                <span className="product-price">
                  {product.currency} {product.price.toFixed(2)}
                </span>
                <span className={`product-availability ${product.availability}`}>
                  {product.availability === "in_stock" ? "En stock" : "Bajo stock"}
                </span>
              </div>
              {hoveredProduct === product.id ? (
                <div className="product-card-actions">
                  <FavoriteButton postId={product.id} />
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
