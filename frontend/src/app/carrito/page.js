"use client";
import { useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { validate } from "@/utils/validators";
import OrderSuccess from "@/components/OrderSuccess";
import QuantityStepper from "@/components/cart/QuantityStepper";

export default function CartPage() {
  const { items, updateQuantity, removeItem, clear } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [formValues, setFormValues] = useState({
    client_name: "",
    client_phone: "",
    client_email: "",
    notes: "",
  });
    const [formErrors, setFormErrors] = useState({});
    const [stockWarnings, setStockWarnings] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderStatus, setOrderStatus] = useState(null);
  const [orderMessage, setOrderMessage] = useState("");
  const [completedOrder, setCompletedOrder] = useState(null);
  const formRef = useRef(null);
  const errorFieldRef = useRef(null);

  // Check authentication on mount
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("user_token") : null;
    setIsAuthenticated(!!token);
  }, []);

  // Fetch products from API
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/productos", {
          method: "GET",
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
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

  // Persist last completed order across refresh
  useEffect(() => {
    try {
      const lastOrder = sessionStorage.getItem("lastOrder");
      if (lastOrder) {
        const parsed = JSON.parse(lastOrder);
        setCompletedOrder(parsed);
        setOrderStatus("success");
        setOrderMessage("Pedido creado exitosamente");
      }
    } catch {}
  }, []);

  // Focus first error field
  useEffect(() => {
    if (formErrors && errorFieldRef.current) {
      errorFieldRef.current.focus();
    }
  }, [formErrors]);

  // Build a map for O(1) lookups
  const productMap = useMemo(() => {
    const m = {};
    products.forEach((p) => {
      m[p.id] = p;
    });
    return m;
  }, [products]);

  // Calculate totals
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  let totalPrice = 0;
  let totalCurrency = "USD";
  let hasCurrency = false;
  items.forEach((item) => {
    const product = productMap[item.productId];
    if (product) {
      totalPrice += parseFloat(product.price) * item.quantity;
      if (!hasCurrency && product.currency) {
        totalCurrency = product.currency;
        hasCurrency = true;
      }
    }
  });

  // Handle quantity change via QuantityStepper
  const handleQtyChange = (productId, qty) => {
    if (qty <= 0) {
      removeItem(productId);
      return;
    }
    updateQuantity(productId, qty);
  };

  // Handle remove
  const removeFromCart = (productId) => {
    removeItem(productId);
  };

  // Handle form input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormErrors({});
    setStockWarnings([]);
    setOrderStatus(null);
    setOrderMessage("");

    const errors = validate(formValues);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setIsSubmitting(false);
      return;
    }

    if (items.length === 0) {
      setFormErrors({ general: "El carrito está vacío" });
      setIsSubmitting(false);
      return;
    }

    // Build order items + stock check
    const orderItems = [];
    for (const cartItem of items) {
      const product = productMap[cartItem.productId];
      if (!product) {
        setFormErrors({ general: `Producto no disponible: ${cartItem.productId}` });
        setIsSubmitting(false);
        return;
      }
      const stockNum = parseInt(product.stock, 10);
      if (Number.isFinite(stockNum) && stockNum < cartItem.quantity) {
        setStockWarnings((prev) => [
          ...prev,
          `Stock insuficiente para ${product.name}. Disponible: ${stockNum}, solicitado: ${cartItem.quantity}`,
        ]);
      }
      orderItems.push({
        product_id: product.id,
        quantity: cartItem.quantity,
      });
    }

    // Snapshot customer data BEFORE any state reset
    const customerSnapshot = {
      name: formValues.client_name.trim(),
      phone: formValues.client_phone.trim(),
      email: formValues.client_email.trim(),
      notes: formValues.notes.trim(),
    };

    // Snapshot cart for rollback
    const cartSnapshot = JSON.parse(JSON.stringify(items));

    // UUID v4 for idempotency
    const requestId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          });

    // OPTIMISTIC CLEAR: vaciar carrito antes del fetch
    clear();

    // Reset form (snapshot ya tiene los datos)
    setFormValues({ client_name: "", client_phone: "", client_email: "", notes: "" });

    try {
      const response = await fetch("/api/pedidos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Client-Request-Id": requestId,
        },
        body: JSON.stringify({
          cliente_nombre: customerSnapshot.name,
          cliente_telefono: customerSnapshot.phone,
          cliente_email: customerSnapshot.email || null,
          items: orderItems,
          notas: customerSnapshot.notes || null,
          client_request_id: requestId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // ROLLBACK: restaurar carrito via context
        if (cartSnapshot.length > 0) {
          cartSnapshot.forEach((it) => {
            updateQuantity(it.productId, it.quantity);
          });
        }
        const message = data.error || data.detail || data.message || `Error ${response.status}`;
        let fieldError = null;
        if (message.includes("nombre del cliente")) fieldError = "client_name";
        else if (message.includes("teléfono del cliente")) fieldError = "client_phone";
        else if (message.includes("correo electrónico")) fieldError = "client_email";

        if (fieldError) {
          setFormErrors((prev) => ({ ...prev, [fieldError]: message }));
        } else {
          setOrderStatus("error");
          setOrderMessage(message);
        }
        setIsSubmitting(false);
        return;
      }

      if (!data.order_id) {
        // ROLLBACK
        if (cartSnapshot.length > 0) {
          cartSnapshot.forEach((it) => {
            updateQuantity(it.productId, it.quantity);
          });
        }
        console.error("API returned success but no order_id", data);
        setOrderStatus("error");
        setOrderMessage("El pedido no pudo completarse: respuesta inválida del servidor.");
        setIsSubmitting(false);
        return;
      }

      const orderData = {
        orderId: data.order_id,
        total: data.total,
        items: orderItems.map((item) => ({
          product: productMap[item.product_id],
          quantity: item.quantity,
        })),
        customer: customerSnapshot,
        requestId,
        stockWarnings: data.stock_warnings || [],
      };

      try {
        sessionStorage.setItem("lastOrder", JSON.stringify(orderData));
      } catch (e) {
        console.warn("Could not persist order:", e);
      }

      setCompletedOrder(orderData);
      setOrderStatus("success");
      setOrderMessage(data.message || "Pedido creado exitosamente");

      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err) {
      // ROLLBACK on network error
      if (cartSnapshot.length > 0) {
        cartSnapshot.forEach((it) => {
          updateQuantity(it.productId, it.quantity);
        });
      }
      setOrderStatus("error");
      setOrderMessage(err.message || "Error al procesar el pedido");
      console.error("Order creation error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // WhatsApp message uses completedOrder (NOT formValues which was reset)
  const generateWhatsAppMessage = () => {
    if (!completedOrder) return "";
    const { orderId, total, items: orderItems, customer } = completedOrder;
    const lines = [
      `*Nuevo pedido de Noir Atelier*`,
      `Pedido #: ${orderId}`,
      `Fecha: ${new Date().toLocaleString()}`,
      "",
      "*Productos:*",
    ];

    orderItems.forEach(({ product, quantity }) => {
      const name = product?.name || "Producto";
      const price = parseFloat(product?.price || 0);
      const currency = product?.currency || "USD";
      lines.push(`- ${name} x${quantity} = ${currency} ${(price * quantity).toFixed(2)}`);
    });

    const totalCurrency = orderItems[0]?.product?.currency || "USD";
    lines.push("");
    lines.push(`*Total: ${totalCurrency} ${parseFloat(total).toFixed(2)}*`);
    lines.push("");
    lines.push(`Datos del cliente:`);
    lines.push(`Nombre: ${customer?.name || ""}`);
    lines.push(`Teléfono: ${customer?.phone || ""}`);
    if (customer?.email) lines.push(`Email: ${customer.email}`);
    if (customer?.notes) lines.push(`Notas: ${customer.notes}`);

    return lines.join("\n");
  };

  const handleSendWhatsApp = () => {
    if (!completedOrder) {
      alert("Primero debe crear el pedido.");
      return;
    }
    const phoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
    if (!phoneNumber) {
      alert("El número de WhatsApp del negocio no está configurado.");
      return;
    }
    const message = generateWhatsAppMessage();
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleContinueShopping = () => {
    setCompletedOrder(null);
    setOrderStatus(null);
    setOrderMessage("");
    try {
      sessionStorage.removeItem("lastOrder");
    } catch (e) {}
  };

  if (loading) {
    return (
      <main className="cart-page">
        <div className="cart-loading-state">
          <div className="cart-spinner" aria-hidden="true"></div>
          <p className="state-message">Cargando productos...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="cart-page">
        <div className="cart-error-banner" role="alert">
          <p className="state-message is-error">Error: {error}</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="cart-page">
        <div className="acceso-requerido-card" style={{ maxWidth: 480, margin: "0 auto" }}>
          <div className="cart-page-empty-icon" aria-hidden="true">🔒</div>
          <h1>Acceso requerido</h1>
          <p>Debes iniciar sesión para poder crear pedidos y comprar productos de Noir Atelier.</p>
          <Link href="/acceso" className="primary-button" style={{ display: "inline-block" }}>
            Iniciar sesión
          </Link>
        </div>
      </main>
    );
  }

  if (orderStatus === "success" && completedOrder) {
    return (
      <main className="cart-page">
        <OrderSuccess
          order={completedOrder}
          onWhatsApp={handleSendWhatsApp}
          onContinue={handleContinueShopping}
        />
      </main>
    );
  }

  return (
    <main className="cart-page checkout-layout">
      {items.length === 0 ? (
        <div className="cart-page-empty" style={{ gridColumn: "1 / -1" }}>
          <div className="cart-page-empty-icon" aria-hidden="true">🛒</div>
          <h1>Tu carrito está vacío</h1>
          <p>Descubre nuestra selección editorial de productos.</p>
          <Link href="/tienda" className="primary-button">
            Explorar tienda
          </Link>
        </div>
      ) : (
        <>
          <div className="checkout-main">
            <h1 className="checkout-title">Tu carrito</h1>

            <section className="checkout-items-section" aria-label="Productos en el carrito">
              <h2 className="checkout-section-title">
                Productos ({totalItems} artículo{totalItems !== 1 ? "s" : ""})
              </h2>
              <ul className="checkout-items-list">
                {items.map((item) => {
                  const product = productMap[item.productId];
                  if (!product) return null;

                  const stockNum = parseInt(product.stock, 10);
                  const maxStock = Number.isFinite(stockNum) ? stockNum : undefined;
                  const isOutOfStock = maxStock !== undefined && maxStock <= 0;

                  return (
                    <li key={item.productId} className="checkout-item-row">
                      <div className="checkout-item-image-wrapper">
                        {product.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="checkout-item-image"
                            loading="lazy"
                          />
                        ) : (
                          <div className="checkout-item-image-placeholder">
                            {product.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="checkout-item-info">
                        <h3>{product.name}</h3>
                        <p className="checkout-item-price">
                          {product.currency || "USD"} {parseFloat(product.price).toFixed(2)} c/u
                        </p>
                        {maxStock !== undefined && maxStock > 0 && maxStock <= 5 && (
                          <span className="checkout-item-stock-warning">
                            ¡Solo quedan {maxStock}!
                          </span>
                        )}
                        {isOutOfStock && (
                          <span className="checkout-item-stock-warning">Agotado</span>
                        )}
                      </div>

                      <div className="checkout-item-stepper">
                        {isOutOfStock ? (
                          <span className="checkout-item-out-of-stock">Sin stock</span>
                        ) : (
                          <QuantityStepper
                            value={item.quantity}
                            onChange={(qty) => handleQtyChange(item.productId, qty)}
                            min={1}
                            max={maxStock}
                            ariaLabel={`Cantidad de ${product.name}`}
                          />
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.productId)}
                        className="cart-item-remove"
                        aria-label={`Eliminar ${product.name} del carrito`}
                      >
                        Eliminar
                      </button>

                      <div className="checkout-item-subtotal">
                        {product.currency || "USD"}{" "}
                        {(parseFloat(product.price) * item.quantity).toFixed(2)}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="checkout-form-section" aria-label="Datos de envío">
              <h2 className="checkout-section-title">Datos de envío</h2>
              <form onSubmit={handleSubmit} ref={formRef} className="checkout-form">
                <div className="form-field">
                  <label htmlFor="client_name">Nombre *</label>
                  <input
                    type="text"
                    id="client_name"
                    name="client_name"
                    value={formValues.client_name}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                    aria-invalid={!!formErrors.client_name}
                    aria-describedby={formErrors.client_name ? "error-client_name" : undefined}
                    ref={formErrors.client_name ? errorFieldRef : null}
                  />
                  {formErrors.client_name && (
                    <span className="error" id="error-client_name" role="alert">
                      {formErrors.client_name}
                    </span>
                  )}
                </div>

                <div className="form-field">
                  <label htmlFor="client_phone">Teléfono *</label>
                  <input
                    type="tel"
                    id="client_phone"
                    name="client_phone"
                    value={formValues.client_phone}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                    aria-invalid={!!formErrors.client_phone}
                    aria-describedby={formErrors.client_phone ? "error-client_phone" : undefined}
                    ref={formErrors.client_phone ? errorFieldRef : null}
                  />
                  {formErrors.client_phone && (
                    <span className="error" id="error-client_phone" role="alert">
                      {formErrors.client_phone}
                    </span>
                  )}
                </div>

                <div className="form-field">
                  <label htmlFor="client_email">Correo electrónico (opcional)</label>
                  <input
                    type="email"
                    id="client_email"
                    name="client_email"
                    value={formValues.client_email}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    aria-invalid={!!formErrors.client_email}
                    aria-describedby={formErrors.client_email ? "error-client_email" : undefined}
                    ref={formErrors.client_email ? errorFieldRef : null}
                  />
                  {formErrors.client_email && (
                    <span className="error" id="error-client_email" role="alert">
                      {formErrors.client_email}
                    </span>
                  )}
                </div>

                <div className="form-field">
                  <label htmlFor="notes">Notas (opcional)</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formValues.notes}
                    onChange={handleChange}
                    rows={3}
                    disabled={isSubmitting}
                  />
                </div>

                {stockWarnings.length > 0 && (
                  <div className="stock-warnings" role="status" aria-live="polite">
                    <ul>
                      {stockWarnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                    <small>Se creará el pedido como cotización. Nos pondremos en contacto para confirmar disponibilidad.</small>
                  </div>
                )}

                {formErrors.general && (
                  <div className="error general-error" role="alert">
                    {formErrors.general}
                  </div>
                )}

                {orderStatus === "error" && orderMessage && (
                  <div className="error general-error" role="alert">
                    {orderMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="primary-button checkout-submit"
                >
                  {isSubmitting ? (
                    <>
                      <span className="btn-spinner" aria-hidden="true"></span>
                      Procesando tu pedido...
                    </>
                  ) : (
                    "Crear pedido"
                  )}
                </button>
              </form>
            </section>
          </div>

          <aside className="checkout-summary-sticky" aria-label="Resumen del pedido">
            <div className="checkout-summary">
              <h2 className="checkout-summary-title">Resumen</h2>
              <ul className="checkout-summary-list">
                {items.map((item) => {
                  const product = productMap[item.productId];
                  if (!product) return null;
                  return (
                    <li key={item.productId} className="checkout-summary-list-item">
                      <span className="checkout-summary-list-name">
                        {product.name}
                        <span className="checkout-summary-list-qty"> × {item.quantity}</span>
                      </span>
                      <span className="checkout-summary-list-price">
                        {product.currency || "USD"}{" "}
                        {(parseFloat(product.price) * item.quantity).toFixed(2)}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <div className="checkout-summary-divider" />
              <div className="checkout-summary-row">
                <span>Envío</span>
                <span className="checkout-summary-shipping-note">A coordinar</span>
              </div>
              <div className="checkout-summary-total">
                <span>Total</span>
                <strong>
                  {totalCurrency} {totalPrice.toFixed(2)}
                </strong>
              </div>
              <p className="checkout-summary-footer">
                El pago se realiza vía WhatsApp. Crea el pedido y te contactaremos para
                coordinar el envío.
              </p>
            </div>
          </aside>
        </>
      )}
    </main>
  );
}