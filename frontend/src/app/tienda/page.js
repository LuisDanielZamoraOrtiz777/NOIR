"use client";
import { useEffect, useState } from "react";
import ProductCard from "./product-card";

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
          headers: { Accept: "application/json" },
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
    return (
      <main className="tienda-page">
        <p className="state-message">Cargando productos de cotización...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="tienda-page">
        <p className="state-message is-error">Error al cargar productos: {error}</p>
      </main>
    );
  }

  return (
    <main className="tienda-page">
      <h1>Catálogo de Cotizaciones</h1>
      {products.length === 0 ? (
        <p className="state-message">No hay productos disponibles para cotizar por el momento.</p>
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </main>
  );
}