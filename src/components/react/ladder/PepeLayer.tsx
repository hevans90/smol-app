import { useEffect, useRef, useState } from 'react';

// Pepes that fade in around the countdown and get up to something, then leave.
// Images are whatever is in src/assets/pepes; with none there, nothing shows.

const IMAGES = Object.values(
  import.meta.glob<string>('../../../assets/pepes/*.{png,jpg,jpeg,gif,webp,avif,svg}', {
    eager: true,
    import: 'default',
    query: '?url',
  }),
);

const random = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T,>(items: readonly T[]) => items[Math.floor(Math.random() * items.length)];

const O = 0.85; // how solid a pepe gets at its most visible

type Place = 'free' | 'bottom' | 'top' | 'left' | 'right';

type Behaviour = {
  place: Place;
  duration: [number, number];
  frames: () => Keyframe[];
};

const BEHAVIOURS: Behaviour[] = [
  // fades in and slowly looms
  {
    place: 'free',
    duration: [5000, 7000],
    frames: () => [
      { opacity: 0, transform: 'scale(0.8)' },
      { opacity: O, transform: 'scale(0.9)', offset: 0.2 },
      { opacity: O, transform: 'scale(1.15)', offset: 0.85 },
      { opacity: 0, transform: 'scale(1.2)' },
    ],
  },
  // spins up, spins out
  {
    place: 'free',
    duration: [3000, 4000],
    frames: () => [
      { opacity: 0, transform: 'rotate(0deg) scale(0.4)' },
      { opacity: O, transform: 'rotate(360deg) scale(1)', offset: 0.3 },
      { opacity: O, transform: 'rotate(720deg) scale(1)', offset: 0.7 },
      { opacity: 0, transform: 'rotate(1440deg) scale(0)' },
    ],
  },
  // hops across
  {
    place: 'free',
    duration: [3500, 4500],
    frames: () => {
      const dx = pick([-1, 1]) * random(240, 420);
      const at = (x: number, y: number) => `translate(${dx * x}px, ${y}px)`;
      return [
        { opacity: 0, transform: at(0, 0) },
        { opacity: O, transform: at(0, 0), offset: 0.08 },
        { transform: at(0.2, -90), offset: 0.2 },
        { transform: at(0.4, 0), offset: 0.32 },
        { transform: at(0.6, -90), offset: 0.44 },
        { transform: at(0.8, 0), offset: 0.56 },
        { transform: at(0.9, -50), offset: 0.66 },
        { opacity: O, transform: at(1, 0), offset: 0.76 },
        { opacity: 0, transform: at(1, 0) },
      ];
    },
  },
  // rage shake
  {
    place: 'free',
    duration: [2500, 3200],
    frames: () => [
      { opacity: 0, transform: 'rotate(0deg) scale(0.9)' },
      { opacity: O, transform: 'rotate(-12deg) scale(1)', offset: 0.15 },
      ...Array.from({ length: 10 }, (_, i) => ({
        transform: `rotate(${i % 2 ? 12 : -12}deg) scale(${1 + i * 0.03})`,
        offset: 0.2 + i * 0.06,
      })),
      { opacity: 0, transform: 'rotate(0deg) scale(1.4)' },
    ],
  },
  // launches at the camera
  {
    place: 'free',
    duration: [1800, 2400],
    frames: () => [
      { opacity: 0, transform: 'scale(0.2)' },
      { opacity: O, transform: 'scale(0.6)', offset: 0.35 },
      { opacity: 0, transform: 'scale(4)' },
    ],
  },
  // looks one way, then the other
  {
    place: 'free',
    duration: [3500, 4500],
    frames: () => [
      { opacity: 0, transform: 'scaleX(1)' },
      { opacity: O, transform: 'scaleX(1)', offset: 0.15 },
      { transform: 'scaleX(1)', offset: 0.3 },
      { transform: 'scaleX(-1)', offset: 0.32 },
      { transform: 'scaleX(-1)', offset: 0.5 },
      { transform: 'scaleX(1)', offset: 0.52 },
      { transform: 'scaleX(1)', offset: 0.65 },
      { opacity: O, transform: 'scaleX(-1)', offset: 0.67 },
      { opacity: 0, transform: 'scaleX(-1)' },
    ],
  },
  // drifts off, swaying
  {
    place: 'free',
    duration: [6000, 8000],
    frames: () => {
      const dx = pick([-1, 1]) * random(120, 260);
      return [
        { opacity: 0, transform: 'translate(0, 40px) rotate(-8deg)' },
        { opacity: O, transform: `translate(${dx * 0.25}px, 0) rotate(8deg)`, offset: 0.25 },
        { transform: `translate(${dx * 0.5}px, -40px) rotate(-8deg)`, offset: 0.5 },
        { opacity: O, transform: `translate(${dx * 0.75}px, -80px) rotate(8deg)`, offset: 0.75 },
        { opacity: 0, transform: `translate(${dx}px, -120px) rotate(-8deg)` },
      ];
    },
  },
  // slams down from above and squishes
  {
    place: 'free',
    duration: [2200, 2800],
    frames: () => [
      { opacity: 0, transform: 'translateY(-300px)', easing: 'cubic-bezier(.5,0,1,.5)' },
      { opacity: O, transform: 'translateY(0) scale(1, 1)', offset: 0.3 },
      { transform: 'translateY(0) scale(1.3, 0.7)', offset: 0.36 },
      { transform: 'translateY(-30px) scale(0.9, 1.1)', offset: 0.46 },
      { opacity: O, transform: 'translateY(0) scale(1, 1)', offset: 0.56 },
      { opacity: 0, transform: 'translateY(0) scale(1, 1)' },
    ],
  },
  // peeks up from the bottom edge
  {
    place: 'bottom',
    duration: [3500, 4500],
    frames: () => [
      { opacity: 0, transform: 'translateY(100%)' },
      { opacity: O, transform: 'translateY(35%)', offset: 0.25 },
      { transform: 'translateY(40%)', offset: 0.5 },
      { opacity: O, transform: 'translateY(30%)', offset: 0.75 },
      { opacity: 0, transform: 'translateY(100%)' },
    ],
  },
  // hangs down from the top edge
  {
    place: 'top',
    duration: [3500, 4500],
    frames: () => [
      { opacity: 0, transform: 'rotate(180deg) translateY(100%)' },
      { opacity: O, transform: 'rotate(180deg) translateY(30%)', offset: 0.3 },
      { transform: 'rotate(170deg) translateY(30%)', offset: 0.5 },
      { opacity: O, transform: 'rotate(190deg) translateY(30%)', offset: 0.7 },
      { opacity: 0, transform: 'rotate(180deg) translateY(100%)' },
    ],
  },
  // leans in from a side
  {
    place: 'left',
    duration: [3000, 4000],
    frames: () => [
      { opacity: 0, transform: 'translateX(-100%) rotate(30deg)' },
      { opacity: O, transform: 'translateX(-35%) rotate(20deg)', offset: 0.3 },
      { opacity: O, transform: 'translateX(-35%) rotate(25deg)', offset: 0.7 },
      { opacity: 0, transform: 'translateX(-100%) rotate(30deg)' },
    ],
  },
  {
    place: 'right',
    duration: [3000, 4000],
    frames: () => [
      { opacity: 0, transform: 'translateX(100%) rotate(-30deg)' },
      { opacity: O, transform: 'translateX(35%) rotate(-20deg)', offset: 0.3 },
      { opacity: O, transform: 'translateX(35%) rotate(-25deg)', offset: 0.7 },
      { opacity: 0, transform: 'translateX(100%) rotate(-30deg)' },
    ],
  },
];

