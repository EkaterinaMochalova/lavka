'use client';

import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useCart } from '../cart/useCart';
import AskAntiquarianDialog from '../components/AskAntiquarianDialog';


const EYE_HEIGHT = 1.8;

type DemoProduct = {
  id: string;
  title: string;
  price: string;
  era: string;
  short: string;
};

const DEMO_PRODUCTS_BY_OBJECT_KEY: Record<string, DemoProduct> = {
  artifact_01: {
    id: 'p01',
    title: 'Чайник для заваривания чая',
    price: '€120',
    era: 'Китай, предположительно XIX век',
    short:
      'Традиционный чайник, выполненный в классической китайской манере. Лаконичная форма и следы времени указывают на предмет повседневного, но осознанного использования. Подобные чайники ценились за способность сохранять вкус и температуру напитка.',
  },
  artifact_02: {
    id: 'p02',
    title: 'Декоративная ваза',
    price: '€180',
    era: 'Восточная Азия, конец XIX — начало XX века',
    short:
      'Керамическая ваза с сдержанным силуэтом, предназначенная как для интерьера, так и для декоративного использования. Небольшие неровности поверхности подчёркивают ручную работу и возраст предмета.',
  },
  artifact_03: {
    id: 'p03',
    title: 'Книга в старинном переплёте',
    price: '€45',
    era: 'Европа, XIX век',
    short:
      'Издание в твёрдом переплёте, сохранившее характерные следы времени: потёртости, изменение цвета бумаги. Подобные книги чаще использовались как рабочие экземпляры, а не парадные тома.',
  },
  artifact_04: {
    id: 'p04',
    title: 'Письменный стол',
    price: '€70',
    era: 'Европа, XIX век',
    short:
      'Небольшой письменный стол, предназначенный для повседневной работы. Простота конструкции и износ поверхностей свидетельствуют о длительном использовании и практическом назначении предмета.',
  },
  artifact_05: {
    id: 'p05',
    title: 'Глобус учебный',
    price: '€25',
    era: 'Европа, конец XIX — начало XX века',
    short:
      'Глобус, использовавшийся в образовательных целях. Географические обозначения отражают представления своего времени и могут отличаться от современных, что делает предмет ценным историческим свидетельством.',
  },

  artifact_06: {
    id: 'p06',
    title: 'Керамический фрагмент (демо)',
    price: '€30',
    era: 'Учебная коллекция',
    short: 'Осколок, который вызывает желание додумать целое.',
  },
  artifact_07: { id: 'p07', title: 'Миниатюра в рамке', price: '€95', era: 'Конец XIX века', short: 'Портрет, который “смотрит” дольше, чем принято.' },
  artifact_08: { id: 'p08', title: 'Компас/полевой инструмент', price: '€110', era: 'Начало XX века', short: 'Вещь, которая любит точность и руки.' },
  artifact_09: { id: 'p09', title: 'Записная книжка экспедиции (демо)', price: '€40', era: 'XX век', short: 'Страницы просят маршрут и карандаш.' },
  artifact_10: { id: 'p10', title: 'Футляр с украшением', price: '€150', era: 'Европа, конец XIX века', short: 'Подарок с “эффектом открытия”.' },
};

const GLB_URL = '/api/armoury-glb';
useGLTF.preload(GLB_URL);


// ---------- Loader overlay (видео) ----------
function VideoLoader() {
  const PHRASES = [
    'Кто-то подходит к двери…',
    'Слышны шаги по камню.',
    'Ключи звякают где-то рядом.',
    'С той стороны шепчутся.',
    'Скрипит лестница.',
    'Тень мелькнула в узком окне.',
    'За дверью задержали дыхание.',
    'Кто-то ищет нужный замок.',
    'Тихий стук в ответ…',
    'Сейчас откроют.',
    'Ещё мгновение.',
    'Пахнет пылью, деревом и временем.',
  ];

  const vref = useRef<HTMLVideoElement | null>(null);

  // текст включаем только после конца видео
  const [afterVideo, setAfterVideo] = useState(false);

  // индекс фразы и “фаза” анимации
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [phase, setPhase] = useState<'in' | 'out'>('in');

  // лёгкое затемнение после видео (по желанию)
  const [fade, setFade] = useState(false);

  // 1) когда видео закончилось — фиксируем на последнем кадре и включаем текст
  const handleEnded = () => {
    const v = vref.current;
    if (v) {
      v.pause();
      // держим последний кадр, чтобы не прыгало
      v.currentTime = Math.max(0, v.duration - 0.03);
    }
    setAfterVideo(true);
    window.setTimeout(() => setFade(true), 250);
  };

  // 2) ротируем фразы только после видео
  useEffect(() => {
    if (!afterVideo) return;

    let outTimer: number | null = null;
    let nextTimer: number | null = null;

    // каждая фраза: fade-in (быстро), держим, fade-out, следующая
    const SHOW_MS = 2200;  // сколько держим фразу
    const OUT_MS = 450;    // когда начинаем fade-out перед сменой
    const GAP_MS = 250;    // пауза между фразами

    setPhase('in');

    outTimer = window.setTimeout(() => {
      setPhase('out');
    }, SHOW_MS - OUT_MS);

    nextTimer = window.setTimeout(() => {
      setPhraseIndex((i) => (i + 1) % PHRASES.length);
      setPhase('in');
    }, SHOW_MS + GAP_MS);

    return () => {
      if (outTimer) window.clearTimeout(outTimer);
      if (nextTimer) window.clearTimeout(nextTimer);
    };
  }, [afterVideo, phraseIndex]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000',
        zIndex: 9999,
        overflow: 'hidden',
      }}
    >
      {/* Видео на весь экран */}
      <video
        ref={vref}
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={handleEnded}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          background: '#000',
        }}
      >
        <source src="/loader/door.mp4" type="video/mp4" />
      </video>

      {/* лёгкое затемнение (включаем только после видео) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(80% 60% at 50% 60%, rgba(0,0,0,0.35), rgba(0,0,0,0.85))',
          opacity: fade ? 1 : 0,
          transition: 'opacity 1200ms ease',
          pointerEvents: 'none',
        }}
      />

      {/* Текст показываем ТОЛЬКО после окончания видео */}
      {afterVideo && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: '16%',
            display: 'flex',
            justifyContent: 'center',
            padding: '0 16px',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              fontFamily:
                'ui-serif, Georgia, "Times New Roman", Times, serif',
              fontSize: 20,
              letterSpacing: 0.6,
              color: 'rgba(255,255,255,0.92)',
              textShadow: '0 10px 30px rgba(0,0,0,0.75)',
              opacity: phase === 'in' ? 1 : 0,
              transform: phase === 'in' ? 'translateY(0px)' : 'translateY(6px)',
              filter: phase === 'in' ? 'blur(0px)' : 'blur(1px)',
              transition: 'opacity 420ms ease, transform 420ms ease, filter 420ms ease',
              maxWidth: 860,
              textAlign: 'center',
              lineHeight: 1.35,
            }}
          >
            {PHRASES[phraseIndex]}
          </div>
        </div>
      )}
    </div>
  );
}

