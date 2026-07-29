"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { getCookie, setCookie, deleteCookie } from "@/utils/cookies";
import { validate } from "@/utils/validators";
import OrderSuccess from "@/components/OrderSuccess";

export default function CartPage() {
  const [cartItems, setCartItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formValues, setFormValues] = useState({
    client_name: "",
    client_phone: "",
    client_email: "",
    notes: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderStatus, setOrderStatus] = useState(null); // null, 'success', 'error'
  const [orderMessage, setOrderMessage] = useState("");
  const [completedOrder, setCompletedOrder] = useState(null); // Full order data for success screen
  const formRef = useRef(null);
  const errorFieldRef = useRef(null);

  // Fetch all products from the API
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

  // Load cart from cookie
  useEffect(() => {
    const cartCookie = getCookie("cart");
    if (cartCookie) {
      try {
        const cartList = JSON.parse(cartCookie);
        setCartItems(cartList);
      } catch (e) {
        setCartItems([]);
      }
    } else {
      setCartItems([]);
    }
  }, []);

  // Check sessionStorage for a completed order (persistence after refresh)
  useEffect(() => {
    try {
      const lastOrder = sessionStorage.getItem("lastOrder");
      if (lastOrder) {
        const parsed = JSON.parse(lastOrder);
        setCompletedOrder(parsed);
        setOrderStatus("success");
        setOrderMessage("Pedido creado exitosamente");
      }
    } catch (e) {
      // Ignore parse errors
    }
  }, []);

  // Listen for cart updates from other components (like AddToCartButton)
  useEffect(() => {
    const handleCartUpdate = () => {
      const cartCookie = getCookie("cart");
      if (cartCookie) {
        try {
          const cartList = JSON.parse(cartCookie);
          setCartItems(cartList);
        } catch (e) {
          setCartItems([]);
        }
      } else {
        setCartItems([]);
      }
    };

    window.addEventListener("cart-updated", handleCartUpdate);
    return () => {
      window.removeEventListener("cart-updated", handleCartUpdate);
    };
  }, []);

  // Focus first error field after validation fails
  useEffect(() => {
    if (formErrors && errorFieldRef.current) {
      errorFieldRef.current.focus();
    }
  }, [formErrors]);

  // Calculate total items and total price + currency
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  let totalPrice = 0;
  let totalCurrency = "USD";
  let hasCurrency = false;
  cartItems.forEach((item) => {
    const product = products.find(p => p.id === item.productId);
    if (product) {
      totalPrice += parseFloat(product.price) * item.quantity;
      if (!hasCurrency && product.currency) {
        totalCurrency = product.currency;
        hasCurrency = true;
      }
    }
  });

  // Handle remove from cart
  const removeFromCart = (productId) => {
    const cartCookie = getCookie("cart");
    if (!cartCookie) return;

    try {
      let cartList = JSON.parse(cartCookie);
      cartList = cartList.filter(item => item.productId !== productId);
      if (cartList.length === 0) {
        deleteCookie("cart");
        setCartItems([]);
      } else {
        setCookie("cart", JSON.stringify(cartList), 30);
        setCartItems(cartList);
      }
      window.dispatchEvent(new Event("cart-updated"));
    } catch (e) {
      console.error("Error removing from cart:", e);
    }
  };

  // Handle form input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
    // Clear error for this field on input
    setFormErrors(prev => ({ ...prev, [name]: undefined }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormErrors({});
    setOrderStatus(null);
    setOrderMessage("");

    // Validate form
    const errors = validate(formValues);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setIsSubmitting(false);
      return;
    }

    if (totalItems === 0) {
      setFormErrors({ general: "El carrito está vacío" });
      setIsSubmitting(false);
      return;
    }

    // Prepare order items for API
    const orderItems = [];
    for (const cartItem of cartItems) {
      const product = products.find(p => p.id === cartItem.productId);
      if (!product) {
        setFormErrors({ general: `Producto no disponible: ${cartItem.productId}` });
        setIsSubmitting(false);
        return;
      }

      // Check stock
      if (parseInt(product.stock) < cartItem.quantity) {
        setFormErrors({ general: `Stock insuficiente para ${product.name}. Disponible: ${product.stock}` });
        setIsSubmitting(false);
        return;
      }

      orderItems.push({
        product_id: product.id,
        quantity: cartItem.quantity,
      });
    }

    // Snapshot customer data BEFORE any state changes (for WhatsApp message)
    const customerSnapshot = {
      name: formValues.client_name.trim(),
      phone: formValues.client_phone.trim(),
      email: formValues.client_email.trim(),
      notes: formValues.notes.trim(),
    };

    // Snapshot del carrito para rollback si falla el fetch
    const cartSnapshot = JSON.parse(JSON.stringify(cartItems));

    // Generar UUID v4 para idempotencia (cliente_telefono + tiempo como heurística server-side)
    const requestId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          });

    // LIMPIAR carrito optimistamente ANTES del fetch
    try {
      deleteCookie("cart");
      setCartItems([]);
      window.dispatchEvent(new Event("cart-updated"));
    } catch (e) {
      console.error("Error clearing cart optimistically:", e);
    }

    // Reset form (los datos ya están guardados en customerSnapshot)
    setFormValues({
      client_name: "",
      client_phone: "",
      client_email: "",
      notes: "",
    });

    try {
      const response = await fetch("/api/pedidos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
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
        // ROLLBACK: restaurar carrito desde snapshot
        if (cartSnapshot.length > 0) {
          setCookie("cart", JSON.stringify(cartSnapshot), 30);
          setCartItems(cartSnapshot);
          window.dispatchEvent(new Event("cart-updated"));
        }
        const message = data.error || data.detail || data.message || `Error ${response.status}`;
        let fieldError = null;
        if (message.includes("nombre del cliente")) {
          fieldError = "client_name";
        } else if (message.includes("teléfono del cliente")) {
          fieldError = "client_phone";
        } else if (message.includes("correo electrónico")) {
          fieldError = "client_email";
        }

        if (fieldError) {
          setFormErrors(prev => ({ ...prev, [fieldError]: message }));
        } else {
          setOrderStatus("error");
          setOrderMessage(message);
        }
        setIsSubmitting(false);
        return;
      }

      // Defensive validation: ensure order_id exists
      if (!data.order_id) {
        // ROLLBACK
        if (cartSnapshot.length > 0) {
          setCookie("cart", JSON.stringify(cartSnapshot), 30);
          setCartItems(cartSnapshot);
          window.dispatchEvent(new Event("cart-updated"));
        }
        console.error("API returned success but no order_id", data);
        setOrderStatus("error");
        setOrderMessage("El pedido no pudo completarse: respuesta inválida del servidor.");
        setIsSubmitting(false);
        return;
      }

      // Build the complete order object for success screen
      const orderData = {
        orderId: data.order_id,
        total: data.total,
        items: orderItems.map(item => ({
          product: products.find(p => p.id === item.product_id),
          quantity: item.quantity,
        })),
        customer: customerSnapshot,
        requestId,
      };

      // Persist to sessionStorage for refresh resilience
      try {
        sessionStorage.setItem("lastOrder", JSON.stringify(orderData));
      } catch (e) {
        console.warn("Could not persist order to sessionStorage:", e);
      }

      // Show success screen
      setCompletedOrder(orderData);
      setOrderStatus("success");
      setOrderMessage(data.message || "Pedido creado exitosamente");

      // Scroll to top so user sees the confirmation
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err) {
      // ROLLBACK en error de red
      if (cartSnapshot.length > 0) {
        setCookie("cart", JSON.stringify(cartSnapshot), 30);
        setCartItems(cartSnapshot);
        window.dispatchEvent(new Event("cart-updated"));
      }
      setOrderStatus("error");
      setOrderMessage(err.message || "Error al procesar el pedido");
      console.error("Order creation error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate WhatsApp message using completedOrder (not formValues which may be reset)
  const generateWhatsAppMessage = () => {
    if (!completedOrder) return "";

    const { orderId, total, items, customer } = completedOrder;
    const lines = [
      `*Nuevo pedido de Noir Atelier*`,
      `Pedido #: ${orderId}`,
      `Fecha: ${new Date().toLocaleString()}`,
      "",
      "*Productos:*",
    ];

    items.forEach(({ product, quantity }) => {
      const name = product?.name || "Producto";
      const price = parseFloat(product?.price || 0);
      const currency = product?.currency || "USD";
      lines.push(`- ${name} x${quantity} = ${currency} ${(price * quantity).toFixed(2)}`);
    });

    const totalCurrency = items[0]?.product?.currency || "USD";
    lines.push("");
    lines.push(`*Total: ${totalCurrency} ${parseFloat(total).toFixed(2)}*`);
    lines.push("");
    lines.push(`Datos del cliente:`);
    lines.push(`Nombre: ${customer?.name || ""}`);
    lines.push(`Teléfono: ${customer?.phone || ""}`);
    if (customer?.email) {
      lines.push(`Email: ${customer.email}`);
    }
    if (customer?.notes) {
      lines.push(`Notas: ${customer.notes}`);
    }

    return lines.join("\n");
  };

  // Handle sending via WhatsApp
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

  // Handle "Seguir comprando" - clears the success state
  const handleContinueShopping = () => {
    setCompletedOrder(null);
    setOrderStatus(null);
    setOrderMessage("");
    try {
      sessionStorage.removeItem("lastOrder");
    } catch (e) {
      // ignore
    }
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

  // Success screen takes priority
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
      {cartItems.length === 0 ? (
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
              <h2 className="checkout-section-title">Productos ({totalItems} artículo{totalItems !== 1 ? "s" : ""})</h2>
              <ul className="checkout-items-list">
                {cartItems.map((item) => {
                  const product = products.find(p => p.id === item.productId);
                  if (!product) return null;

                  const stockNum = parseInt(product.stock, 10);
                  const maxStock = Number.isNaN(stockNum) ? undefined : stockNum;

                  return (
                    <li key={item.productId} className="checkout-item-row">
                      <div className="checkout-item-image-wrapper">
                        {product.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={product.image_url} alt={product.name} className="checkout-item-image" loading="lazy" />
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
                          {maxStock !== undefined && maxStock > 0 && maxStock <= 5 && (
                            <span style={{ marginLeft: 8, color: "#c62828", fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase" }}>
                              ¡Solo quedan {maxStock}!
                            </span>
                          )}
                        </p>
                      </div>
                      <span className="checkout-item-qty">× {item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.productId)}
                        className="cart-item-remove"
                        aria-label={`Eliminar ${product.name} del carrito`}
                      >
                        Eliminar
                      </button>
                      <div className="checkout-item-subtotal">
                        {product.currency || "USD"} {(parseFloat(product.price) * item.quantity).toFixed(2)}
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
                    <span className="error" id="error-client_name" role="alert">{formErrors.client_name}</span>
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
                    <span className="error" id="error-client_phone" role="alert">{formErrors.client_phone}</span>
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
                    <span className="error" id="error-client_email" role="alert">{formErrors.client_email}</span>
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

                {formErrors.general && (
                  <div className="error general-error" role="alert">{formErrors.general}</div>
                )}

                {orderStatus === "error" && orderMessage && (
                  <div className="error general-error" role="alert">{orderMessage}</div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="primary-button"
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

          {/* Columna derecha: Resumen sticky */}
          <aside className="checkout-summary-sticky" aria-label="Resumen del pedido">
            <div className="checkout-summary">
              <h2 className="checkout-summary-title">Resumen</h2>
              <ul className="checkout-summary-list">
                {cartItems.map((item) => {
                  const product = products.find(p => p.id === item.productId);
                  if (!product) return null;
                  return (
                    <li key={item.productId} className="checkout-summary-list-item">
                      <span className="checkout-summary-list-name">
                        {product.name}
                        <span className="checkout-summary-list-qty"> × {item.quantity}</span>
                      </span>
                      <span className="checkout-summary-list-price">
                        {product.currency || "USD"} {(parseFloat(product.price) * item.quantity).toFixed(2)}
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
                <strong>{totalCurrency} {totalPrice.toFixed(2)}</strong>
              </div>
              <p className="checkout-summary-footer">
                El pago se realiza vía WhatsApp. Crea el pedido y te contactaremos para coordinar el envío.
              </p>
            </div>
          </aside>
        </>
      )}
    </main>
  );
}