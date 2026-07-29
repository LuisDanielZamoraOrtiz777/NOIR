"use client";

import { useCart } from "@/context/CartContext";

/**
 * AddToCartButton — Botón para añadir producto al carrito.
 *
 * Props:
 *   productId:        string o number — ID del producto
 *   product:          objeto producto completo (para cache en CartContext)
 *   openDrawerOnAdd:  si debe abrir el drawer automáticamente tras añadir
 *   label:            texto override del botón
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

  // Stock numérico (parse defensivo). Stock undefined o null → sin límite.
  const stockNum =
    product && product.stock !== undefined && product.stock !== null
      ? parseInt(product.stock, 10)
      : null;
  const isOutOfStock = stockNum !== null && Number.isFinite(stockNum) && stockNum <= 0;
  const remainingAfterAdd =
    stockNum !== null && Number.isFinite(stockNum) ? stockNum - (quantityInCart + 1) : null;
  const wouldExceedStock =
    stockNum !== null && Number.isFinite(stockNum) && remainingAfterAdd < 0;

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOutOfStock) return;
    if (wouldExceedStock) {
      // No añadir si excede stock
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
  } else if (isOutOfStock) {
    buttonText = "Agotado";
  } else if (wouldExceedStock) {
    buttonText = `Máx. ${stockNum} disp.`;
  } else if (quantityInCart > 0) {
    buttonText = `${quantityInCart} en carrito`;
  } else {
    buttonText = "+ Añadir al carrito";
  }

  const isDisabled = isOutOfStock || wouldExceedStock;

  return (
    <button
      type="button"
      className={`add-to-cart-button ${quantityInCart > 0 ? "active" : ""} ${
        isDisabled ? "is-disabled" : ""
      }`}
      onClick={handleClick}
      disabled={isDisabled}
      aria-label={
        isOutOfStock
          ? "Producto agotado"
          : wouldExceedStock
          ? `Stock máximo alcanzado (${stockNum} disponibles)`
          : quantityInCart > 0
          ? `Agregar otra unidad (total: ${quantityInCart})`
          : "Agregar al carrito"
      }
    >
      {buttonText}
    </button>
  );
}
