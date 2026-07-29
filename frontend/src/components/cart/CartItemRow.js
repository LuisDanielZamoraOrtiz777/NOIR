"use client";

import QuantityStepper from "./QuantityStepper";

/**
 * CartItemRow — Fila de producto en el carrito.
 *
 * Props:
 *   item:           { productId, quantity }
 *   product:        { id, name, description, price, currency, image_url, stock }
 *   onQuantityChange: (productId, newQuantity) => void
 *   onRemove:         (productId) => void
 *   onSaveForLater:   (productId) => void   (opcional)
 *   compact:          layout más compacto (default false)
 */
export default function CartItemRow({
  item,
  product,
  onQuantityChange,
  onRemove,
  onSaveForLater,
  compact = false,
}) {
  if (!product) return null;

  const subtotal = parseFloat(product.price) * item.quantity;
  const maxStock = product.stock !== undefined ? parseInt(product.stock, 10) : undefined;
  const currency = product.currency || "USD";

  return (
    <article className={`cart-item-row ${compact ? "is-compact" : ""}`}>
      <div className="cart-item-image-wrapper">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.name}
            className="cart-item-image"
            loading="lazy"
          />
        ) : (
          <div className="cart-item-image-placeholder">
            <span>{product.name?.charAt(0).toUpperCase() || "?"}</span>
          </div>
        )}
      </div>

      <div className="cart-item-body">
        <div className="cart-item-header">
          <h3 className="cart-item-name">{product.name}</h3>
          <button
            type="button"
            onClick={() => onRemove(item.productId)}
            className="cart-item-remove"
            aria-label={`Eliminar ${product.name} del carrito`}
          >
            Eliminar
          </button>
        </div>

        {product.description && !compact && (
          <p className="cart-item-description">{product.description}</p>
        )}

        <div className="cart-item-meta">
          <span className="cart-item-unit-price">
            {currency} {parseFloat(product.price).toFixed(2)} c/u
          </span>
          {maxStock !== undefined && maxStock > 0 && maxStock <= 5 && (
            <span className="cart-item-stock-warning">
              ¡Solo quedan {maxStock}!
            </span>
          )}
        </div>

        <div className="cart-item-actions">
          <QuantityStepper
            value={item.quantity}
            onChange={(qty) => onQuantityChange(item.productId, qty)}
            min={1}
            max={maxStock}
            ariaLabel={`Cantidad de ${product.name}`}
          />

          {onSaveForLater && (
            <button
              type="button"
              onClick={() => onSaveForLater(item.productId)}
              className="save-for-later-link"
            >
              Guardar para después
            </button>
          )}
        </div>
      </div>

      <div className="cart-item-subtotal">
        <span className="cart-item-subtotal-amount">
          {currency} {subtotal.toFixed(2)}
        </span>
      </div>
    </article>
  );
}