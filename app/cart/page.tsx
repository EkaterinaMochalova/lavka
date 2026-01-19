'use client';

import React, { useMemo } from 'react';
import { useCart } from './useCart';

function parseEuroPrice(price: string): number {
  // ожидаем формат типа "€120" или "€ 120"
  const n = Number(String(price).replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export default function CartPage() {
  const cart = useCart();

  const total = useMemo(() => {
    return cart.items.reduce((sum, it) => sum + parseEuroPrice(it.price), 0);
  }, [cart.items]);

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: 18,
        background: 'linear-gradient(180deg, #0b0b0b 0%, #111 60%, #0b0b0b 100%)',
        color: '#fff',
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
      }}
    >
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
          <a
            href="/armoury"
            style={{
              color: '#fff',
              textDecoration: 'none',
              opacity: 0.9,
              border: '1px solid rgba(255,255,255,0.16)',
              borderRadius: 12,
              padding: '10px 12px',
              background: 'rgba(255,255,255,0.06)',
              backdropFilter: 'blur(6px)',
            }}
          >
            ← Назад в зал
          </a>

          <div
            style={{
              padding: '10px 12px',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(0,0,0,0.35)',
              backdropFilter: 'blur(6px)',
              fontSize: 13,
              opacity: 0.9,
            }}
          >
            Способ оплаты: <b>Оплата при получении</b>
          </div>
        </div>

        {/* Title */}
        <div style={{ marginTop: 18 }}>
          <h1 style={{ margin: 0, fontSize: 28, lineHeight: 1.2 }}>Корзина</h1>
          <div style={{ marginTop: 6, opacity: 0.75 }}>
            {cart.count === 0 ? 'Пока пусто. Вернись в зал и выбери артефакт.' : `Товаров: ${cart.count}`}
          </div>
        </div>

        {/* Content */}
        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
          {cart.count === 0 ? (
            <div
              style={{
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.06)',
                padding: 16,
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 700 }}>Корзина пуста</div>
              <p style={{ marginTop: 8, marginBottom: 0, opacity: 0.85, lineHeight: 1.5 }}>
                В зале Armoury кликни по любому артефакту, открой карточку и нажми «В корзину».
              </p>

              <div style={{ marginTop: 14 }}>
                <a
                  href="/armoury"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 12,
                    padding: '12px 14px',
                    background: '#fff',
                    color: '#111',
                    fontWeight: 800,
                    textDecoration: 'none',
                  }}
                >
                  Перейти в зал
                </a>
              </div>
            </div>
          ) : (
            <>
              {/* Items */}
              {cart.items.map((it) => (
                <div
                  key={it.id}
                  style={{
                    borderRadius: 16,
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.06)',
                    padding: 14,
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 14,
                    alignItems: 'flex-start',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.3 }}>{it.title}</div>
                    <div style={{ marginTop: 6, opacity: 0.8, fontSize: 13 }}>
                      Витрина: <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas' }}>{it.objectKey}</span>
                    </div>
                    <div style={{ marginTop: 10, fontSize: 18, fontWeight: 900 }}>{it.price}</div>
                  </div>

                  <button
                    onClick={() => cart.remove(it.id)}
                    style={{
                      borderRadius: 12,
                      padding: '10px 12px',
                      border: '1px solid rgba(255,255,255,0.18)',
                      background: 'transparent',
                      color: '#fff',
                      cursor: 'pointer',
                      fontWeight: 800,
                      whiteSpace: 'nowrap',
                    }}
                    title="Удалить из корзины"
                  >
                    ✕ Удалить
                  </button>
                </div>
              ))}

              {/* Summary */}
              <div
                style={{
                  marginTop: 6,
                  borderRadius: 16,
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(0,0,0,0.35)',
                  padding: 16,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ opacity: 0.8, fontSize: 13 }}>Итого</div>
                  <div style={{ fontSize: 26, fontWeight: 950 }}>€{total}</div>
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => cart.clear()}
                    style={{
                      borderRadius: 12,
                      padding: '12px 14px',
                      border: '1px solid rgba(255,255,255,0.18)',
                      background: 'transparent',
                      color: '#fff',
                      cursor: 'pointer',
                      fontWeight: 900,
                    }}
                  >
                    🧹 Очистить
                  </button>

                  <a
                    href="/checkout"
                    style={{
                      borderRadius: 12,
                      padding: '12px 14px',
                      background: '#fff',
                      color: '#111',
                      textDecoration: 'none',
                      fontWeight: 950,
                    }}
                  >
                    ✅ Оформить заказ
                  </a>
                </div>
              </div>

              <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
                MVP: пока без оплаты онлайн. После оформления мы свяжемся для подтверждения. <b>Оплата при получении.</b>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}