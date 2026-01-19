'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type CartItem = {
  id: string;
  title: string;
  price: string;
  objectKey?: string;
  qty?: number;
};

type CartState = {
  items: CartItem[];
  count: number;
  add: (item: CartItem) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const STORAGE_KEY = 'lavka_cart_v1';

const CartContext = createContext<CartState | null>(null);

function safeParse(json: string | null): CartItem[] {
  if (!json) return [];
  try {
    const data = JSON.parse(json);
    if (!Array.isArray(data)) return [];
    return data.filter(Boolean);
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // читаем localStorage ТОЛЬКО на клиенте (после mount)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = safeParse(window.localStorage.getItem(STORAGE_KEY));
    setItems(saved);
  }, []);

  // синхроним изменения обратно
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const api = useMemo<CartState>(() => {
    const count = items.reduce((acc, it) => acc + (it.qty ?? 1), 0);

    return {
      items,
      count,
      add: (item) => {
        setItems((prev) => {
          const idx = prev.findIndex((p) => p.id === item.id);
          if (idx === -1) return [...prev, { ...item, qty: item.qty ?? 1 }];

          const copy = [...prev];
          const cur = copy[idx];
          copy[idx] = { ...cur, qty: (cur.qty ?? 1) + (item.qty ?? 1) };
          return copy;
        });
      },
      remove: (id) => setItems((prev) => prev.filter((p) => p.id !== id)),
      clear: () => setItems([]),
    };
  }, [items]);

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    // чтобы не падало, если забыли провайдер (лучше так, чем cryptic error на проде)
    return {
      items: [] as CartItem[],
      count: 0,
      add: () => {},
      remove: () => {},
      clear: () => {},
    };
  }
  return ctx;
}