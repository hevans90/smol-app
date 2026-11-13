import { useEffect, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';

// Pepes that fade in out of the background around the countdown, get up to
// something, and leave. They use the whole width of the window (not just the
// page column), stay clear of the timer and of each other, and every one is
// placed so its whole route stays on screen. Click one to pop it.
// Images are whatever is in src/assets/pepes.

const IMAGES = Object.values(
  import.meta.glob<string>('../../../assets/pepes/*.{png,jpg,jpeg,gif,webp,avif}', {
    eager: true,
    import: 'default',
    query: '?url',
  }),
);

// Fetched one at a time as they're needed (and the next one ahead), not all
// up front: there are a lot of them.
const loaded = new Map<string, Promise<Blob | null>>();
const load = (url: string) => {
  if (!loaded.has(url))
    loaded.set(
      url,
      fetch(url)
        .then((response) => (response.ok ? response.blob() : null))
        .catch(() => null),
    );
  return loaded.get(url)!;
};

// every image once, in a random order, before any repeats
let bag: string[] = [];
const nextImage = () => {
  if (!bag.length) {
    bag = [...IMAGES];
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
  }
  const url = bag.pop()!;
  if (bag.length) void load(bag[bag.length - 1]);
  return url;
};

export type PepeMode = 'calm' | 'frantic' | 'party';

const NAV_HEIGHT = 56; // the fixed site header
const MARGIN = 12; // from the window's edges
const GAP = 16; // between a pepe and the timer or another pepe

const random = (min: number, max: number) => min + Math.random() * (max - min);
const lerp = (from: number, to: number, t: number) => from + (to - from) * t;

type Box = { left: number; right: number; top: number; bottom: number };
type Rect = { x1: number; y1: number; x2: number; y2: number };

type Look = {
  /** how solid it gets */
  peak: number;
  /** resting focus: far-off pepes stay a little soft */
  focus: string;
  size: number;
  /** -1 or 1: which way it travels, if it travels */
  dir: number;
};

type Move = {
  frames: Keyframe[];
  duration: number;
  /** room it needs beyond its own square, over the whole animation */
  box: Box;
};

// frame helpers: in from the background (blurred, dim, small), out the same way
const hidden = (transform: string, offset?: number): Keyframe => ({
  opacity: 0,
  transform,
  filter: 'blur(10px) brightness(0.5)',
  ...(offset === undefined ? {} : { offset }),
});
const shown = (look: Look, transform: string, offset?: number): Keyframe => ({
  opacity: look.peak,
  transform,
  filter: look.focus,
  ...(offset === undefined ? {} : { offset }),
});
const grows = (size: number, scale: number): Box => {
  const extra = Math.max(0, (size * (scale - 1)) / 2);
  return { left: extra, right: extra, top: extra, bottom: extra };
};
const travels = (dx: number, up: number, down: number, sides = 0): Box => ({
  left: Math.max(0, -dx) + sides,
  right: Math.max(0, dx) + sides,
  top: up,
  bottom: down,
});

type Behaviour = {
  /** relative chance in calm mode, and when things get heated */
  weight: { calm: number; heated: number };
  make: (look: Look) => Move;
};

const BEHAVIOURS: Behaviour[] = [
  // fades up and slowly looms
  {
    weight: { calm: 4, heated: 1 },
    make: (look) => ({
      duration: random(7000, 10000),
      box: grows(look.size, 1.18),
      frames: [
        hidden('scale(0.85)'),
        shown(look, 'scale(0.95)', 0.15),
        shown(look, 'scale(1.12)', 0.85),
        hidden('scale(1.18)'),
      ],
    }),
  },
  // bobs about, gently
  {
    weight: { calm: 4, heated: 1 },
    make: (look) => ({
      duration: random(8000, 11000),
      box: travels(0, 18, 18, look.size * 0.05),
      frames: [
        hidden('translateY(16px) rotate(0deg)'),
        shown(look, 'translateY(0) rotate(-3deg)', 0.12),
        shown(look, 'translateY(-10px) rotate(3deg)', 0.3),
        shown(look, 'translateY(4px) rotate(-2deg)', 0.5),
        shown(look, 'translateY(-8px) rotate(2deg)', 0.7),
        shown(look, 'translateY(0) rotate(0deg)', 0.88),
        hidden('translateY(-16px) rotate(0deg)'),
      ],
    }),
  },
  // drifts off, swaying
  {
    weight: { calm: 3, heated: 1 },
    make: (look) => {
      const dx = look.dir * random(100, 220);
      const at = (x: number, y: number, r: number) =>
        `translate(${dx * x}px, ${y}px) rotate(${r}deg)`;
      return {
        duration: random(9000, 12000),
        box: travels(dx, 60, 30, look.size * 0.05),
        frames: [
          hidden(at(0, 30, -4)),
          shown(look, at(0.15, 10, 4), 0.12),
          shown(look, at(0.5, -20, -4), 0.5),
          shown(look, at(0.85, -45, 4), 0.88),
          hidden(at(1, -60, 0)),
        ],
      };
    },
  },
  // hops across, then sits a while
  {
    weight: { calm: 2, heated: 3 },
    make: (look) => {
      const dx = look.dir * random(180, 320);
      const at = (x: number, y: number) => `translate(${dx * x}px, ${y}px)`;
      return {
        duration: random(6000, 7500),
        box: travels(dx, 70, 0),
        frames: [
          hidden(at(0, 0)),
          shown(look, at(0, 0), 0.1),
          shown(look, at(1 / 6, -70), 0.18),
          shown(look, at(2 / 6, 0), 0.26),
          shown(look, at(3 / 6, -70), 0.34),
          shown(look, at(4 / 6, 0), 0.42),
          shown(look, at(5 / 6, -50), 0.5),
          shown(look, at(1, 0), 0.58),
          shown(look, at(1, 0), 0.9),
          hidden(at(1, 0)),
        ],
      };
    },
  },
  // gets angry about it
  {
    weight: { calm: 1, heated: 3 },
    make: (look) => ({
      duration: random(5000, 6000),
      box: grows(look.size, 1.25),
      frames: [
        hidden('rotate(0deg) scale(0.9)'),
        shown(look, 'rotate(0deg) scale(1)', 0.15),
        shown(look, 'rotate(0deg) scale(1)', 0.3),
        ...Array.from({ length: 8 }, (_, i) =>
          shown(look, `rotate(${i % 2 ? 9 : -9}deg) scale(${1 + i * 0.02})`, 0.33 + i * 0.035),
        ),
        shown(look, 'rotate(0deg) scale(1.05)', 0.65),
        shown(look, 'rotate(0deg) scale(1.05)', 0.88),
        hidden('rotate(0deg) scale(1.1)'),
      ],
    }),
  },
  // drops in from above and squashes
  {
    weight: { calm: 1, heated: 2 },
    make: (look) => ({
      duration: random(5000, 6000),
      box: { ...grows(look.size, 1.25), top: 180 },
      frames: [
        { ...hidden('translateY(-180px) scale(1, 1)'), easing: 'ease-out' },
        { ...shown(look, 'translateY(-150px) scale(1, 1)', 0.04), easing: 'cubic-bezier(.5,0,1,.6)' },
        shown(look, 'translateY(0) scale(1, 1)', 0.16),
        shown(look, 'translateY(0) scale(1.25, 0.75)', 0.2),
        shown(look, 'translateY(-24px) scale(0.92, 1.08)', 0.27),
        shown(look, 'translateY(0) scale(1, 1)', 0.34),
        shown(look, 'translateY(0) scale(1, 1)', 0.9),
        hidden('translateY(0) scale(1, 1)'),
      ],
    }),
  },
  // comes at the camera
  {
    weight: { calm: 1, heated: 2 },
    make: (look) => ({
      duration: random(3500, 4500),
      box: grows(look.size, 1.7),
      frames: [
        hidden('scale(0.4)'),
        shown(look, 'scale(0.7)', 0.25),
        shown(look, 'scale(0.8)', 0.6),
        { opacity: 0, transform: 'scale(1.7)', filter: 'blur(4px)' },
      ],
    }),
  },
  // the occasional single spin
  {
    weight: { calm: 0.4, heated: 0.5 },
    make: (look) => ({
      duration: random(6000, 7000),
      box: grows(look.size, Math.SQRT2),
      frames: [
        hidden('rotate(0deg)'),
        shown(look, 'rotate(0deg)', 0.15),
        shown(look, 'rotate(0deg)', 0.4),
        shown(look, 'rotate(360deg)', 0.55),
        shown(look, 'rotate(360deg)', 0.88),
        hidden('rotate(360deg)'),
      ],
    }),
  },
];

const pickBehaviour = (mode: PepeMode) => {
  const weightOf = (b: Behaviour) => (mode === 'calm' ? b.weight.calm : b.weight.heated);
  let roll = Math.random() * BEHAVIOURS.reduce((sum, b) => sum + weightOf(b), 0);
  for (const behaviour of BEHAVIOURS) {
    roll -= weightOf(behaviour);
    if (roll <= 0) return behaviour;
  }
  return BEHAVIOURS[0];
};

const PACE: Record<PepeMode, { every: [number, number]; max: number }> = {
  calm: { every: [2500, 6000], max: 4 },
  frantic: { every: [800, 2000], max: 7 },
  party: { every: [350, 900], max: 12 },
};

const overlaps = (a: Rect, b: Rect, gap: number) =>
  a.x1 < b.x2 + gap && b.x1 < a.x2 + gap && a.y1 < b.y2 + gap && b.y1 < a.y2 + gap;

type Spawn = {
  id: number;
  src: string;
  move: Move;
  x: number;
  y: number;
  size: number;
};

type Placed = Omit<Spawn, 'id' | 'src'> & { route: Rect };

const Pepe = ({ spawn, onDone }: { spawn: Spawn; onDone: (id: number) => void }) => {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const popped = useRef(false);

  useEffect(() => {
    const animation = outer.current?.animate(
      spawn.move.frames.map((frame) => ({ easing: 'ease-in-out', ...frame })),
      { duration: spawn.move.duration, fill: 'both' },
    );
    if (animation) animation.onfinish = () => onDone(spawn.id);
    return () => animation?.cancel();
  }, [spawn, onDone]);

  const pop = () => {
    if (popped.current || !inner.current) return;
    popped.current = true;
    outer.current?.getAnimations().forEach((animation) => animation.pause());
    inner.current.animate(
      [
        { transform: 'scale(1)', filter: 'brightness(1)', opacity: 1 },
        { transform: 'scale(1.15)', filter: 'brightness(2.5)', opacity: 1, offset: 0.3 },
        { transform: 'scale(1.6)', filter: 'brightness(3)', opacity: 0 },
      ],
      { duration: 280, easing: 'ease-out', fill: 'forwards' },
    ).onfinish = () => onDone(spawn.id);
  };

  return (
    <div
      ref={outer}
      className="pointer-events-auto absolute cursor-pointer opacity-0"
      style={{ left: spawn.x, top: spawn.y, width: spawn.size, height: spawn.size }}
      onPointerDown={pop}
    >
      <div ref={inner} className="h-full w-full">
        <img
          src={spawn.src}
          alt=""
          draggable={false}
          className="h-full w-full select-none object-contain drop-shadow-[0_6px_14px_rgba(0,0,0,.7)]"
        />
      </div>
    </div>
  );
};

export const PepeLayer = ({
  mode,
  area,
  avoid,
}: {
  mode: PepeMode;
  /** the band of the page they may use (full window width within it) */
  area: RefObject<HTMLElement>;
  /** what they must stay off, the timer */
  avoid: RefObject<HTMLElement>;
}) => {
  const [spawns, setSpawns] = useState<Spawn[]>([]);
  const taken = useRef(new Map<number, Rect>());
  const live = useRef(new Map<number, string>());
  const [remove] = useState(() => (id: number) => {
    taken.current.delete(id);
    const src = live.current.get(id);
    if (src) URL.revokeObjectURL(src);
    live.current.delete(id);
    setSpawns((current) => current.filter((spawn) => spawn.id !== id));
  });
  useEffect(
    () => () => {
      live.current.forEach((src) => URL.revokeObjectURL(src));
      live.current.clear();
      taken.current.clear();
    },
    [],
  );

  useEffect(() => {
    if (!IMAGES.length) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let cancelled = false;
    let id = Date.now();
    let lastSide = 1;

    const place = (): Placed | undefined => {
      const region = area.current?.getBoundingClientRect();
      if (!region) return;
      const bounds = {
        x1: MARGIN,
        x2: window.innerWidth - MARGIN,
        y1: Math.max(NAV_HEIGHT + MARGIN, region.top),
        y2: Math.min(window.innerHeight, region.bottom) - MARGIN,
      };
      const timer = avoid.current?.getBoundingClientRect();
      // further away is smaller, fainter and softer; a little bigger on wide screens
      const depth = Math.random();
      const scale = window.innerWidth >= 1536 ? 1.15 : window.innerWidth < 640 ? 0.75 : 1;
      const size = Math.round(Math.min(170, lerp(80, 150, depth) * scale));
      const behaviour = pickBehaviour(mode);
      // alternate sides of the timer so they don't bunch up
      const side = -lastSide;

      for (let attempt = 0; attempt < 60; attempt++) {
        const dir = attempt % 2 ? 1 : -1;
        const move = behaviour.make({
          peak: lerp(0.55, 0.95, depth),
          focus: `blur(${((1 - depth) * 1.2).toFixed(2)}px)`,
          size,
          dir,
        });
        const { box } = move;
        const minX = bounds.x1 + box.left;
        const maxX = bounds.x2 - box.right - size;
        const minY = bounds.y1 + box.top;
        const maxY = bounds.y2 - box.bottom - size;
        if (maxX < minX || maxY < minY) continue;
        // first tries on the side due, then anywhere
        const middle = timer ? (timer.left + timer.right) / 2 : window.innerWidth / 2;
        const x =
          attempt < 30
            ? side < 0
              ? random(minX, Math.max(minX, Math.min(maxX, middle - size)))
              : random(Math.min(maxX, Math.max(minX, middle)), maxX)
            : random(minX, maxX);
        const y = random(minY, maxY);
        const route = {
          x1: x - box.left,
          y1: y - box.top,
          x2: x + size + box.right,
          y2: y + size + box.bottom,
        };
        const timerRect = timer && {
          x1: timer.left,
          y1: timer.top,
          x2: timer.right,
          y2: timer.bottom,
        };
        if (timerRect && overlaps(route, timerRect, GAP)) continue;
        if ([...taken.current.values()].some((other) => overlaps(route, other, GAP))) continue;
        lastSide = x + size / 2 < middle ? -1 : 1;
        return { move, x: Math.round(x), y: Math.round(y), size, route };
      }
      return;
    };

    let timer: ReturnType<typeof setTimeout>;
    const spawnOne = () => {
      const { every, max } = PACE[mode];
      if (document.visibilityState === 'visible' && taken.current.size < max) {
        // placed once its image is in, so none pops in half-drawn
        void load(nextImage()).then((blob) => {
          if (cancelled || !blob || taken.current.size >= max) return;
          const placed = place();
          if (!placed) return;
          const { route, ...rest } = placed;
          // its own copy of the image, so a gif starts from its first frame
          const spawn = { ...rest, id: id++, src: URL.createObjectURL(blob) };
          taken.current.set(spawn.id, route);
          live.current.set(spawn.id, spawn.src);
          setSpawns((current) => [...current, spawn]);
        });
      }
      timer = setTimeout(spawnOne, random(...every));
    };
    timer = setTimeout(spawnOne, mode === 'party' ? 0 : random(600, 1500));
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [mode, area, avoid]);

  if (!spawns.length) return null;
  return createPortal(
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[5] overflow-hidden">
      {spawns.map((spawn) => (
        <Pepe key={spawn.id} spawn={spawn} onDone={remove} />
      ))}
    </div>,
    document.body,
  );
};
