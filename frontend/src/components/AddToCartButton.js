"use client";
import { useState, useEffect } from "react";
import { getCookie, setCookie } from "@/utils/cookies";

export default function AddToCartButton({ productId }) {
  const [quantityInCart, setQuantityInCart] = useState(0);

  useEffect(() => {
    const cart = getCookie("cart");
    if (cart) {
      try {
        const cartList = JSON.parse(cart);
        const item = cartList.find(item => item.productId === productId);
        setQuantityInCart(item ? item.quantity : 0);
      } catch (e) {
        setQuantityInCart(0);
      }
    } else {
      setQuantityInCart(0);
    }
  }, [productId]);

  const addToCart = (event) => {
    event.preventDefault();
    let cart = [];
    const cartCookie = getCookie("cart");
    if (cartCookie) {
      try {
        cart = JSON.parse(cartCookie);
      } catch (e) {
        cart = [];
      }
    }

    // Find if product already in cart
    const existingIndex = cart.findIndex(item => item.productId === productId);
    if (existingIndex >= 0) {
      // Increment quantity
      cart[existingIndex].quantity += 1;
    } else {
      // Add new item
      cart.push({ productId: productId, quantity: 1 });
    }

    setCookie("cart", JSON.stringify(cart), 30); // 30 days expiration
    setQuantityInCart(cart[existingIndex >= 0 ? existingIndex : cart.length - 1].quantity);

    // Dispatch custom event to notify other components (like Cart page)
    window.dispatchEvent(new Event("cart-updated"));
  };

  return (
    <button
      type="button"
      className={`add-to-cart-button ${quantityInCart > 0 ? "active" : ""}`}
      onClick={addToCart}
      aria-label={quantityInCart > 0 ? `Agregar otra unidad al carrito (total: ${quantityInCart})` : "Agregar al carrito"}
    >
      {quantityInCart > 0 ? `${quantityInCart} en carrito` : "+ Añadir al carrito"}
    </button>
  );
}