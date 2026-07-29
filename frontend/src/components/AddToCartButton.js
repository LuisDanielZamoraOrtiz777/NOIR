"use client";

import { useCart } from "@/context/CartContext";

/**
 * AddToCartButton — Botón para añadir producto al carrito.
 *
 * Props:
 *   productId:   string o number — ID del producto
 *   product:     objeto producto completo (para cache en CartContext)
 *   openDrawerOnAdd: si debe abrir el drawer automáticamente tras añadir
 *   label:       texto override del botón
 */
export default function AddToCartButton({
  productId,
  product = null,
  openDrawerOnAdd = false,
  label = null,
}) {
  const { items, addItem, openDrawer, count } = useCart();

  const productIdStr = String(productId);
  const item = items.find((i) => i.productId === productIdStr);
  const quantityInCart = item ? item.quantity : 0;

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Si ya no hay stock, no añadir
    if (product && product.stock !== undefined && parseInt(product.stock, 10) <= 0) {
      return;
    }

    addItem(productIdStr, 1, product);

    if (openDrawerOnAdd) {
      // Pequeño delay para que la animación del drawer sea visible después del add
      setTimeout(() => openDrawer(), 100);
    }
  };

  // Texto del botón
  let buttonText;
  if (label) {
    buttonText = label;
  } else if (quantityInCart > 0) {
    buttonText = `${quantityInCart} en carrito`;
  } else {
    buttonText = "+ Añadir al carrito";
  }

  // Estado deshabilitado si no hay stock
  const isOutOfStock = product && product.stock !== undefined && parseInt(product.stock, 10) <= 0;

  return (
    <button
      type="button"
      className={`add-to-cart-button ${quantityInCart > 0 ? "active" : ""} ${
        isOutOfStock ? "is-disabled" : ""
      }`}
      onClick={handleClick}
      disabled={isOutOfStock}
      aria-label={
        isOutOfStock
          ? "Producto agotado"
          : quantityInCart > 0
          ? `Agregar otra unidad (total: ${quantityInCart})`
          : "Agregar al carrito"
      }
    >
      {isOutOfStock ? "Agotado" : buttonText}
    </button>
  );
}
