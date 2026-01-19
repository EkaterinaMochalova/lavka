'use client';

import { useEffect, useState } from 'react';

export type CartItem = {
  id: string;
  title: string;
  price: string;
  objectKey: string;
};

const STORAGE_KEY = 'armoury_cart_v1';

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  // загрузка из localStorage
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) setItems(JSON.parse(raw));
  }, []);

  // сохранение
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  function add(item: CartItem) {
    setItems((prev) => {
      if (prev.find((p) => p.id === item.id)) return prev; // антик = 1 штука
      return [...prev, item];
    });
  }

  function remove(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function clear() {
    setItems([]);
  }

  return {
    items,
    add,
    remove,
    clear,
    count: items.length,
  };
}