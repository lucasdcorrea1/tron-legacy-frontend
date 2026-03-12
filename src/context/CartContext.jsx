import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'cart3d';

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((product, qty = 1) => {
    setItems(prev => {
      const idx = prev.findIndex(i => i.product_id === product.id);
      if (idx >= 0) {
        const updated = [...prev];
        const newQty = Math.min(updated[idx].quantity + qty, updated[idx].stock);
        updated[idx] = { ...updated[idx], quantity: newQty };
        return updated;
      }
      return [...prev, {
        product_id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        image: product.images?.[0] || '',
        quantity: Math.min(qty, product.stock),
        stock: product.stock,
      }];
    });
  }, []);

  const removeItem = useCallback((product_id) => {
    setItems(prev => prev.filter(i => i.product_id !== product_id));
  }, []);

  const updateQuantity = useCallback((product_id, qty) => {
    if (qty <= 0) {
      setItems(prev => prev.filter(i => i.product_id !== product_id));
      return;
    }
    setItems(prev => prev.map(i =>
      i.product_id === product_id
        ? { ...i, quantity: Math.min(qty, i.stock) }
        : i
    ));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const isInCart = useCallback((product_id) => items.some(i => i.product_id === product_id), [items]);

  const getItemQuantity = useCallback((product_id) => {
    const item = items.find(i => i.product_id === product_id);
    return item ? item.quantity : 0;
  }, [items]);

  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  const total = useMemo(() => items.reduce((sum, i) => sum + i.price * i.quantity, 0), [items]);

  const value = useMemo(() => ({
    items, itemCount, total,
    addItem, removeItem, updateQuantity, clearCart,
    isInCart, getItemQuantity,
  }), [items, itemCount, total, addItem, removeItem, updateQuantity, clearCart, isInCart, getItemQuantity]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
