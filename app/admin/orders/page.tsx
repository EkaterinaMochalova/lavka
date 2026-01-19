'use client';

import React, { useMemo, useState } from 'react';

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
  status: 'new' | 'confirmed' | 'cancelled';
};

const STORAGE_KEY = 'armoury_orders_v1';

function loadOrders(): OrderDraft[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveOrders(orders: OrderDraft[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderDraft[]>(() => loadOrders());
  const [expandedId, setExpandedId] = useState<string | null>(orders[0]?.id ?? null);

  const stats = useMemo(() => {
    const total = orders.length;
    const byStatus = orders.reduce(
      (acc, o) => {
        acc[o.status] += 1;
        return acc;
      },
      { new: 0, confirmed: 0, cancelled: 0 } as Record<OrderDraft['status'], number>
    );
    return { total, ...byStatus };
  }, [orders]);

  function refresh() {
    const next = loadOrders();
    setOrders(next);
    if (next.length && !expandedId) setExpandedId(next[0].id);
  }

  function updateStatus(id: string, status: OrderDraft['status']) {
    const next = orders.map((o) => (o.id === id ? { ...o, status } : o));
    setOrders(next);
    saveOrders(next);
  }

  function removeOrder(id: string) {
    const next = orders.filter((o) => o.id !== id);
    setOrders(next);
    saveOrders(next);
    if (expandedId === id) setExpandedId(next[0]?.id ?? null);
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
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, lineHeight: 1.2 }}>Админка: заказы</h1>
            <div style={{ marginTop: 6, opacity: 0.75, fontSize: 13 }}>
              Всего: <b>{stats.total}</b> • Новые: <b>{stats.new}</b> • Подтверждено: <b>{stats.confirmed}</b> • Отменено:{' '}
              <b>{stats.cancelled}</b>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
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
                fontWeight: 800,
              }}
            >
              ← В зал
            </a>
            <button
              onClick={refresh}
              style={{
                borderRadius: 12,
                padding: '10px 12px',
                border: '1px solid rgba(255,255,255,0.18)',
                background: 'transparent',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 900,
              }}
            >
              ⟳ Обновить
            </button>
          </div>
        </div>

        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '380px 1fr', gap: 12 }}>
          {/* Left list */}
          <div
            style={{
              borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.06)',
              padding: 12,
              height: 'calc(100vh - 120px)',
              overflow: 'auto',
            }}
          >
            {orders.length === 0 ? (
              <div style={{ padding: 12, opacity: 0.8, lineHeight: 1.5 }}>
                Пока нет заказов. Оформи заказ в /checkout, и он появится здесь.
              </div>
            ) : (
              orders.map((o) => {
                const active = o.id === expandedId;
                return (
                  <button
                    key={o.id}
                    onClick={() => setExpandedId(o.id)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      borderRadius: 14,
                      border: active ? '1px solid rgba(255,255,255,0.25)' : '1px solid rgba(255,255,255,0.10)',
                      background: active ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.15)',
                      padding: 12,
                      color: '#fff',
                      cursor: 'pointer',
                      marginBottom: 10,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
                      <div style={{ fontWeight: 950 }}>{o.customer.name || 'Без имени'}</div>
                      <div style={{ fontSize: 12, opacity: 0.75 }}>{fmtDate(o.createdAt)}</div>
                    </div>
                    <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                      <div style={{ fontSize: 13, opacity: 0.85 }}>€{o.totalEur} • {o.items.length} шт.</div>
                      <div style={{ fontSize: 12, opacity: 0.85 }}>
                        Статус: <b>{o.status}</b>
                      </div>
                    </div>
                    <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas' }}>
                      {o.id}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Right details */}
          <div
            style={{
              borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.06)',
              padding: 16,
              height: 'calc(100vh - 120px)',
              overflow: 'auto',
            }}
          >
            {orders.length === 0 || !expandedId ? (
              <div style={{ opacity: 0.8, lineHeight: 1.5 }}>Выбери заказ слева.</div>
            ) : (
              (() => {
                const o = orders.find((x) => x.id === expandedId)!;
                return (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 950 }}>Заказ {o.id}</div>
                        <div style={{ marginTop: 6, opacity: 0.8 }}>
                          Создан: <b>{fmtDate(o.createdAt)}</b> • Оплата: <b>при получении</b>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => updateStatus(o.id, 'confirmed')}
                          style={{
                            borderRadius: 12,
                            padding: '10px 12px',
                            border: '1px solid rgba(255,255,255,0.18)',
                            background: 'transparent',
                            color: '#fff',
                            cursor: 'pointer',
                            fontWeight: 900,
                          }}
                        >
                          ✅ Confirm
                        </button>
                        <button
                          onClick={() => updateStatus(o.id, 'cancelled')}
                          style={{
                            borderRadius: 12,
                            padding: '10px 12px',
                            border: '1px solid rgba(255,255,255,0.18)',
                            background: 'transparent',
                            color: '#fff',
                            cursor: 'pointer',
                            fontWeight: 900,
                          }}
                        >
                          🛑 Cancel
                        </button>
                        <button
                          onClick={() => updateStatus(o.id, 'new')}
                          style={{
                            borderRadius: 12,
                            padding: '10px 12px',
                            border: '1px solid rgba(255,255,255,0.18)',
                            background: 'transparent',
                            color: '#fff',
                            cursor: 'pointer',
                            fontWeight: 900,
                          }}
                        >
                          ↩︎ To new
                        </button>
                        <button
                          onClick={() => removeOrder(o.id)}
                          style={{
                            borderRadius: 12,
                            padding: '10px 12px',
                            border: '1px solid rgba(255,255,255,0.18)',
                            background: 'rgba(255,80,80,0.12)',
                            color: '#fff',
                            cursor: 'pointer',
                            fontWeight: 900,
                          }}
                        >
                          🗑 Удалить
                        </button>
                      </div>
                    </div>

                    <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div
                        style={{
                          borderRadius: 14,
                          border: '1px solid rgba(255,255,255,0.10)',
                          background: 'rgba(0,0,0,0.25)',
                          padding: 12,
                        }}
                      >
                        <div style={{ fontWeight: 950 }}>Контакты</div>
                        <div style={{ marginTop: 8, opacity: 0.9, lineHeight: 1.5 }}>
                          <div>
                            Имя: <b>{o.customer.name || '—'}</b>
                          </div>
                          <div>
                            Тел: <b>{o.customer.phone || '—'}</b>
                          </div>
                          <div>
                            Email: <b>{o.customer.email || '—'}</b>
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          borderRadius: 14,
                          border: '1px solid rgba(255,255,255,0.10)',
                          background: 'rgba(0,0,0,0.25)',
                          padding: 12,
                        }}
                      >
                        <div style={{ fontWeight: 950 }}>Доставка</div>
                        <div style={{ marginTop: 8, opacity: 0.9, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                          {o.customer.address || '—'}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: 12,
                        borderRadius: 14,
                        border: '1px solid rgba(255,255,255,0.10)',
                        background: 'rgba(0,0,0,0.25)',
                        padding: 12,
                      }}
                    >
                      <div style={{ fontWeight: 950 }}>Комментарий</div>
                      <div style={{ marginTop: 8, opacity: 0.9, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                        {o.customer.comment || '—'}
                      </div>
                    </div>

                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontWeight: 950 }}>Товары</div>
                      <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
                        {o.items.map((it) => (
                          <div
                            key={it.id}
                            style={{
                              borderRadius: 14,
                              border: '1px solid rgba(255,255,255,0.10)',
                              background: 'rgba(0,0,0,0.25)',
                              padding: 12,
                              display: 'flex',
                              justifyContent: 'space-between',
                              gap: 12,
                            }}
                          >
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 950 }}>{it.title}</div>
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

                      <div style={{ marginTop: 12, fontSize: 22, fontWeight: 950 }}>Итого: €{o.totalEur}</div>

                      <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
                        MVP: заказы хранятся в localStorage на этом устройстве/браузере.
                      </div>
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        </div>
      </div>
    </div>
  );
}