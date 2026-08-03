"use client";

import { useCart } from "@/context/CartContext";

/**
 * AddToCartButton — Botón para añadir producto al carrito de cotización.
 *
 * Props:
 *   productId:        string o number — ID del producto
 *   product:          objeto producto completo (para cache en CartContext)
 *   openDrawerOnAdd:  si debe abrir el drawer automáticamente tras añadir
 *   label:            texto override del botón
 *
 * Nota: El catálogo de Noir Atelier funciona por COTIZACIÓN (sin stock).
 *       No hay límite de cantidad ni validación de inventario.
 */
export default function AddToCartButton({
  productId,
  product = null,
  openDrawerOnAdd = false,
  label = null,
}) {
  const { items, addItem, openDrawer } = useCart();

  const productIdStr = String(productId);
  const item = items.find((i) => i.productId === productIdStr);
  const quantityInCart = item ? item.quantity : 0;

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

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

  return (
    <button
      type="button"
      className={`add-to-cart-button ${quantityInCart > 0 ? "active" : ""}`}
      onClick={handleClick}
      aria-label={
        quantityInCart > 0
          ? `Agregar otra unidad (total: ${quantityInCart})`
          : "Agregar al carrito"
      }
    >
      {buttonText}
    </button>
  );
}