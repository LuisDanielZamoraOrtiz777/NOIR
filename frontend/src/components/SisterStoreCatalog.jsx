"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function SisterStoreCatalog({ limite = 4 }) {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProducts() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/sister-store/products", {
          method: "GET",
          headers: { "Accept": "application/json" },
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.message || "No se pudieron cargar los productos.");
        }

        const data = await response.json();

        if (!Array.isArray(data.products)) {
          throw new Error("Respuesta de API inválida.");
        }

        setProducts(data.products.slice(0, limite));
      } catch (fetchError) {
        setError(fetchError.message);
        console.error("SisterStoreCatalog error:", fetchError);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProducts();
  }, [limite]);

  return (
    <section id="sister-store-section" className="section-block sister-store-section">
      <div className="section-header">
        <div>
          <h2>Publicaciones y productos destacados</h2>
          <p className="section-subtitle">Descubre productos seleccionados de Noir Atelier con estética editorial y cotización directa.</p>
        </div>
        <Link href="/tienda" className="button ver-mas-btn">
          Ver catálogo completo →
        </Link>
      </div>

      {isLoading ? (
        <p aria-live="polite">Cargando catálogo...</p>
      ) : error ? (
        <p role="status" className="error-message">
          Error al cargar productos: {error}
        </p>
      ) : products.length === 0 ? (
        <p aria-live="polite">No hay productos disponibles en este momento. Vuelve pronto.</p>
      ) : (
        <div className="card-grid sister-store-grid">
          {products.map((product) => (
            <article
              key={product.id}
              className="product-card"
            >
              <div className="product-card-image">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} loading="lazy" />
                ) : (
                  <div className="product-placeholder">{product.name.charAt(0).toUpperCase()}</div>
                )}
              </div>
              <div className="product-card-body">
                <h3>{product.name}</h3>
                <p className="product-category">{product.category}</p>
                {product.description && <p className="product-description">{product.description}</p>}
              </div>
              <div className="product-card-footer">
                <span className="product-price">
                  {product.currency} {parseFloat(product.price).toFixed(2)}
                </span>
              </div>
              <Link href="/tienda" className="product-card-link">
                Cotizar ahora →
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
