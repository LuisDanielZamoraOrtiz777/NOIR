"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import CartItemRow from "./CartItemRow";

/**
 * CartDrawer — Sidebar deslizante desde la derecha con los items del carrito.
 *
 * No muestra el formulario de checkout completo; solo lista items con imagen,
 * stepper, eliminar, "guardar para después" y botón para ir al checkout.
 */
export default function CartDrawer() {
  const {
    items,
    isOpen,
    closeDrawer,
    removeItem,
    updateQuantity,
    openDrawer,
    setProductsInfo,
  } = useCart();

  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(false);
  const [savedForLater, setSavedForLater] = useState([]);

  // Cargar info de productos cuando cambian los items
  useEffect(() => {
    async function fetchProducts() {
      if (items.length === 0) {
        setProducts({});
        return;
      }

      const productIds = items.map((i) => i.productId);
      const missing = productIds.filter((id) => !products[id]);

      if (missing.length === 0) return;

      setLoading(true);
      try {
        const response = await fetch("/api/productos", {
          method: "GET",
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error(`Error ${response.status}`);
        const data = await response.json();
        if (data.status === "success" && Array.isArray(data.products)) {
          const map = {};
          data.products.forEach((p) => {
            const id = String(p.id);
            map[id] = {
              id,
              name: p.nombre || p.name,
              description: p.descripcion || p.description || "",
              price: parseFloat(p.precio ?? p.price ?? 0),
              currency: p.currency || "USD",
              image_url: p.imagen_url || p.image_url,
              stock: p.stock,
            };
          });
          setProducts(map);
          setProductsInfo(Object.values(map));
        }
      } catch (err) {
        console.error("CartDrawer: error fetching products", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  // Lock body scroll cuando drawer está abierto
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);

  // Cerrar con tecla Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeDrawer();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, closeDrawer]);

  // Calcular subtotal y currency
  const subtotalInfo = useMemo(() => {
    let subtotal = 0;
    let currency = "USD";
    let hasItems = false;
    items.forEach((item) => {
      const product = products[item.productId];
      if (product) {
        subtotal += parseFloat(product.price) * item.quantity;
        currency = product.currency || currency;
        hasItems = true;
      }
    });
    return { subtotal, currency, hasItems };
  }, [items, products]);

  const count = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

  // Handle save for later (guardar en localStorage + mover de cart)
  const handleSaveForLater = (productId) => {
    const product = products[productId];
    if (!product) return;

    try {
      const saved = JSON.parse(localStorage.getItem("saved-for-later") || "[]");
      const entry = {
        productId,
        name: product.name,
        price: product.price,
        currency: product.currency,
        image_url: product.image_url,
        savedAt: new Date().toISOString(),
      };
      // No duplicar
      const filtered = saved.filter((s) => s.productId !== productId);
      filtered.unshift(entry);
      localStorage.setItem("saved-for-later", JSON.stringify(filtered));
      setSavedForLater(filtered);
    } catch (e) {
      console.warn("Error saving for later:", e);
    }

    removeItem(productId);
  };

  // Hydrate savedForLater on mount
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("saved-for-later") || "[]");
      setSavedForLater(saved);
    } catch {
      setSavedForLater([]);
    }
  }, []);

  return (
    <>
      {/* Overlay */}
      <div
        className={`cart-drawer-overlay ${isOpen ? "is-open" : ""}`}
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={`cart-drawer ${isOpen ? "is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de compras"
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <header className="cart-drawer-header">
          <h2 className="cart-drawer-title">
            Tu carrito
            {count > 0 && <span className="cart-drawer-count"> ({count})</span>}
          </h2>
          <button
            type="button"
            onClick={closeDrawer}
            className="cart-drawer-close"
            aria-label="Cerrar carrito"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        {/* Body */}
        <div className="cart-drawer-body">
          {items.length === 0 ? (
            <EmptyDrawerState savedForLater={savedForLater} />
          ) : (
            <div className="cart-drawer-items">
              {loading && Object.keys(products).length === 0 ? (
                <DrawerSkeleton />
              ) : (
                items.map((item) => (
                  <CartItemRow
                    key={item.productId}
                    item={item}
                    product={products[item.productId]}
                    onQuantityChange={updateQuantity}
                    onRemove={removeItem}
                    onSaveForLater={handleSaveForLater}
                    compact
                  />
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <footer className="cart-drawer-footer">
            <div className="cart-drawer-subtotal">
              <span className="cart-drawer-subtotal-label">Subtotal</span>
              <span className="cart-drawer-subtotal-amount">
                {subtotalInfo.currency} {subtotalInfo.subtotal.toFixed(2)}
              </span>
            </div>
            <p className="cart-drawer-shipping-note">
              El envío se coordina por WhatsApp tras confirmar el pedido.
            </p>
            <Link
              href="/carrito"
              onClick={closeDrawer}
              className="cart-drawer-checkout-btn"
            >
              Ir a checkout
            </Link>
            <button
              type="button"
              onClick={closeDrawer}
              className="cart-drawer-continue-btn"
            >
              Seguir comprando
            </button>
          </footer>
        )}
      </aside>
    </>
  );
}

function EmptyDrawerState({ savedForLater }) {
  return (
    <div className="cart-drawer-empty">
      <div className="cart-drawer-empty-icon" aria-hidden="true">
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
      </div>
      <h3 className="cart-drawer-empty-title">Tu carrito está vacío</h3>
      <p className="cart-drawer-empty-message">
        Descubre nuestra selección editorial de productos y comienza tu carrito.
      </p>
      <Link href="/tienda" className="cart-drawer-empty-cta">
        Explorar tienda
      </Link>

      {savedForLater.length > 0 && (
        <div className="cart-drawer-saved-section">
          <h4 className="cart-drawer-saved-title">Guardados para después</h4>
          <ul className="cart-drawer-saved-list">
            {savedForLater.slice(0, 3).map((item) => (
              <li key={item.productId} className="cart-drawer-saved-item">
                <span className="cart-drawer-saved-name">{item.name}</span>
                <span className="cart-drawer-saved-price">
                  {item.currency} {parseFloat(item.price).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function DrawerSkeleton() {
  return (
    <div className="cart-drawer-skeleton">
      {[1, 2].map((i) => (
        <div key={i} className="cart-drawer-skeleton-row">
          <div className="cart-drawer-skeleton-image" />
          <div className="cart-drawer-skeleton-content">
            <div className="cart-drawer-skeleton-line cart-drawer-skeleton-line-title" />
            <div className="cart-drawer-skeleton-line cart-drawer-skeleton-line-meta" />
            <div className="cart-drawer-skeleton-line cart-drawer-skeleton-line-price" />
          </div>
        </div>
      ))}
    </div>
  );
}