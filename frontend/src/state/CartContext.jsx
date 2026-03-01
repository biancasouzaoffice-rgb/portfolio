import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CART_KEY = "ecommerce_cart_v1";

const CartContext = createContext(null);

function readCartStorage() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => readCartStorage());

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  function addItem(product, quantity = 1) {
    const amount = Number.parseInt(quantity, 10);
    if (!Number.isInteger(amount) || amount <= 0) {
      return;
    }

    setItems((current) => {
      const found = current.find((item) => item.productId === product.id);
      if (!found) {
        return [
          ...current,
          {
            productId: product.id,
            name: product.name,
            imageUrl: product.imageUrl,
            price: product.price,
            quantity: Math.min(amount, product.stock),
            stock: product.stock
          }
        ];
      }

      return current.map((item) =>
        item.productId === product.id
          ? {
              ...item,
              quantity: Math.min(item.quantity + amount, item.stock)
            }
          : item
      );
    });
  }

  function updateQuantity(productId, quantity) {
    const amount = Number.parseInt(quantity, 10);
    if (!Number.isInteger(amount)) {
      return;
    }
    setItems((current) =>
      current
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity: Math.max(0, Math.min(amount, item.stock)) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function removeItem(productId) {
    setItems((current) => current.filter((item) => item.productId !== productId));
  }

  function clearCart() {
    setItems([]);
  }

  const value = {
    items,
    subtotal,
    totalItems,
    addItem,
    removeItem,
    updateQuantity,
    clearCart
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart precisa estar dentro de CartProvider.");
  }
  return context;
}
