'use client';

import React, { useMemo, useState } from 'react';
import { useCart } from '../cart/useCart';

type OrderDraft = {
  id: string;
  createdAt: string;
  paymentMethod: 'cod';
  customer: {
    name: string;
    phone: string;
    email: string;
    address: string;
    comment: string;
  };
  items: Array<{
    id: string;
    title: string;
    price: string;
    objectKey: string;
  }>;
  totalEur: number;
  status: 'new';
};

function parseEuroPrice(price: string): number {
  const n = Number(String(price).replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function saveOrder(order: OrderDraft) {
  const key = 'armoury_orders_v1';
  const raw = localStorage.getItem(key);
  const prev: OrderDraft[] = raw ? JSON.parse(raw) : [];
  prev.unshift(order);
  localStorage.setItem(key, JSON.stringify(prev));
}

function uid() {
  return `ord_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

export default function CheckoutPage() {
  const cart = useCart();

  const total = useMemo(() => {
    return cart.items.reduce((sum, it) => sum + parseEuroPrice(it.price), 0);
  }, [cart.items]);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState<OrderDraft | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    cart.count > 0 &&
    name.trim().length >= 2 &&
    phone.trim().length >= 6 &&
    address.trim().length >= 6;

  function submit() {
    setError(null);

    if (cart.count === 0) {
      setError('Корзина пуста. Вернитесь в зал и добавьте артефакт.');
      return;
    }
    if (!canSubmit) {
      setError('Пожалуйста, заполните имя, телефон и адрес доставки.');
      return;
    }

    const order: OrderDraft = {
      id: uid(),
      createdAt: new Date().toISOString(),
      paymentMethod: 'cod',
      status: 'new',
      customer: {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        comment: comment.trim(),
      },
      items: cart.items.map((i) => ({
  id: i.id,
  title: i.title,
  price: i.price,
  objectKey: i.objectKey ?? '',
})),
      totalEur: total,
    };

    saveOrder(order);
    cart.clear();
    setSubmitted(order);
  }

  if (submitted) {
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
          <a
            href="/armoury"
            style={{
              display: 'inline-block',
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
              marginTop: 16,
              borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.06)',
              padding: 16,
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 950 }}>✅ Заказ принят</div>
            <div style={{ marginTop: 8, opacity: 0.85, lineHeight: 1.5 }}>
              Мы свяжемся с вами для подтверждения. <b>Оплата при получении.</b>
            </div>

            <div style={{ marginTop: 12, opacity: 0.85 }}>
              Номер заказа:{' '}
              <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas' }}>{submitted.id}</span>
            </div>

            <div style={{ marginTop: 12, fontSize: 18, fontWeight: 900 }}>Итого: €{submitted.totalEur}</div>

            <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <a
                href="/armoury"
                style={{
                  borderRadius: 12,
                  padding: '12px 14px',
                  background: '#fff',
                  color: '#111',
                  textDecoration: 'none',
                  fontWeight: 950,
                }}
              >
                Продолжить осмотр
              </a>
              <a
                href="/cart"
                style={{
                  borderRadius: 12,
                  padding: '12px 14px',
                  border: '1px solid rgba(255,255,255,0.18)',
                  background: 'transparent',
                  color: '#fff',
                  textDecoration: 'none',
                  fontWeight: 900,
                }}
              >
                В корзину
              </a>
            </div>

            <div style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>
              MVP: заказ сохранён локально в браузере (пока без БД).
            </div>
          </div>
        </div>
      </div>
    );
  }

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
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
          <a
            href="/cart"
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
            ← Назад в корзину
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

        <div style={{ marginTop: 18 }}>
          <h1 style={{ margin: 0, fontSize: 28, lineHeight: 1.2 }}>Оформление заказа</h1>
          <div style={{ marginTop: 6, opacity: 0.75 }}>
            {cart.count === 0 ? 'Корзина пуста.' : `Товаров: ${cart.count} • Итого: €${total}`}
          </div>
        </div>

        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
          {/* Items summary */}
          <div
            style={{
              borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.06)',
              padding: 16,
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 900 }}>Ваши артефакты</div>
            <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
              {cart.items.map((it) => (
                <div
                  key={it.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 12,
                    alignItems: 'flex-start',
                    border: '1px solid rgba(255,255,255,0.10)',
                    borderRadius: 14,
                    padding: 12,
                    background: 'rgba(0,0,0,0.25)',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 900 }}>{it.title}</div>
                    <div style={{ marginTop: 6, opacity: 0.75, fontSize: 12 }}>
                      Витрина:{' '}
                      <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas' }}>
                        {it.objectKey}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontWeight: 950 }}>{it.price}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div
            style={{
              borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.06)',
              padding: 16,
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 900 }}>Контактные данные</div>

            <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 13, opacity: 0.85 }}>Имя *</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Например: Екатерина"
                  style={{
                    width: '100%',
                    borderRadius: 12,
                    padding: '12px 12px',
                    border: '1px solid rgba(255,255,255,0.16)',
                    background: 'rgba(0,0,0,0.35)',
                    color: '#fff',
                    outline: 'none',
                  }}
                />
              </label>

              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 13, opacity: 0.85 }}>Телефон *</span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+41 … / +7 …"
                  style={{
                    width: '100%',
                    borderRadius: 12,
                    padding: '12px 12px',
                    border: '1px solid rgba(255,255,255,0.16)',
                    background: 'rgba(0,0,0,0.35)',
                    color: '#fff',
                    outline: 'none',
                  }}
                />
              </label>

              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 13, opacity: 0.85 }}>Email</span>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  style={{
                    width: '100%',
                    borderRadius: 12,
                    padding: '12px 12px',
                    border: '1px solid rgba(255,255,255,0.16)',
                    background: 'rgba(0,0,0,0.35)',
                    color: '#fff',
                    outline: 'none',
                  }}
                />
              </label>

              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 13, opacity: 0.85 }}>Адрес доставки *</span>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Город, улица, дом, квартира, индекс"
                  rows={3}
                  style={{
                    width: '100%',
                    borderRadius: 12,
                    padding: '12px 12px',
                    border: '1px solid rgba(255,255,255,0.16)',
                    background: 'rgba(0,0,0,0.35)',
                    color: '#fff',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </label>

              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 13, opacity: 0.85 }}>Комментарий</span>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Например: домофон не работает, лучше написать в WhatsApp…"
                  rows={3}
                  style={{
                    width: '100%',
                    borderRadius: 12,
                    padding: '12px 12px',
                    border: '1px solid rgba(255,255,255,0.16)',
                    background: 'rgba(0,0,0,0.35)',
                    color: '#fff',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </label>

              {error && (
                <div
                  style={{
                    borderRadius: 12,
                    padding: '10px 12px',
                    background: 'rgba(255, 80, 80, 0.15)',
                    border: '1px solid rgba(255, 80, 80, 0.25)',
                    color: '#fff',
                    fontSize: 13,
                  }}
                >
                  {error}
                </div>
              )}

              <button
                onClick={submit}
                disabled={!canSubmit}
                style={{
                  marginTop: 4,
                  borderRadius: 12,
                  padding: '12px 14px',
                  background: canSubmit ? '#fff' : 'rgba(255,255,255,0.35)',
                  color: '#111',
                  border: 0,
                  cursor: canSubmit ? 'pointer' : 'not-allowed',
                  fontWeight: 950,
                }}
              >
                ✅ Оформить заказ
              </button>

              <div style={{ fontSize: 12, opacity: 0.7, lineHeight: 1.5 }}>
                Нажимая «Оформить заказ», вы отправляете заявку. Мы свяжемся для подтверждения. <b>Оплата при получении.</b>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}