function Modal({
  product,
  objectKey,
  onClose,
  onAddToCart,
}: {
  product: DemoProduct;
  objectKey: string;
  onClose: () => void;
  onAddToCart: (product: DemoProduct, objectKey: string) => void;
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        zIndex: 80,
      }}
    >
      <div
        onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
        style={{
          width: 'min(560px, 100%)',
          background: '#111',
          color: '#fff',
          borderRadius: 16,
          padding: 18,
          boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.2 }}>{product.title}</div>
            <div style={{ marginTop: 6, opacity: 0.85 }}>{product.era}</div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 10,
              padding: '6px 10px',
              cursor: 'pointer',
              height: 34,
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ marginTop: 14, fontSize: 28, fontWeight: 800 }}>{product.price}</div>
        <p style={{ marginTop: 10, opacity: 0.9, lineHeight: 1.5 }}>{product.short}</p>

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button
            onClick={() => onAddToCart(product, objectKey)}
            style={{
              flex: 1,
              background: '#fff',
              color: '#111',
              border: 0,
              borderRadius: 12,
              padding: '12px 14px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            В корзину
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 12,
              padding: '12px 14px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Продолжить осмотр
          </button>
        </div>

        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
          MVP: карточка демо-товара. Фотки и реальный заказ добавим дальше.
        </div>
      </div>
    </div>
  );
}

