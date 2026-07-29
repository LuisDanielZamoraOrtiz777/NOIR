"use client";
import { useEffect, useState } from "react";
import ProductCard from "./product-card";

export default function TiendaPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all products from the API
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/sister-store/products", {
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

        // Map the product data to match what ProductCard expects
        const mappedProducts = data.products.map(product => ({
          id: product.id.toString(),
          name: product.name,
          category: product.category,
          description: product.description || "",
          price: parseFloat(product.price),
          currency: product.currency,
          image_url: product.image_url,
          stock: product.stock,
          availability: product.stock > 0 ? "in_stock" : "out_of_stock",
        }));

        setProducts(mappedProducts);
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
    return <main className="tienda-page"><p className="state-message">Cargando productos...</p></main>;
  }

  if (error) {
    return <main className="tienda-page"><p className="state-message is-error">Error: {error}</p></main>;
  }

  return (
    <main className="tienda-page">
      <h1>Catálogo de productos</h1>
      {products.length === 0 ? (
        <p className="state-message">No hay productos disponibles en este momento.</p>
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