type Spawn = {
  id: number;
  src: string;
  behaviour: Behaviour;
  style: React.CSSProperties;
  mirrored: boolean;
};

// somewhere around the page, but not on top of the timer in the middle
const freeSpot = () => {
  for (;;) {
    const x = random(2, 90);
    const y = random(5, 85);
    if (x < 25 || x > 68 || y < 15 || y > 72) return { left: `${x}%`, top: `${y}%` };
  }
};

const placeStyle = (place: Place, size: number): React.CSSProperties => {
  const base = { width: size, height: size };
  switch (place) {
    case 'bottom':
      return { ...base, bottom: 0, left: `${pick([random(3, 25), random(70, 92)])}%` };
    case 'top':
      return { ...base, top: 0, left: `${pick([random(3, 25), random(70, 92)])}%` };
    case 'left':
      return { ...base, left: 0, top: `${random(10, 75)}%` };
    case 'right':
      return { ...base, right: 0, top: `${random(10, 75)}%` };
    default:
      return { ...base, ...freeSpot() };
  }
};

const Pepe = ({ spawn, onDone }: { spawn: Spawn; onDone: (id: number) => void }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const animation = ref.current?.animate(spawn.behaviour.frames(), {
      duration: random(...spawn.behaviour.duration),
      easing: 'ease-in-out',
      fill: 'both',
    });
    if (!animation) return;
    animation.onfinish = () => onDone(spawn.id);
    return () => animation.cancel();
  }, [spawn, onDone]);
  return (
    <div ref={ref} className="absolute opacity-0" style={spawn.style}>
      <img
        src={spawn.src}
        alt=""
        draggable={false}
        className="h-full w-full select-none object-contain drop-shadow-[0_0_12px_rgba(0,0,0,.6)]"
        style={spawn.mirrored ? { transform: 'scaleX(-1)' } : undefined}
      />
    </div>
  );
};

export const PepeLayer = ({ frantic }: { frantic: boolean }) => {
  const [spawns, setSpawns] = useState<Spawn[]>([]);
  const [remove] = useState(
    () => (id: number) => setSpawns((current) => current.filter((spawn) => spawn.id !== id)),
  );

  useEffect(() => {
    if (!IMAGES.length) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let id = 0;
    let lastSrc: string | undefined;
    let timer: ReturnType<typeof setTimeout>;
    const spawnOne = () => {
      if (document.visibilityState === 'visible') {
        const src =
          IMAGES.length > 1 ? pick(IMAGES.filter((image) => image !== lastSrc)) : IMAGES[0];
        lastSrc = src;
        const behaviour = pick(BEHAVIOURS);
        setSpawns((current) =>
          current.length >= (frantic ? 7 : 4)
            ? current
            : [
                ...current,
                {
                  id: id++,
                  src,
                  behaviour,
                  style: placeStyle(behaviour.place, Math.round(random(70, 170))),
                  mirrored: Math.random() < 0.5,
                },
              ],
        );
      }
      timer = setTimeout(spawnOne, frantic ? random(600, 1800) : random(1500, 5000));
    };
    timer = setTimeout(spawnOne, random(800, 2000));
    return () => clearTimeout(timer);
  }, [frantic]);

  if (!spawns.length) return null;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {spawns.map((spawn) => (
        <Pepe key={spawn.id} spawn={spawn} onDone={remove} />
      ))}
    </div>
  );
};
