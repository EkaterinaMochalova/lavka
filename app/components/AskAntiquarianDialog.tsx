'use client';

import React, { useMemo, useState } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
};

type Answers = {
  who?: 'partner' | 'friend' | 'parent' | 'colleague' | 'teen';
  occasion?: 'birthday' | 'anniversary' | 'housewarming' | 'thanks' | 'just';
  budget?: 'lt50' | '50to150' | '150plus';
  vibe?: 'practical' | 'interior' | 'collectible' | 'romantic' | 'weird';
  tone?: 'calm' | 'mysterious';
};

type Recommendation = {
  title: string;
  why: string;
  priceHint: string;
  // Мы даём поисковую ссылку на Etsy (не конкретный лот, чтобы не устаревало)
  etsySearchUrl: string;
  tags: string[];
};

function etsy(q: string) {
  return `https://www.etsy.com/market/${encodeURIComponent(q)}?utm_source=chatgpt.com`;
}

const RECO_SETS: Record<string, Recommendation[]> = {
  A_small_polite: [
    {
      title: 'Латунный нож для писем (letter opener)',
      why: 'Ненавязчиво, “кабинетно”, выглядит дороже, чем стоит.',
      priceHint: 'часто €20–60',
      etsySearchUrl: etsy('brass letter opener vintage'),
      tags: ['кабинет', 'латунь', 'практично'],
    },
    {
      title: 'Мини-принт “небесная карта/астрономия” (digital или бумага)',
      why: 'Быстро дарится, легко оформить в рамку, ощущение “вещи с историей”.',
      priceHint: 'часто €8–35',
      etsySearchUrl: etsy('vintage celestial map print'),
      tags: ['интерьер', 'космос', 'быстро'],
    },
    {
      title: 'Маленькая винтажная книга в переплёте',
      why: 'Тактильный подарок: страницы шуршат, переплёт живёт.',
      priceHint: 'часто €15–50',
      etsySearchUrl: etsy('antique book decorative small'),
      tags: ['книга', 'винтаж', 'уют'],
    },
  ],

  B_housewarming: [
    {
      title: 'Винтажная керамическая ваза',
      why: 'Сразу становится “точкой” в интерьере.',
      priceHint: 'часто €40–140',
      etsySearchUrl: etsy('vintage ceramic vase asian'),
      tags: ['интерьер', 'керамика', 'новоселье'],
    },
    {
      title: 'Небесный глобус/астрономический декор',
      why: 'Вещь-история: хочется разглядывать.',
      priceHint: 'обычно €60–200+',
      etsySearchUrl: etsy('antique celestial globe'),
      tags: ['интерьер', 'коллекционное', 'вау'],
    },
    {
      title: 'Латунный нож для писем',
      why: 'Символ “домашнего кабинета”, полезно и красиво.',
      priceHint: 'часто €20–60',
      etsySearchUrl: etsy('brass letter opener vintage'),
      tags: ['практично', 'кабинет', 'латунь'],
    },
    {
      title: 'Винтажный чайник (керамика/Yixing если повезёт)',
      why: 'Подарок-ритуал: чай, разговоры, вечера.',
      priceHint: 'обычно €60–250',
      etsySearchUrl: etsy('yixing teapot vintage'),
      tags: ['чай', 'ритуал', 'уют'],
    },
  ],

  C_partner_romantic: [
    {
      title: 'Старинная книга в переплёте (поэзия/эссе/письма)',
      why: 'Романтика без открытки: вещь говорит сама.',
      priceHint: 'обычно €50–250',
      etsySearchUrl: etsy('antique book leather bound poetry'),
      tags: ['романтика', 'книга', 'история'],
    },
    {
      title: 'Ваза винтажная “под ветки/сухоцветы”',
      why: 'Работает как декор и как повод дарить цветы потом.',
      priceHint: 'обычно €40–180',
      etsySearchUrl: etsy('vintage vase minimalist'),
      tags: ['интерьер', 'романтика', 'дом'],
    },
    {
      title: 'Небесная карта/астрономический принт',
      why: 'Можно привязать к дате: “наш день под этими звёздами”.',
      priceHint: '€10–80',
      etsySearchUrl: etsy('celestial star map vintage print'),
      tags: ['звёзды', 'смысл', 'в рамку'],
    },
  ],

  D_parent_warm: [
    {
      title: 'Книга в аккуратном переплёте (винтаж)',
      why: 'Для тех, кто любит “настоящие” вещи руками.',
      priceHint: '€25–120',
      etsySearchUrl: etsy('vintage book cloth bound'),
      tags: ['книга', 'уют', 'в дом'],
    },
    {
      title: 'Винтажная керамика (ваза/миска/сосуд)',
      why: 'Практично и красиво, без лишнего пафоса.',
      priceHint: '€30–150',
      etsySearchUrl: etsy('vintage ceramic bowl vase'),
      tags: ['керамика', 'дом', 'тёплый подарок'],
    },
    {
      title: 'Настольный предмет для “кабинета”: нож для писем',
      why: 'Маленькая радость из разряда “почему я раньше без этого жил”.',
      priceHint: '€20–60',
      etsySearchUrl: etsy('vintage letter opener'),
      tags: ['кабинет', 'практично', 'винтаж'],
    },
  ],

  E_collector_weird: [
    {
      title: 'Компас/полевой инструмент (винтаж)',
      why: 'Сразу включает воображение: “а где это было?”',
      priceHint: '€40–220',
      etsySearchUrl: etsy('antique compass brass'),
      tags: ['коллекция', 'приключение', 'металл'],
    },
    {
      title: 'Небесный глобус / армиллярная сфера',
      why: 'Вещь с характером, почти музейная.',
      priceHint: '€80–400+',
      etsySearchUrl: etsy('armillary sphere vintage'),
      tags: ['коллекция', 'интерьер', 'вау'],
    },
    {
      title: 'Старая книга “путешествия/моря/карты”',
      why: 'Сюжет на полке. Даже если не читать.',
      priceHint: '€30–200',
      etsySearchUrl: etsy('antique travel book'),
      tags: ['книга', 'путешествия', 'история'],
    },
    {
      title: 'Миниатюра/портрет в рамке (винтаж)',
      why: 'Чуть-чуть “призрак викторианской гостиной” в хорошем смысле.',
      priceHint: '€40–180',
      etsySearchUrl: etsy('miniature portrait vintage frame'),
      tags: ['странненько', 'интерьер', 'история'],
    },
  ],

  F_boss_cabinet: [
    {
      title: 'Качественный нож для писем (латунь/бронза)',
      why: 'Деловой подарок: простой, но статусный.',
      priceHint: '€30–120',
      etsySearchUrl: etsy('brass letter opener'),
      tags: ['статус', 'кабинет', 'практично'],
    },
    {
      title: 'Антикварная книга в хорошем состоянии',
      why: 'Смотрится солидно, не выглядит “сувениром”.',
      priceHint: '€80–350',
      etsySearchUrl: etsy('antique book leather bound'),
      tags: ['статус', 'книга', 'история'],
    },
    {
      title: 'Глобус/астрономический декор',
      why: 'Классика для кабинета: “человек мира”.',
      priceHint: '€100–500+',
      etsySearchUrl: etsy('vintage globe desk'),
      tags: ['кабинет', 'интерьер', 'вау'],
    },
  ],

  G_teen_inspire: [
    {
      title: 'Принт “карта/звёзды” (в рамку)',
      why: 'Очень “на старт пути”: символично и красиво.',
      priceHint: '€8–70',
      etsySearchUrl: etsy('vintage map print'),
      tags: ['вдохновение', 'интерьер', 'символ'],
    },
    {
      title: 'Компас (винтаж или реплика винтажного)',
      why: 'Прямой смысл: “держи курс”.',
      priceHint: '€20–150',
      etsySearchUrl: etsy('vintage compass'),
      tags: ['символ', 'практично', 'приключение'],
    },
    {
      title: 'Небольшая винтажная книга',
      why: 'Свой маленький “архив”.',
      priceHint: '€15–60',
      etsySearchUrl: etsy('vintage book gift'),
      tags: ['книга', 'вдохновение', 'уют'],
    },
  ],

  H_just_magic: [
    {
      title: 'Винтажная керамика (маленький сосуд/ваза)',
      why: 'Подарок без повода любит такие вещи.',
      priceHint: '€20–120',
      etsySearchUrl: etsy('vintage ceramic small vase'),
      tags: ['уют', 'дом', 'вещь-радость'],
    },
    {
      title: 'Миниатюра в рамке',
      why: 'Почти как “найденная история”.',
      priceHint: '€30–180',
      etsySearchUrl: etsy('miniature portrait frame'),
      tags: ['романтика', 'странненько', 'история'],
    },
    {
      title: 'Нож для писем',
      why: 'Маленькая штука, которая вызывает улыбку каждый раз.',
      priceHint: '€20–60',
      etsySearchUrl: etsy('vintage letter opener'),
      tags: ['практично', 'кабинет', 'винтаж'],
    },
  ],
};

