"use client";

import Link from "next/link";

/**
 * Pantalla de confirmación de pedido profesional (nivel Amazon).
 * Muestra icono de check animado, número de pedido, resumen y CTAs.
 */
export default function OrderSuccess({ order, onWhatsApp, onContinue }) {
  if (!order) return null;

  const { orderId, total, items, customer } = order;

  return (
    <section className="order-success-screen" role="status" aria-live="polite">
      {/* Icono de check animado */}
      <div className="success-check-circle">
        <svg
          className="success-check-svg"
          viewBox="0 0 52 52"
          aria-hidden="true"
        >
          <circle className="success-check-circle-path" cx="26" cy="26" r="25" fill="none" />
          <path className="success-check-mark-path" fill="none" d="M14 27l8 8 16-16" />
        </svg>
      </div>

      <h2 className="success-title">¡Pedido realizado!</h2>
      <p className="success-order-number">
        Número de pedido: <strong>#{orderId}</strong>
      </p>

      {/* Resumen del pedido */}
      <div className="success-summary">
        <h3>Resumen del pedido</h3>
        <ul className="success-items-list">
          {items.map(({ product, quantity }, idx) => (
            <li key={`${product?.id || idx}`} className="success-item">
              <span className="success-item-name">
                {product?.name || "Producto"} ×{quantity}
              </span>
              <span className="success-item-price">
                ${((parseFloat(product?.price || 0)) * quantity).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
        <div className="success-total-row">
          <span>Total</span>
          <strong>${parseFloat(total).toFixed(2)}</strong>
        </div>
      </div>

      {/* Datos del cliente */}
      {customer && (
        <div className="success-customer">
          <h3>Datos de contacto</h3>
          <p><strong>Nombre:</strong> {customer.name}</p>
          <p><strong>Teléfono:</strong> {customer.phone}</p>
          {customer.email && <p><strong>Email:</strong> {customer.email}</p>}
          {customer.notes && <p><strong>Notas:</strong> {customer.notes}</p>}
        </div>
      )}

      {/* CTAs */}
      <div className="success-actions">
        <button
          type="button"
          onClick={onWhatsApp}
          className="whatsapp-button"
          disabled={!process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}
        >
          📱 Enviar pedido por WhatsApp
        </button>
        <Link href="/tienda" className="secondary-button success-continue" onClick={onContinue}>
          Seguir comprando →
        </Link>
      </div>

      <p className="success-note">
        Te contactaremos pronto para confirmar los detalles de tu pedido.
      </p>
    </section>
  );
}