function LootMarkers({ scene, hoveredKey }: { scene: THREE.Object3D; hoveredKey: string | null }) {
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    if ((group as any).__built) return;
    (group as any).__built = true;

    const texture = new THREE.TextureLoader().load(
      'data:image/svg+xml;utf8,' +
        encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="94" height="94">
            <radialGradient id="g">
              <stop offset="0%" stop-color="white" stop-opacity="1"/>
              <stop offset="60%" stop-color="white" stop-opacity="0.35"/>
              <stop offset="100%" stop-color="white" stop-opacity="0"/>
            </radialGradient>
            <circle cx="32" cy="32" r="26" fill="url(#g)"/>
          </svg>
        `)
    );

    scene.traverse((obj) => {
      if (!obj.name?.startsWith('artifact_')) return;

      const spriteMat = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 0.55,
        depthTest: false,
        depthWrite: false,
      });

      const sprite = new THREE.Sprite(spriteMat);
      sprite.name = `__marker__${obj.name}`;
      sprite.renderOrder = 1000;

      const box = new THREE.Box3().setFromObject(obj);
      const center = new THREE.Vector3();
      const size = new THREE.Vector3();
      box.getCenter(center);
      box.getSize(size);

      sprite.position.copy(center);
      sprite.position.y += Math.max(0.25, size.y * 0.55);

      const s = THREE.MathUtils.clamp(size.length() * 0.1, 0.18, 0.45);
      sprite.scale.set(s, s, s);

      (sprite.userData as any).key = obj.name;
      (sprite.userData as any).baseScale = s;

      group.add(sprite);
    });
  }, [scene]);

  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group) return;

    const t = clock.getElapsedTime();

    group.children.forEach((child) => {
      const spr = child as THREE.Sprite;
      const key = (spr.userData as any).key as string;
      const baseScale = (spr.userData as any).baseScale as number;

      const mat = spr.material as THREE.SpriteMaterial;

      const isHover = key === hoveredKey;
      const baseOpacity = isHover ? 0.95 : 0.55;
      mat.opacity = THREE.MathUtils.clamp(baseOpacity + 0.08 * Math.sin(t * 3), 0, 1);

      const bump = isHover ? 1.25 : 1.0;
      const breathe = 1.0 + 0.06 * Math.sin(t * 3 + 1.7);
      spr.scale.setScalar(baseScale * bump * breathe);
    });
  });

  return <group ref={groupRef} />;
}

function ArmouryScene({
  onPick,
  onHover,
  hoveredKey,
  onBounds,
  onWalkMesh,
  onReady,
}: {
  onPick: (objectKey: string) => void;
  onHover: (objectKey: string | null) => void;
  hoveredKey: string | null;
  onBounds: (b: THREE.Box3) => void;
  onWalkMesh: (m: THREE.Object3D | null) => void;
  onReady: () => void;
}) {
  const { scene } = useGLTF(GLB_URL);
  const { camera } = useThree();

  // сигналим, что glb реально уже в руках (сработает 1 раз)
  const didSignal = useRef(false);
useEffect(() => {
  if (didSignal.current) return;
  // “прогрев” 1-2 кадра, чтобы не было резкого мигания после двери
  didSignal.current = true;
  const t = window.setTimeout(() => onReady(), 250);
  return () => window.clearTimeout(t);
}, [scene, onReady]);

  // 0) walkmesh (невидимый), ограничение “по полу”
  useEffect(() => {
    const wm = scene.getObjectByName('walkmesh');
    if (wm) {
      wm.visible = false;
      onWalkMesh(wm);
    } else {
      onWalkMesh(null);
    }
  }, [scene, onWalkMesh]);

  // 1) bounds как страховка
  useEffect(() => {
    const box = new THREE.Box3().setFromObject(scene);
    box.min.x += 0.3;
    box.min.z += 0.3;
    box.max.x -= 0.3;
    box.max.z -= 0.3;
    onBounds(box);
  }, [scene, onBounds]);

  // 2) spawn камеры из empty player_spawn
  const didSpawnRef = useRef(false);
  useEffect(() => {
    if (didSpawnRef.current) return;

    camera.rotation.order = 'YXZ';
    camera.rotation.z = 0;

    const spawn = scene.getObjectByName('player_spawn');
    if (spawn) {
      const p = new THREE.Vector3();
      spawn.getWorldPosition(p);

      camera.position.set(p.x, EYE_HEIGHT, p.z);

      const q = spawn.getWorldQuaternion(new THREE.Quaternion());
      const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(q);
      camera.lookAt(new THREE.Vector3(p.x, EYE_HEIGHT, p.z).add(dir));
    }

    didSpawnRef.current = true;
  }, [scene, camera]);

  // 3) подсветка “оболочкой”
  const glowByKeyRef = useRef<Map<string, THREE.Mesh[]>>(new Map());
  useEffect(() => {
    const map = new Map<string, THREE.Mesh[]>();

    scene.traverse((obj) => {
      if (!obj.name?.startsWith('artifact_')) return;

      const root = obj as THREE.Object3D;
      const glows: THREE.Mesh[] = [];

      root.traverse((child) => {
        const anyChild: any = child;
        if (!anyChild.isMesh) return;
        if (anyChild.name?.startsWith('__glow__')) return;
        if ((anyChild.userData as any)?.__isGlow) return;

        const src = child as THREE.Mesh;

        if ((src.userData as any).__hasGlow) {
          src.children.forEach((c) => {
            const ac: any = c;
            if (ac?.isMesh && (ac.userData as any)?.__isGlow) glows.push(c as THREE.Mesh);
          });
          return;
        }
        (src.userData as any).__hasGlow = true;

        const glowMat = new THREE.MeshBasicMaterial({
          color: 0xffd36a,
          transparent: true,
          opacity: 0.12,
          depthTest: false,
          depthWrite: false,
        });

        const glow = new THREE.Mesh(src.geometry, glowMat);
        (glow.userData as any).__isGlow = true;
        glow.name = `__glow__${src.name}`;
        glow.renderOrder = 999;
        glow.frustumCulled = false;

        glow.position.set(0, 0, 0);
        glow.quaternion.identity();
        glow.scale.set(1.02, 1.02, 1.02);

        src.add(glow);
        glows.push(glow);
      });

      map.set(root.name, glows);
    });

    glowByKeyRef.current = map;
  }, [scene]);

  // базовая + hover
  useEffect(() => {
    const base = 0.18;
    const hover = 0.6;

    for (const [key, glows] of glowByKeyRef.current.entries()) {
      const target = key === hoveredKey ? hover : base;
      for (const g of glows) {
        const m = g.material as THREE.MeshBasicMaterial;
        m.opacity = target;
      }
    }
  }, [hoveredKey]);

  // пульсация наведенного
  useFrame(({ clock }) => {
    if (!hoveredKey) return;
    const glows = glowByKeyRef.current.get(hoveredKey);
    if (!glows) return;

    const t = clock.getElapsedTime();
    const pulse = 0.6 + 0.18 * Math.sin(t * 6);

    for (const g of glows) {
      const m = g.material as THREE.MeshBasicMaterial;
      m.opacity = pulse;
    }
  });

  return (
    <group>
      <primitive
  object={scene}
  onPointerMove={(e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const hit = e.intersections?.[0]?.object;

    let cur: any = hit;
    let key: string | null = null;

    for (let i = 0; i < 10 && cur; i++) {
      if (typeof cur.name === 'string' && cur.name.startsWith('artifact_')) {
        key = cur.name;
        break;
      }
      cur = cur.parent;
    }

    onHover(key);
    document.body.style.cursor = key ? 'pointer' : 'default';
  }}
  onPointerOut={(_e: ThreeEvent<PointerEvent>) => {
    onHover(null);
    document.body.style.cursor = 'default';
  }}
  onClick={(e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const hit = e.intersections?.[0]?.object;

    let cur: any = hit;
    let key: string | null = null;

    for (let i = 0; i < 10 && cur; i++) {
      if (typeof cur.name === 'string' && cur.name.startsWith('artifact_')) {
        key = cur.name;
        break;
      }
      cur = cur.parent;
    }

    if (key && DEMO_PRODUCTS_BY_OBJECT_KEY[key]) onPick(key);
  }}
/>
      <LootMarkers scene={scene} hoveredKey={hoveredKey} />
    </group>
  );
}

function WalkAndLookControls({
  enabled,
  bounds,
  walkMesh,
}: {
  enabled: boolean;
  bounds: THREE.Box3 | null;
  walkMesh: THREE.Object3D | null;
}) {
  const { camera } = useThree();

  // WASD = ходьба
  const move = useRef({ f: false, b: false, l: false, r: false });
  // Стрелки = поворот/наклон
  const turn = useRef({ left: false, right: false, up: false, down: false });

  const speed = 3;
  const yawSpeed = 1.8;
  const pitchSpeed = 1.2;

  // walkmesh проверка
  const raycaster = useRef(new THREE.Raycaster());
  const downVec = useRef(new THREE.Vector3(0, -1, 0));
  const tmpFrom = useRef(new THREE.Vector3());
  const prevPos = useRef(new THREE.Vector3());

  // head-bob
  const bobT = useRef(0);
  const bobAmount = useRef(0);
  const baseY = useRef(EYE_HEIGHT);

  // шаги (звук)
  const stepAudios = useRef<HTMLAudioElement[]>([]);
  const stepIndex = useRef(0);
  const stepCooldown = useRef(0);
  const audioUnlocked = useRef(false);

  // чтобы не стучать шагами, если движение откатили
  const lastXZ = useRef(new THREE.Vector2(camera.position.x, camera.position.z));

  // 1) загрузка звуков (один раз)
  useEffect(() => {
    if (stepAudios.current.length !== 0) return;

    const files = ['/sfx/footstep1.mp3', '/sfx/footstep2.mp3', '/sfx/footstep3.mp3', '/sfx/footstep4.mp3'];

    stepAudios.current = files.map((src) => {
      const a = new Audio(src);
      a.preload = 'auto';
      a.volume = 0.22;
      return a;
    });
  }, []);

  // 2) разлочка аудио по первому взаимодействию
  useEffect(() => {
    const unlock = async () => {
      if (audioUnlocked.current) return;

      const a = stepAudios.current[0];
      if (!a) {
        audioUnlocked.current = true;
        return;
      }

      try {
        a.muted = true;
        a.currentTime = 0;
        await a.play();
        a.pause();
        a.muted = false;
        audioUnlocked.current = true;
      } catch {
        // браузер может упереться; попробуем снова на следующем pointerdown
      }
    };

    window.addEventListener('pointerdown', unlock, { passive: true });
    return () => window.removeEventListener('pointerdown', unlock);
  }, []);

  // 3) клавиши
  useEffect(() => {
    camera.rotation.order = 'YXZ';
    camera.rotation.z = 0;

    const onKey = (e: KeyboardEvent, isDown: boolean) => {
      switch (e.code) {
        case 'KeyW':
          move.current.f = isDown;
          break;
        case 'KeyS':
          move.current.b = isDown;
          break;
        case 'KeyA':
          move.current.l = isDown;
          break;
        case 'KeyD':
          move.current.r = isDown;
          break;

        case 'ArrowLeft':
          turn.current.left = isDown;
          break;
        case 'ArrowRight':
          turn.current.right = isDown;
          break;
        case 'ArrowUp':
          turn.current.up = isDown;
          break;
        case 'ArrowDown':
          turn.current.down = isDown;
          break;
      }
    };

    const down = (e: KeyboardEvent) => onKey(e, true);
    const up = (e: KeyboardEvent) => onKey(e, false);

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);

    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [camera]);

  useFrame((_, delta) => {
    baseY.current = EYE_HEIGHT;

    if (!enabled) {
      bobAmount.current = THREE.MathUtils.damp(bobAmount.current, 0, 10, delta);
      camera.position.y = baseY.current;
      camera.rotation.z = 0;
      stepCooldown.current = 0;
      return;
    }

    // 1) поворот/наклон (стрелки)
    const yawDir = (turn.current.right ? 1 : 0) - (turn.current.left ? 1 : 0);
    const pitchDir = (turn.current.down ? 1 : 0) - (turn.current.up ? 1 : 0);

    if (yawDir !== 0) camera.rotation.y -= yawDir * yawSpeed * delta;
    if (pitchDir !== 0) camera.rotation.x -= pitchDir * pitchSpeed * delta;

    const maxPitch = Math.PI / 2 - 0.15;
    camera.rotation.x = Math.max(-maxPitch, Math.min(maxPitch, camera.rotation.x));

    // 2) ходьба (WASD)
    prevPos.current.copy(camera.position);

    const dir = new THREE.Vector3();
    if (move.current.f) dir.z -= 1;
    if (move.current.b) dir.z += 1;
    if (move.current.l) dir.x -= 1;
    if (move.current.r) dir.x += 1;

    const wantsMove = dir.lengthSq() > 0;

    if (wantsMove) {
      dir.normalize();
      dir.applyEuler(camera.rotation);
      dir.y = 0;
      if (dir.lengthSq() > 0) dir.normalize();

      camera.position.addScaledVector(dir, speed * delta);
    }

    camera.position.y = baseY.current;

    // box-границы
    if (bounds) {
      camera.position.x = THREE.MathUtils.clamp(camera.position.x, bounds.min.x, bounds.max.x);
      camera.position.z = THREE.MathUtils.clamp(camera.position.z, bounds.min.z, bounds.max.z);
    }

    // walkmesh: если вышли с пола, откат
    if (walkMesh && wantsMove) {
      tmpFrom.current.set(camera.position.x, baseY.current + 2.0, camera.position.z);
      raycaster.current.set(tmpFrom.current, downVec.current);

      const hits = raycaster.current.intersectObject(walkMesh, true);
      if (hits.length === 0) {
        camera.position.copy(prevPos.current);
        camera.position.y = baseY.current;
      }
    }

    // 3) реально двигаемся (после всех клампов/откатов)
    const curXZ = new THREE.Vector2(camera.position.x, camera.position.z);
    const movedDist = curXZ.distanceTo(lastXZ.current);
    lastXZ.current.copy(curXZ);

    const moving = movedDist > 0.0005;

    // 4) head-bob
    const target = moving ? 1 : 0;
    bobAmount.current = THREE.MathUtils.damp(bobAmount.current, target, 10, delta);

    if (bobAmount.current > 0.001) {
      bobT.current += delta * 7.5;
    }

    const t = bobT.current;
    const bobY = Math.sin(t * 2) * 0.035 * bobAmount.current;
    const roll = Math.sin(t) * 0.010 * bobAmount.current;
    const nod = Math.sin(t * 2 + 0.7) * 0.006 * bobAmount.current;

    camera.position.y = baseY.current + bobY;
    camera.rotation.z = roll;
    camera.rotation.x = THREE.MathUtils.clamp(camera.rotation.x + nod, -maxPitch, maxPitch);

    // 5) шаги со звуком
    stepCooldown.current = Math.max(0, stepCooldown.current - delta);

    if (moving) {
      if (stepCooldown.current === 0 && audioUnlocked.current && stepAudios.current.length) {
        const a = stepAudios.current[stepIndex.current % stepAudios.current.length];
        stepIndex.current += 1;

        a.currentTime = 0;
        a.play().catch(() => {});
        stepCooldown.current = 0.38;
      }
    } else {
      stepCooldown.current = 0;
    }
  });

  return null;
}

type AtticItem = {
  id: string;
  title: string;
  price: string;
  tag: string; // чтобы подбирать
  blurb: string;
  image: string; // можно потом заменить на реальные файлы
};

const ATTIC_ITEMS: AtticItem[] = [
  {
    id: 'attic_01',
    title: 'Медальон с пустым портретом',
    price: '€34',
    tag: 'romance',
    blurb:
      'Внутри нет лица. Только тонкий след от старой вставки, как будто кто-то хотел забыть аккуратно. Подходит тем, кто любит истории без финала.',
    image: '/attic/medallion.jpg',
  },
  {
    id: 'attic_02',
    title: 'Карманные часы “Тихий полдень”',
    price: '€79',
    tag: 'classic',
    blurb:
      'Стрелки ходят честно, но секундная будто сомневается. На крышке микроцарапина, похожая на карту маленького города.',
    image: '/attic/watch.jpg',
  },
  {
    id: 'attic_03',
    title: 'Письмо без адреса (в конверте)',
    price: '€18',
    tag: 'story',
    blurb:
      'Не распечатано. Воск цел, но тёплый, как будто его держали в ладони. Хорошо дарить человеку, который любит загадки и бережёт паузы.',
    image: '/attic/letter.jpg',
  },
  {
    id: 'attic_04',
    title: 'Флакон “Аптекарский сумрак”',
    price: '€26',
    tag: 'mystic',
    blurb:
      'Синий стеклянный пузырёк. Ничего внутри, кроме воздуха… но воздух иногда тоже товар.',
    image: '/attic/bottle.jpg',
  },
  {
    id: 'attic_05',
    title: 'Ключ без замка',
    price: '€22',
    tag: 'mystic',
    blurb:
      'Железо темнеет, зубцы стерты временем. Отличный подарок тем, кто “вечно ищет своё”.',
    image: '/attic/key.jpg',
  },
  {
    id: 'attic_06',
    title: 'Записная книжка путешественника',
    price: '€41',
    tag: 'practical',
    blurb:
      'Чистая, но пахнет дымком и кожей. Первая страница будто просит маршрут и ошибку.',
    image: '/attic/notebook.jpg',
  },
  {
    id: 'attic_07',
    title: 'Брошь “Скромное солнце”',
    price: '€52',
    tag: 'celebrate',
    blurb:
      'Небольшая, не кричит. Ловит свет и отдаёт его обратно, как хороший человек.',
    image: '/attic/brooch.jpg',
  },
  {
    id: 'attic_08',
    title: 'Чёрная свеча (ручная)',
    price: '€12',
    tag: 'mystic',
    blurb:
      'Горит ровно и долго. Тень от неё выглядит убедительно. Для вечеров, когда хочется сделать тишину красивой.',
    image: '/attic/candle.jpg',
  },
  {
    id: 'attic_09',
    title: 'Мини-глобус “Старые границы”',
    price: '€58',
    tag: 'classic',
    blurb:
      'Некоторые названия уже не встретишь на современных картах. Хороший подарок тем, кто любит “как было раньше” и умеет спорить мягко.',
    image: '/attic/globe.jpg',
  },
  {
    id: 'attic_10',
    title: 'Футляр с зеркальцем',
    price: '€29',
    tag: 'romance',
    blurb:
      'Крошечное зеркало, которое не льстит. Нужная вещь для людей, которые любят правду, но не грубость.',
    image: '/attic/mirror.jpg',
  },
];

type AtticAnswers = {
  who?: 'partner' | 'friend' | 'parent' | 'colleague' | 'self';
  occasion?: 'birthday' | 'anniversary' | 'thanks' | 'house' | 'just';
  vibe?: 'mystic' | 'classic' | 'romance' | 'story' | 'practical';
  budget?: 'low' | 'mid' | 'high';
  twist?: 'tiny' | 'useful' | 'weird' | 'heart';
};

function pickAttic(items: AtticItem[], a: AtticAnswers): AtticItem[] {
  const budgetOk = (price: string) => {
    const n = Number(price.replace(/[^\d]/g, '')) || 0;
    if (a.budget === 'low') return n <= 25;
    if (a.budget === 'mid') return n > 25 && n <= 60;
    if (a.budget === 'high') return n > 60;
    return true;
  };

  const score = (it: AtticItem) => {
    let s = 0;
    if (a.vibe && it.tag === a.vibe) s += 4;
    if (budgetOk(it.price)) s += 3;

    // лёгкие “переклички” шагов, чтобы казалось умнее, чем оно есть 😄
    if (a.occasion === 'thanks' && (it.tag === 'practical' || it.tag === 'classic')) s += 2;
    if (a.occasion === 'anniversary' && (it.tag === 'romance' || it.tag === 'story')) s += 2;
    if (a.who === 'colleague' && it.tag === 'classic') s += 2;
    if (a.who === 'parent' && (it.tag === 'classic' || it.tag === 'practical')) s += 2;
    if (a.who === 'friend' && (it.tag === 'story' || it.tag === 'mystic')) s += 1;

    if (a.twist === 'useful' && it.tag === 'practical') s += 2;
    if (a.twist === 'weird' && it.tag === 'mystic') s += 2;
    if (a.twist === 'heart' && (it.tag === 'romance' || it.tag === 'story')) s += 2;
    if (a.twist === 'tiny' && (Number(it.price.replace(/[^\d]/g, '')) || 0) <= 30) s += 1;

    return s;
  };

  return [...items]
    .map((it) => ({ it, s: score(it) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, 4)
    .map((x) => x.it);
}

function AtticDialog({
  onClose,
  onAddToCart,
}: {
  onClose: () => void;
  onAddToCart: (item: AtticItem) => void;
}) {
  const [step, setStep] = React.useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [answers, setAnswers] = React.useState<AtticAnswers>({});
  const [choicesVisible, setChoicesVisible] = React.useState(false);

  // мягко: текст появляется, потом варианты (как “пауза” в Disco)
  React.useEffect(() => {
    setChoicesVisible(false);
    const t = window.setTimeout(() => setChoicesVisible(true), 420);
    return () => window.clearTimeout(t);
  }, [step]);

  const prompt = (() => {
    switch (step) {
      case 1:
        return 'Кому подарок? Не бойся: я никому не скажу.';
      case 2:
        return 'Повод. Слова иногда важнее коробки.';
      case 3:
        return 'Какое настроение ищем?';
      case 4:
        return 'Бюджет. Я умею быть деликатным с цифрами.';
      case 5:
        return 'И последнее: какой “тюк” добавить?';
      case 6:
        return 'Нашёл на чердаке несколько вещей. Некоторые… нашли тебя раньше, чем ты их.';
    }
  })();

  const options = (() => {
    if (step === 1)
      return [
        { k: 'partner', t: 'Партнёру' },
        { k: 'friend', t: 'Другу/подруге' },
        { k: 'parent', t: 'Родителю' },
        { k: 'colleague', t: 'Коллеге' },
        { k: 'self', t: 'Себе (да!)' },
      ] as const;

    if (step === 2)
      return [
        { k: 'birthday', t: 'День рождения' },
        { k: 'anniversary', t: 'Годовщина' },
        { k: 'thanks', t: '“Спасибо”' },
        { k: 'house', t: 'Новоселье' },
        { k: 'just', t: 'Просто так' },
      ] as const;

    if (step === 3)
      return [
        { k: 'mystic', t: 'Мистично и странно' },
        { k: 'classic', t: 'Классика и статус' },
        { k: 'romance', t: 'Тепло и нежно' },
        { k: 'story', t: 'С историей и загадкой' },
        { k: 'practical', t: 'Полезно и красиво' },
      ] as const;

    if (step === 4)
      return [
        { k: 'low', t: 'До €25' },
        { k: 'mid', t: '€25–€60' },
        { k: 'high', t: '€60+' },
      ] as const;

    if (step === 5)
      return [
        { k: 'tiny', t: 'Небольшое и милое' },
        { k: 'useful', t: 'Чтобы пользовались' },
        { k: 'weird', t: 'Странненькое' },
        { k: 'heart', t: 'Чтобы в сердце' },
      ] as const;

    return [] as const;
  })();

  const recs = step === 6 ? pickAttic(ATTIC_ITEMS, answers) : [];

  const choose = (k: any) => {
    if (step === 1) setAnswers((a) => ({ ...a, who: k }));
    if (step === 2) setAnswers((a) => ({ ...a, occasion: k }));
    if (step === 3) setAnswers((a) => ({ ...a, vibe: k }));
    if (step === 4) setAnswers((a) => ({ ...a, budget: k }));
    if (step === 5) setAnswers((a) => ({ ...a, twist: k }));

    if (step < 5) setStep((step + 1) as any);
    else setStep(6);
  };

  const restart = () => {
    setAnswers({});
    setStep(1);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 120,
        pointerEvents: 'auto',
      }}
    >
      {/* затемнение */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(6px)',
        }}
      />

      {/* панель диалога */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          padding: '18px 18px 16px',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <div
          style={{
            width: 'min(980px, 96vw)',
            borderRadius: 22,
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'linear-gradient(180deg, rgba(10,10,10,0.92), rgba(0,0,0,0.88))',
            boxShadow: '0 30px 90px rgba(0,0,0,0.65)',
            overflow: 'hidden',
          }}
        >
          {/* верхняя полоска */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 14px',
              borderBottom: '1px solid rgba(255,255,255,0.10)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  display: 'grid',
                  placeItems: 'center',
                }}
                aria-hidden
              >
                🧥
              </div>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.92)', fontWeight: 800, letterSpacing: 0.2, fontSize: 13 }}>
                  Старьёвщик
                </div>
                <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>
                  “Чердак отвечает, но не обещает”
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                color: 'rgba(255,255,255,0.9)',
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: 12,
                padding: '8px 10px',
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              ✕
            </button>
          </div>

          {/* тело */}
          <div style={{ padding: '14px 14px 16px' }}>
            <div
              className="atticText"
              style={{
                color: 'rgba(255,255,255,0.92)',
                fontSize: 18,
                lineHeight: 1.35,
                letterSpacing: 0.15,
              }}
            >
              {prompt}
              <span className="cursor" aria-hidden />
            </div>

            {/* варианты */}
            {step !== 6 && (
              <div
                style={{
                  marginTop: 14,
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 10,
                  opacity: choicesVisible ? 1 : 0,
                  transition: 'opacity 220ms ease',
                }}
              >
                {options.map((o, idx) => (
                  <button
                    key={o.k}
                    className="atticChoice"
                    onClick={() => choose(o.k)}
                    style={{ animationDelay: `${idx * 70}ms` }}
                  >
                    {o.t}
                  </button>
                ))}
              </div>
            )}

            {/* рекомендации */}
            {step === 6 && (
              <div style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {recs.map((it, idx) => (
                    <div
                      key={it.id}
                      className="atticCard"
                      style={{ animationDelay: `${idx * 90}ms` }}
                    >
                      <div
                        style={{
                          width: 92,
                          height: 92,
                          borderRadius: 16,
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.10)',
                          overflow: 'hidden',
                          flex: '0 0 auto',
                          display: 'grid',
                          placeItems: 'center',
                          position: 'relative',
                        }}
                        title="Картинку можно заменить на реальную"
                      >
                        {/* Плейсхолдер. Если добавишь реальные картинки в /public/attic/* — просто заработает. */}
                        <img
                          src={it.image}
                          alt={it.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'grid',
                            placeItems: 'center',
                            color: 'rgba(255,255,255,0.55)',
                            fontSize: 12,
                            padding: 10,
                            textAlign: 'center',
                          }}
                        >
                          {/* видно только если img не загрузился */}
                          <span style={{ opacity: 0.8 }}>из чердачной полки</span>
                        </div>
                      </div>

                      <div style={{ flex: 1, minWidth: 220 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
                          <div style={{ fontWeight: 900, color: 'rgba(255,255,255,0.92)', fontSize: 15 }}>
                            {it.title}
                          </div>
                          <div style={{ fontWeight: 900, color: 'rgba(255,255,255,0.88)' }}>{it.price}</div>
                        </div>
                        <div style={{ marginTop: 6, color: 'rgba(255,255,255,0.72)', lineHeight: 1.35, fontSize: 13 }}>
                          {it.blurb}
                        </div>

                        <div style={{ marginTop: 10, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          <button className="atticPrimary" onClick={() => onAddToCart(it)}>
                            Взять эту вещь
                          </button>
                          <button className="atticGhost" onClick={restart}>
                            Спросить заново
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 12, color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>
                  Подбор демо. Позже привяжем это к реальному каталогу и складу.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Стили (мягко, “киношно”, кнопки появляются не резко) */}
      <style jsx>{`
        .cursor {
          display: inline-block;
          width: 10px;
          height: 18px;
          margin-left: 6px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.22);
          transform: translateY(3px);
          animation: blink 900ms ease-in-out infinite;
        }
        @keyframes blink {
          0% { opacity: 0.15; }
          50% { opacity: 0.55; }
          100% { opacity: 0.15; }
        }

        .atticChoice {
          appearance: none;
          border: 1px solid rgba(255,255,255,0.14);
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.92);
          border-radius: 14px;
          padding: 10px 12px;
          cursor: pointer;
          font-weight: 750;
          font-size: 13px;
          letter-spacing: 0.15px;
          backdrop-filter: blur(8px);

          opacity: 0;
          transform: translateY(10px);
          animation: popIn 420ms cubic-bezier(0.2, 0.9, 0.2, 1) forwards;
        }
        .atticChoice:hover {
          background: rgba(255,255,255,0.10);
          border-color: rgba(255,255,255,0.22);
        }

        .atticCard {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          width: min(980px, 100%);
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.05);
          border-radius: 18px;
          padding: 12px;

          opacity: 0;
          transform: translateY(10px);
          animation: popIn 520ms cubic-bezier(0.2, 0.9, 0.2, 1) forwards;
        }

        .atticPrimary {
          border: 0;
          background: rgba(255,255,255,0.92);
          color: rgba(0,0,0,0.92);
          border-radius: 14px;
          padding: 10px 12px;
          cursor: pointer;
          font-weight: 900;
          letter-spacing: 0.15px;
        }
        .atticPrimary:hover { filter: brightness(1.05); }

        .atticGhost {
          border: 1px solid rgba(255,255,255,0.18);
          background: transparent;
          color: rgba(255,255,255,0.92);
          border-radius: 14px;
          padding: 10px 12px;
          cursor: pointer;
          font-weight: 800;
        }
        .atticGhost:hover { background: rgba(255,255,255,0.06); }

        @keyframes popIn {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

export default function ArmouryPage() {
  const cart = useCart();
  const [isAskOpen, setIsAskOpen] = useState(false);

  const [ready, setReady] = useState(false);

  const [bounds, setBounds] = useState<THREE.Box3 | null>(null);
  const [walkMesh, setWalkMesh] = useState<THREE.Object3D | null>(null);

  const [pickedKey, setPickedKey] = useState<string | null>(null);
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const pickedProduct = pickedKey ? DEMO_PRODUCTS_BY_OBJECT_KEY[pickedKey] : null;
  const controlsEnabled = !pickedProduct;

  // готовность сцены (скроем видео через маленькую задержку, чтобы не мигало)
  const hideTimer = useRef<number | null>(null);
  const handleReady = useCallback(() => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setReady(true), 120);
  }, []);

  useEffect(() => {
    return () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      {!ready && <VideoLoader />}

 {/* спросить старьёвщика */}
<div style={{ position: 'fixed', bottom: 14, left: 14, zIndex: 95 }}>
  <button
    onClick={() => setDialogOpen(true)}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      padding: '12px 14px',
      borderRadius: 14,
      background: 'rgba(0,0,0,0.55)',
      color: '#fff',
      border: '1px solid rgba(255,255,255,0.14)',
      backdropFilter: 'blur(8px)',
      cursor: 'pointer',
      fontSize: 13,
      fontWeight: 750,
      letterSpacing: 0.2,
    }}
  >
    🕯️ Задать вопрос старьёвщику
    <span style={{ opacity: 0.75, fontSize: 12 }}>подбор подарка</span>
  </button>