function pickSetKey(a: Answers) {
  // простой, но адекватный “алгоритм”
  if (a.who === 'colleague' && a.budget === 'lt50') return 'A_small_polite';
  if (a.occasion === 'housewarming') return 'B_housewarming';
  if (a.who === 'partner' || a.vibe === 'romantic') return 'C_partner_romantic';
  if (a.who === 'parent') return 'D_parent_warm';
  if (a.vibe === 'collectible' || a.vibe === 'weird') return 'E_collector_weird';
  if (a.who === 'colleague' && (a.budget === '150plus' || a.tone === 'calm')) return 'F_boss_cabinet';
  if (a.who === 'teen') return 'G_teen_inspire';
  return 'H_just_magic';
}

function prettyLabel(a: Answers) {
  const bits: string[] = [];
  if (a.who) bits.push({ partner: 'для партнёра', friend: 'для друга', parent: 'для родителей', colleague: 'для коллеги', teen: 'для подростка' }[a.who]);
  if (a.occasion) bits.push({ birthday: 'на день рождения', anniversary: 'на годовщину', housewarming: 'на новоселье', thanks: 'в благодарность', just: 'просто так' }[a.occasion]);
  if (a.budget) bits.push({ lt50: 'до €50', '50to150': '€50–150', '150plus': '€150+' }[a.budget]);
  return bits.filter(Boolean).join(' • ');
}

