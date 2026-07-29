"use client";

import { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from "react";
import { getCookie, setCookie, deleteCookie } from "@/utils/cookies";

/**
 * CartContext — Estado global del carrito con persistencia en cookie.
 *
 * Cookie shape (retrocompatibilidad): cart = JSON.stringify([{productId, quantity}, ...])
 *
 * Estado interno también guarda un cache de productos (image_url, name, currency, price, stock)
 * para no tener que re-fetchear en cada render.
 */

const CART_COOKIE = "cart";
const CART_TTL_DAYS = 30;

// Acciones
const ACTIONS = {
  SET_CART: "SET_CART",
  ADD_ITEM: "ADD_ITEM",
  REMOVE_ITEM: "REMOVE_ITEM",
  UPDATE_QTY: "UPDATE_QTY",
  CLEAR: "CLEAR",
  RESTORE: "RESTORE",
  OPEN_DRAWER: "OPEN_DRAWER",
  CLOSE_DRAWER: "CLOSE_DRAWER",
  SET_PRODUCT_INFO: "SET_PRODUCT_INFO",
};

// Estado inicial
const initialState = {
  items: [], // [{productId, quantity}]
  products: {}, // {productId: {name, price, currency, image_url, stock}}
  isOpen: false,
};

// Reducer
function cartReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_CART: {
      return { ...state, items: action.items || [] };
    }

    case ACTIONS.ADD_ITEM: {
      const { productId, quantity = 1 } = action;
      const existing = state.items.findIndex((i) => i.productId === productId);
      let next;
      if (existing >= 0) {
        next = state.items.map((item, idx) =>
          idx === existing ? { ...item, quantity: item.quantity + quantity } : item
        );
      } else {
        next = [...state.items, { productId, quantity }];
      }
      return { ...state, items: next };
    }

    case ACTIONS.REMOVE_ITEM: {
      return {
        ...state,
        items: state.items.filter((i) => i.productId !== action.productId),
      };
    }

    case ACTIONS.UPDATE_QTY: {
      const { productId, quantity } = action;
      if (quantity <= 0) {
        return { ...state, items: state.items.filter((i) => i.productId !== productId) };
      }
      return {
        ...state,
        items: state.items.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
      };
    }

    case ACTIONS.CLEAR: {
      return { ...state, items: [] };
    }

    case ACTIONS.RESTORE: {
      return { ...state, items: action.items || [] };
    }

    case ACTIONS.OPEN_DRAWER: {
      return { ...state, isOpen: true };
    }

    case ACTIONS.CLOSE_DRAWER: {
      return { ...state, isOpen: false };
    }

    case ACTIONS.SET_PRODUCT_INFO: {
      const { productId, product } = action;
      return {
        ...state,
        products: {
          ...state.products,
          [productId]: { ...state.products[productId], ...product },
        },
      };
    }

    default:
      return state;
  }
}

// Context
const CartContext = createContext(null);

// Provider
export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Hidratar desde cookie al montar
  useEffect(() => {
    const raw = getCookie(CART_COOKIE);
    if (!raw) return;
    try {
      const items = JSON.parse(raw);
      if (Array.isArray(items)) {
        dispatch({ type: ACTIONS.SET_CART, items });
      }
    } catch {
      // cookie corrupta → ignorar
    }
  }, []);

  // Persistir en cookie cuando cambian los items
  useEffect(() => {
    if (state.items.length === 0) {
      deleteCookie(CART_COOKIE);
    } else {
      setCookie(CART_COOKIE, JSON.stringify(state.items), CART_TTL_DAYS);
    }
    // Notificar a listeners externos (compatibilidad con código viejo)
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("cart-updated"));
    }
  }, [state.items]);

  // Acciones expuestas
  const addItem = useCallback((productId, quantity = 1, product = null) => {
    if (product) {
      // Cache product info para evitar re-fetch
      dispatch({ type: ACTIONS.SET_PRODUCT_INFO, productId, product });
    }
    dispatch({ type: ACTIONS.ADD_ITEM, productId, quantity });
  }, []);

  const removeItem = useCallback((productId) => {
    dispatch({ type: ACTIONS.REMOVE_ITEM, productId });
  }, []);

  const updateQuantity = useCallback((productId, quantity) => {
    dispatch({ type: ACTIONS.UPDATE_QTY, productId, quantity });
  }, []);

  const clear = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR });
  }, []);

  // Snapshot para rollback en error de checkout
  const snapshot = useCallback(() => {
    return JSON.parse(JSON.stringify(state.items));
  }, [state.items]);

  const restore = useCallback((items) => {
    dispatch({ type: ACTIONS.RESTORE, items });
  }, []);

  const openDrawer = useCallback(() => {
    dispatch({ type: ACTIONS.OPEN_DRAWER });
  }, []);

  const closeDrawer = useCallback(() => {
    dispatch({ type: ACTIONS.CLOSE_DRAWER });
  }, []);

  // Cache de productos (setear desde fuera cuando se cargan en /api/productos)
  const setProductInfo = useCallback((product) => {
    if (!product || !product.id) return;
    dispatch({
      type: ACTIONS.SET_PRODUCT_INFO,
      productId: product.id,
      product,
    });
  }, []);

  // Cargar info de productos en bulk
  const setProductsInfo = useCallback((products) => {
    if (!Array.isArray(products)) return;
    products.forEach((p) => {
      dispatch({
        type: ACTIONS.SET_PRODUCT_INFO,
        productId: p.id,
        product: p,
      });
    });
  }, []);

  // Calcular count y subtotal
  const count = useMemo(() => {
    return state.items.reduce((sum, item) => sum + item.quantity, 0);
  }, [state.items]);

  const value = useMemo(
    () => ({
      // Estado
      items: state.items,
      isOpen: state.isOpen,
      // Derivados
      count,
      // Acciones
      addItem,
      removeItem,
      updateQuantity,
      clear,
      snapshot,
      restore,
      openDrawer,
      closeDrawer,
      setProductInfo,
      setProductsInfo,
    }),
    [state.items, state.isOpen, count, addItem, removeItem, updateQuantity, clear, snapshot, restore, openDrawer, closeDrawer, setProductInfo, setProductsInfo]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// Hook
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart debe usarse dentro de <CartProvider>");
  }
  return ctx;
}