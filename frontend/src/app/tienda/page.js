"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import AddToCartButton from "@/components/AddToCartButton";

export default function TiendaPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/productos", {
          method: "GET",
          headers: { "Accept": "application/json" },
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.status !== "success" || !Array.isArray(data.products)) {
          throw new Error("Respuesta de API inválida");
        }

        setProducts(data.products);
      } catch (err) {
        setError(err.message || "Error desconocido");
        console.error("Failed to fetch products:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  if (loading) {
    return <main><p>Cargando productos...</p></main>;
  }

  if (error) {
    return <main><p>Error: {error}</p></main>;
  }

  return (
    <main>
      <h1>Catálogo de productos</h1>
      {products.length === 0 ? (
        <p>No hay productos disponibles en este momento.</p>
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <article key={product.id} className="product-card">
              <div className="product-image">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    loading="lazy"
                  />
                ) : (
                  <div className="product-placeholder">
                    {product.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="product-info">
                <h2>{product.name}</h2>
                <p className="product-category">{product.category}</p>
                <p className="product-description">{product.description}</p>
                <p className="product-price">
                  {product.currency} {parseFloat(product.price).toFixed(2)}
                </p>
                <p className="product-stock">
                  {parseInt(product.stock) > 0
                    ? `En stock: ${product.stock} unidades`
                    : "Agotado"
                  }
                </p>
                <div className="product-actions">
                  <AddToCartButton productId={product.id} />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}