export default function AskAntiquarianDialog({ open, onClose }: Props) {
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4 | 5>(0);
  const [answers, setAnswers] = useState<Answers>({});

  const done = step === 5;

  const setAndNext = (patch: Partial<Answers>) => {
    setAnswers((p) => ({ ...p, ...patch }));
    setStep((s) => (s < 5 ? ((s + 1) as any) : s));
  };

  const reset = () => {
    setAnswers({});
    setStep(0);
  };

  const recoKey = useMemo(() => pickSetKey(answers), [answers]);
  const recos = useMemo(() => RECO_SETS[recoKey] ?? [], [recoKey]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(0,0,0,0.6)',
        display: 'grid',
        placeItems: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(780px, 100%)',
          background: 'rgba(17,17,17,0.92)',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 18,
          color: '#fff',
          boxShadow: '0 30px 90px rgba(0,0,0,0.6)',
          overflow: 'hidden',
          backdropFilter: 'blur(10px)',
        }}
      >
        {/* Header */}
        <div style={{ padding: 16, borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 14, opacity: 0.8, letterSpacing: 0.6 }}>Старьёвщик</div>
            <div style={{ fontSize: 20, fontWeight: 800, marginTop: 2 }}>Подберём подарок “с чердака”</div>
            <div style={{ fontSize: 12, opacity: 0.65, marginTop: 6 }}>
              Демо-товары в лавке не трогаем. Это отдельная подборка реальных вещей.
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              height: 36,
              padding: '0 10px',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'transparent',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 16 }}>
          {!done ? (
            <>
              <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 10 }}>
                Вопрос {step + 1} из 6
              </div>

              {step === 0 && (
                <Question
                  title="Кому нужен подарок?"
                  options={[
                    ['partner', 'Партнёр / любимый человек'],
                    ['friend', 'Друг'],
                    ['parent', 'Мама/папа'],
                    ['colleague', 'Коллега / босс'],
                    ['teen', 'Подросток'],
                  ]}
                  onPick={(v) => setAndNext({ who: v as any })}
                />
              )}

              {step === 1 && (
                <Question
                  title="По какому поводу?"
                  options={[
                    ['birthday', 'День рождения'],
                    ['anniversary', 'Годовщина'],
                    ['housewarming', 'Новоселье'],
                    ['thanks', 'Сказать “спасибо”'],
                    ['just', 'Просто так'],
                  ]}
                  onPick={(v) => setAndNext({ occasion: v as any })}
                />
              )}

              {step === 2 && (
                <Question
                  title="Какой бюджет?"
                  options={[
                    ['lt50', 'До €50'],
                    ['50to150', '€50–150'],
                    ['150plus', '€150+'],
                  ]}
                  onPick={(v) => setAndNext({ budget: v as any })}
                />
              )}

              {step === 3 && (
                <Question
                  title="Какой характер подарка?"
                  options={[
                    ['practical', 'Практичный'],
                    ['interior', 'В интерьер'],
                    ['collectible', 'Коллекционный / “с историей”'],
                    ['romantic', 'Романтичный'],
                    ['weird', 'Странненький (и прекрасный)'],
                  ]}
                  onPick={(v) => setAndNext({ vibe: v as any })}
                />
              )}

              {step === 4 && (
                <Question
                  title="Какой тон?"
                  options={[
                    ['calm', 'Спокойно и солидно'],
                    ['mysterious', 'С загадкой'],
                  ]}
                  onPick={(v) => setAndNext({ tone: v as any })}
                />
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}>
                <button
                  onClick={() => setStep((s) => (s > 0 ? ((s - 1) as any) : s))}
                  style={ghostBtn}
                >
                  ← Назад
                </button>
                <button
                  onClick={() => setStep(5)}
                  style={ghostBtn}
                >
                  Пропустить → к подборке
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 14, opacity: 0.75 }}>Итог</div>
                  <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>
                    {prettyLabel(answers) || 'Подборка “с чердака”'}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.65, marginTop: 6 }}>
                    Ниже 3–4 идеи. Это поисковые выдачи на Etsy, потому что конкретные лоты быстро заканчиваются.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={reset} style={ghostBtn}>Пройти заново</button>
                  <button onClick={onClose} style={solidBtn}>Закрыть</button>
                </div>
              </div>

              <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                {recos.slice(0, 4).map((r) => (
                  <div
                    key={r.title}
                    style={{
                      borderRadius: 16,
                      border: '1px solid rgba(255,255,255,0.10)',
                      background: 'rgba(255,255,255,0.04)',
                      padding: 14,
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: 14, lineHeight: 1.25 }}>{r.title}</div>
                    <div style={{ fontSize: 12, opacity: 0.72, marginTop: 6 }}>{r.why}</div>
                    <div style={{ fontSize: 12, opacity: 0.85, marginTop: 10 }}>💰 {r.priceHint}</div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                      {r.tags.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          style={{
                            fontSize: 11,
                            padding: '4px 8px',
                            borderRadius: 999,
                            border: '1px solid rgba(255,255,255,0.12)',
                            opacity: 0.85,
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>

                    <a
                      href={r.etsySearchUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'inline-flex',
                        marginTop: 12,
                        fontSize: 12,
                        fontWeight: 800,
                        color: '#111',
                        background: '#fff',
                        borderRadius: 12,
                        padding: '8px 10px',
                        textDecoration: 'none',
                      }}
                    >
                      Открыть на Etsy →
                    </a>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 14, fontSize: 12, opacity: 0.65 }}>
                Совет старьёвщика: смотри рейтинг продавца, доставку и состояние (vintage часто “с характером”).
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Question({
  title,
  options,
  onPick,
}: {
  title: string;
  options: Array<[string, string]>;
  onPick: (value: string) => void;
}) {
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>{title}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
        {options.map(([v, label]) => (
          <button
            key={v}
            onClick={() => onPick(v)}
            style={{
              textAlign: 'left',
              borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.04)',
              color: '#fff',
              padding: 12,
              cursor: 'pointer',
              transition: 'transform 120ms ease',
              fontWeight: 700,
            }}
            onMouseEnter={(e) => ((e.currentTarget.style.transform = 'translateY(-1px)'))}
            onMouseLeave={(e) => ((e.currentTarget.style.transform = 'translateY(0)'))}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

const ghostBtn: React.CSSProperties = {
  background: 'transparent',
  color: '#fff',
  border: '1px solid rgba(255,255,255,0.18)',
  borderRadius: 12,
  padding: '10px 12px',
  cursor: 'pointer',
  fontWeight: 800,
  fontSize: 12,
};

const solidBtn: React.CSSProperties = {
  background: '#fff',
  color: '#111',
  border: 0,
  borderRadius: 12,
  padding: '10px 12px',
  cursor: 'pointer',
  fontWeight: 900,
  fontSize: 12,
};
