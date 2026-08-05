"use client";

import Link from "next/link";

/**
 * Pantalla de confirmación de cotización profesional (nivel Amazon).
 * Muestra icono de check animado, número de cotización, resumen y CTAs.
 * Todo se presenta en Pesos Mexicanos (MXN).
 */
export default function OrderSuccess({ order, onWhatsApp, onContinue, whatsappEnviado }) {
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

      <h2 className="success-title">¡Cotización creada!</h2>
      <p className="success-order-number">
        Número de cotización: <strong>#{orderId}</strong>
      </p>

      {/* Resumen de la cotización */}
      <div className="success-summary">
        <h3>Resumen de la cotización</h3>
        <ul className="success-items-list">
          {items.map(({ product, quantity }, idx) => {
            return (
              <li key={`${product?.id || idx}`} className="success-item">
                <span className="success-item-name">
                  {product?.name || "Producto"} ×{quantity}
                </span>
                <span className="success-item-price">
                  $ {((parseFloat(product?.price || 0)) * quantity).toFixed(2)} MXN
                </span>
              </li>
            );
          })}
        </ul>
        <div className="success-total-row">
          <span>Total</span>
          <strong>
            $ {parseFloat(total).toFixed(2)} MXN
          </strong>
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
          📱 Enviar cotización por WhatsApp
        </button>
        {whatsappEnviado && (
          <Link href="/tienda" className="secondary-button success-continue" onClick={onContinue}>
            Seguir cotizando →
          </Link>
        )}
      </div>

      <p className="success-note">
        {whatsappEnviado
          ? "¡Listo! Ya puedes seguir cotizando o cerrar esta ventana."
          : "Da clic arriba para enviar tu cotización por WhatsApp y completar el proceso — sin este paso, no llega al negocio."}
      </p>
    </section>
  );
}