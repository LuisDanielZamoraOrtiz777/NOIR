"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getCookie, setCookie, deleteCookie } from "@/utils/cookies";
import { useRouter } from "next/navigation";
import AddToCartButton from "@/components/AddToCartButton";
import { validate } from "@/utils/validators";

export default function CartPage() {
  const [cartItems, setCartItems] = useState([]); // Array of { productId, quantity, product: {} }
  const [products, setProducts] = useState([]); // All products from API
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

  const router = useRouter();

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

  // Calculate total items and total price
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => {
    const product = products.find(p => p.id === item.productId);
    if (product) {
      return sum + (parseFloat(product.price) * item.quantity);
    }
    return sum;
  }, 0);

  // Handle quantity change
  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity < 1) {
      // Remove item
      removeFromCart(productId);
      return;
    }

    const cartCookie = getCookie("cart");
    if (!cartCookie) return;

    try {
      let cartList = JSON.parse(cartCookie);
      const index = cartList.findIndex(item => item.productId === productId);
      if (index >= 0) {
        cartList[index].quantity = newQuantity;
        setCookie("cart", JSON.stringify(cartList), 30);
        setCartItems(cartList);
        window.dispatchEvent(new Event("cart-updated"));
      }
    } catch (e) {
      console.error("Error updating cart quantity:", e);
    }
  };

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

      // Check stock (we should also check on the backend, but do a quick check here)
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

    try {
      // Call API to create order
      const response = await fetch("/api/pedidos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          cliente_nombre: formValues.client_name.trim(),
          cliente_telefono: formValues.client_phone.trim(),
          cliente_email: formValues.client_email.trim() || null,
          items: orderItems,
          notas: formValues.notes.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || `Error ${response.status}`);
      }

      // Order created successfully
      setOrderStatus("success");
      setOrderMessage(data.message || "Pedido creado exitosamente");

      // Clear cart
      deleteCookie("cart");
      setCartItems([]);
      setWhatsAppOrderData({
        orderId: data.order_id,
        total: data.total,
        items: orderItems.map(item => ({
          product: products.find(p => p.id === item.product_id),
          quantity: item.quantity,
        })),
      });

      // Reset form (optional)
      setFormValues({
        client_name: "",
        client_phone: "",
        client_email: "",
        notes: "",
      });
    } catch (err) {
      setOrderStatus("error");
      setOrderMessage(err.message || "Error al procesar el pedido");
      console.error("Order creation error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Prepare data for WhatsApp message
  const [whatsAppOrderData, setWhatsAppOrderData] = useState(null);

  // Generate WhatsApp message
  const generateWhatsAppMessage = () => {
    if (!whatsAppOrderData) return "";

    const { orderId, total, items } = whatsAppOrderData;
    const lines = [
      `*Nuevo pedido de Noir Atelier*`,
      `Pedido #: ${orderId}`,
      `Fecha: ${new Date().toLocaleString()}`,
      "",
      "*Productos:*",
    ];

    items.forEach(({ product, quantity }) => {
      lines.push(`- ${product.name} x${quantity} = $${(product.price * quantity).toFixed(2)}`);
    });

    lines.push("");
    lines.push(`*Total: $${total.toFixed(2)}*`);
    lines.push("");
    lines.push(`Datos del cliente:`);
    lines.push(`Nombre: ${formValues.client_name}`);
    lines.push(`Teléfono: ${formValues.client_phone}`);
    if (formValues.client_email) {
      lines.push(`Email: ${formValues.client_email}`);
    }
    if (formValues.notes) {
      lines.push(`Notas: ${formValues.notes}`);
    }

    return lines.join("\n");
  };

  // Handle sending via WhatsApp
  const handleSendWhatsApp = () => {
    if (!whatsAppOrderData) {
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

    // Open in new tab
    window.open(whatsappUrl, "_blank");
  };

  if (loading) {
    return <p>Cargando productos...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <main className="cart-page">
      <h1>Tu carrito</h1>

      {cartItems.length === 0 ? (
        <p>Tu carrito está vacío. <Link href="/tienda">Continuar comprando</Link></p>
      ) : (
        <>
          <section className="cart-items">
            <h2>Productos ({totalItems} artículo{totalItems !== 1 ? "s" : ""})</h2>
            <div className="cart-list">
              {cartItems.map((item) => {
                const product = products.find(p => p.id === item.productId);
                if (!product) return null; // Should not happen if we filtered

                return (
                  <div key={item.productId} className="cart-item">
                    <div className="cart-item-info">
                      <h3>{product.name}</h3>
                      <p>{product.description}</p>
                    </div>
                    <div className="cart-item-controls">
                      <label>
                        Cantidad:
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val) && val >= 1) {
                              handleQuantityChange(item.productId, val);
                            }
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.productId)}
                        className="remove-item"
                        aria-label={`Eliminar ${product.name} del carrito`}
                      >
                        ×
                      </button>
                    </div>
                    <div className="cart-item-price">
                      ${(parseFloat(product.price) * item.quantity).toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="cart-summary">
            <h2>Resumen</h2>
            <p>Total de artículos: {totalItems}</p>
            <p>Total: <strong>${totalPrice.toFixed(2)}</strong></p>
          </section>

          <section className="checkout-form">
            <h2>Datos de envío</h2>
            <form onSubmit={handleSubmit}>
              <div>
                <label htmlFor="client_name">Nombre *</label>
                <input
                  type="text"
                  id="client_name"
                  name="client_name"
                  value={formValues.client_name}
                  onChange={handleChange}
                  required
                />
                {formErrors.client_name && (
                  <span className="error">{formErrors.client_name}</span>
                )}
              </div>

              <div>
                <label htmlFor="client_phone">Teléfono *</label>
                <input
                  type="tel"
                  id="client_phone"
                  name="client_phone"
                  value={formValues.client_phone}
                  onChange={handleChange}
                  required
                />
                {formErrors.client_phone && (
                  <span className="error">{formErrors.client_phone}</span>
                )}
              </div>

              <div>
                <label htmlFor="client_email">Correo electrónico (opcional)</label>
                <input
                  type="email"
                  id="client_email"
                  name="client_email"
                  value={formValues.client_email}
                  onChange={handleChange}
                />
                {formErrors.client_email && (
                  <span className="error">{formErrors.client_email}</span>
                )}
              </div>

              <div>
                <label htmlFor="notes">Notas (opcional)</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formValues.notes}
                  onChange={handleChange}
                  rows={3}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="primary-button"
              >
                {isSubmitting ? "Procesando..." : "Crear pedido"}
              </button>
            </form>
          </section>

          {orderStatus && (
            <div className={`order-status ${orderStatus}`}>
              <p>{orderMessage}</p>
              {orderStatus === "success" && (
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="whatsapp-button"
                  disabled={!process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}
                >
                  Enviar pedido por WhatsApp
                </button>
              )}
            </div>
          )}
        </>
      )}
    </main>
  );
}