</div>

      {/* корзина */}
      <div style={{ position: 'fixed', top: 14, right: 14, zIndex: 90 }}>
        <a
          href="/cart"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 12px',
            borderRadius: 12,
            background: 'rgba(0,0,0,0.45)',
            color: '#fff',
            textDecoration: 'none',
            border: '1px solid rgba(255,255,255,0.12)',
            backdropFilter: 'blur(6px)',
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          🧺 Корзина
          <span
            style={{
              minWidth: 24,
              height: 24,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 999,
              background: '#fff',
              color: '#111',
              fontSize: 12,
              padding: '0 8px',
            }}
          >
            {cart.count}
          </span>
        </a>
      </div>

      {/* подсказки */}
      <div
        style={{
          position: 'fixed',
          left: 14,
          bottom: 64,
          zIndex: 90,
          padding: '8px 10px',
          borderRadius: 10,
          background: 'rgba(0,0,0,0.45)',
          color: '#fff',
          fontSize: 12,
          border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(6px)',
        }}
      >
        WASD — ходить • ↑↓←→ — смотреть/поворачивать • мышь — клик по объектам
      </div>

      <div
        style={{
          position: 'fixed',
          left: 14,
          bottom: 14,
          zIndex: 90,
          padding: '10px 12px',
          borderRadius: 12,
          background: 'rgba(0,0,0,0.45)',
          color: '#fff',
          fontSize: 13,
          border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(6px)',
        }}
      >
        {pickedProduct ? 'Закрой карточку, чтобы продолжить' : hoverKey ? `Кликни: ${hoverKey}` : 'Наведи на артефакт и кликни'}
      </div>

      <Canvas
        camera={{ position: [0, EYE_HEIGHT, 4], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener(
            'webglcontextlost',
            (e) => {
              e.preventDefault();
              console.warn('THREE.WebGLRenderer: Context Lost.');
            },
            { passive: false }
          );
        }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />

        <Suspense fallback={null}>
          <ArmouryScene
            onPick={setPickedKey}
            onHover={setHoverKey}
            hoveredKey={hoverKey}
            onBounds={setBounds}
            onWalkMesh={setWalkMesh}
            onReady={handleReady}
          />
        </Suspense>

        <WalkAndLookControls enabled={controlsEnabled} bounds={bounds} walkMesh={walkMesh} />
      </Canvas>

      {dialogOpen && (
  <AtticDialog
    onClose={() => setDialogOpen(false)}
    onAddToCart={(item) => {
      cart.add({ id: item.id, title: item.title, price: item.price, objectKey: item.id });
      setDialogOpen(false);
    }}
  />
)}

      {pickedProduct && pickedKey && (
        <Modal
          product={pickedProduct}
          objectKey={pickedKey}
          onClose={() => setPickedKey(null)}
          onAddToCart={(product, objectKey) => {
            cart.add({ id: product.id, title: product.title, price: product.price, objectKey });
            setPickedKey(null);
          }}
        />
      )}
      <AskAntiquarianDialog open={isAskOpen} onClose={() => setIsAskOpen(false)} />
    </div>
  );
}
