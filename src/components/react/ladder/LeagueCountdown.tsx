import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { twMerge } from 'tailwind-merge';

import { PepeLayer, type PepeMode } from './PepeLayer';

// The empty ladder: a unique-item name plate for the league and a countdown
// to its start, building up as it gets close. Once it has started (or with no
// start time) it says the ladder fills on the next sync.

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// The time, re-rendered whenever the second left to `start` changes. Checked
// every frame rather than on a timer: timers drift and get throttled, and one
// landing either side of the boundary shows a second twice or skips one.
const useCountdownNow = (start?: number) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (start === undefined) return;
    const secondOf = (time: number) => Math.floor((start - time) / SECOND);
    let shown = secondOf(Date.now());
    let frame = 0;
    const loop = () => {
      const current = Date.now();
      const second = secondOf(current);
      if (second !== shown) {
        shown = second;
        setNow(current);
      }
      // stop once it has started and the "has begun" state is showing
      if (current < start + SECOND) frame = requestAnimationFrame(loop);
    };
    setNow(Date.now());
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [start]);
  return now;
};

// How far to move the content from the section's centre to the viewport's,
// kept within the section so it never rides up over the ladder header
const useViewportCentre = () => {
  const section = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const [shift, setShift] = useState(0);
  useLayoutEffect(() => {
    const outer = section.current;
    const inner = content.current;
    if (!outer || !inner) return;
    const measure = () => {
      const { top, height } = outer.getBoundingClientRect();
      const slack = Math.max(0, (height - inner.offsetHeight) / 2);
      const wanted = window.innerHeight / 2 - (top + height / 2);
      setShift(Math.round(Math.min(slack, Math.max(-slack, wanted))));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(outer);
    observer.observe(inner);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);
  return { section, content, shift };
};

const NamePlate = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div className="flex h-[54px] w-full max-w-2xl items-stretch">
    <div
      className="w-[44px] shrink-0 bg-no-repeat"
      style={{ backgroundImage: 'url(/item-preview/unique/header-double-unique-left.png)' }}
    />
    <div
      className="flex min-w-0 flex-1 flex-col items-center justify-center bg-repeat-x font-fontinSmallcaps leading-tight"
      style={{ backgroundImage: 'url(/item-preview/unique/header-double-unique-middle.png)' }}
    >
      <span className="max-w-full truncate text-lg text-poeItem-unique md:text-xl">{title}</span>
      <span className="text-lg text-poeItem-unique md:text-xl">{subtitle}</span>
    </div>
    <div
      className="w-[44px] shrink-0 bg-no-repeat"
      style={{ backgroundImage: 'url(/item-preview/unique/header-double-unique-right.png)' }}
    />
  </div>
);

const Separator = () => (
  <img src="/item-preview/unique/separator-unique.png" alt="" className="my-1 w-56 max-w-full" />
);

const Unit = ({
  value,
  label,
  hot,
  solo,
}: {
  value: number;
  label: string;
  hot: boolean;
  /** the last minute: the seconds alone, huge */
  solo: boolean;
}) => (
  <div className={twMerge('flex flex-col items-center', solo ? 'w-auto' : 'w-16 sm:w-24 md:w-32')}>
    <span
      className={twMerge(
        'font-fontinSmallcaps tabular-nums leading-none',
        solo ? 'text-8xl sm:text-9xl md:text-[12rem]' : 'text-5xl sm:text-6xl md:text-8xl',
        hot ? 'text-[#ff9b6b]' : 'text-primary-400',
      )}
      style={{
        textShadow: hot
          ? '0 0 18px rgba(255,80,30,.85), 0 0 42px rgba(202,36,36,.6)'
          : '0 0 16px rgba(223,207,121,.45), 0 0 38px rgba(175,96,37,.35)',
      }}
    >
      {[...String(value).padStart(2, '0')].map((digit, index, digits) => (
        <span
          // keyed by place (from the right) and value, so only a digit that
          // changed remounts and replays the flip: 23 -> 24 flips just the 4
          key={`${digits.length - index}:${digit}`}
          className="inline-block motion-safe:animate-countdown-flip"
        >
          {digit}
        </span>
      ))}
    </span>
    <span className="mt-2 font-fontinSmallcaps text-xs uppercase tracking-[0.3em] text-primary-800 md:text-sm">
      {label}
    </span>
  </div>
);

// embers drifting up through the glow; fixed positions so renders are stable
const EMBERS = Array.from({ length: 18 }, (_, i) => ({
  left: (i * 37) % 100,
  delay: (i * 0.83) % 7,
  duration: 6 + ((i * 1.7) % 5),
  size: 2 + (i % 3),
}));

export const LeagueCountdown = ({
  leagueName,
  startsAt,
}: {
  leagueName: string;
  startsAt?: string | null;
}) => {
  const start = startsAt ? new Date(startsAt).getTime() : undefined;
  const now = useCountdownNow(start);
  const { section, content, shift } = useViewportCentre();
  const left = start !== undefined ? start - now : undefined;
  const counting = left !== undefined && left > 0;

  // the build-up: warmer in the last hour, burning in the last minute
  const finalHour = counting && left! < HOUR;
  const finalMinute = counting && left! < MINUTE;

  // a couple of minutes of celebration once it starts
  const [partyOver, setPartyOver] = useState(
    () => start !== undefined && Date.now() > start + 2 * MINUTE,
  );
  useEffect(() => {
    if (start === undefined) return;
    const wait = start + 2 * MINUTE - Date.now();
    setPartyOver(wait <= 0);
    if (wait <= 0) return;
    const timer = setTimeout(() => setPartyOver(true), wait);
    return () => clearTimeout(timer);
  }, [start]);
  const pepes: PepeMode | undefined = counting
    ? finalMinute
      ? 'frantic'
      : 'calm'
    : start !== undefined && !partyOver
      ? 'party'
      : undefined;

  const units = counting
    ? [
        { label: 'days', value: Math.floor(left! / DAY) },
        { label: 'hours', value: Math.floor((left! % DAY) / HOUR) },
        { label: 'minutes', value: Math.floor((left! % HOUR) / MINUTE) },
        { label: 'seconds', value: Math.floor((left! % MINUTE) / SECOND) },
      ]
        // drop leading zero units: the final minute is just the seconds
        .filter(
          (_, index, all) =>
            index === all.length - 1 || all.slice(0, index + 1).some(({ value }) => value > 0),
        )
    : [];

  return (
    <div
      ref={section}
      className="relative flex min-h-[28rem] flex-1 flex-col items-center justify-center overflow-hidden px-4 py-12 text-center"
    >
      {/* glow and embers */}
      <div
        aria-hidden
        // follows the content to the viewport's centre
        style={{ marginTop: shift }}
        className={twMerge(
          'pointer-events-none absolute left-1/2 top-1/2 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl',
          finalMinute
            ? 'motion-safe:animate-countdown-heartbeat bg-[radial-gradient(circle,rgba(202,36,36,.45),rgba(175,96,37,.15)_45%,transparent_70%)]'
            : finalHour
              ? 'motion-safe:animate-countdown-glow bg-[radial-gradient(circle,rgba(255,120,40,.32),rgba(175,96,37,.12)_45%,transparent_70%)]'
              : 'motion-safe:animate-countdown-glow bg-[radial-gradient(circle,rgba(175,96,37,.22),rgba(108,84,46,.08)_45%,transparent_70%)]',
        )}
      />
      {counting && (
        <div aria-hidden className="pointer-events-none absolute inset-0 motion-reduce:hidden">
          {EMBERS.map((ember, i) => (
            <span
              key={i}
              className={twMerge(
                'absolute bottom-0 animate-ember-rise rounded-full',
                finalHour ? 'bg-[#ff7a3d]' : 'bg-[#d9822b]',
              )}
              style={{
                left: `${ember.left}%`,
                width: ember.size,
                height: ember.size,
                animationDelay: `${ember.delay}s`,
                animationDuration: `${finalMinute ? ember.duration / 2 : ember.duration}s`,
                boxShadow: '0 0 6px 1px rgba(255,140,60,.8)',
              }}
            />
          ))}
        </div>
      )}
      {pepes && <PepeLayer mode={pepes} area={section} avoid={content} />}

      <div
        ref={content}
        className="relative flex w-full flex-col items-center gap-6"
        style={{ transform: `translateY(${shift}px)` }}
      >
        <NamePlate
          title={leagueName}
          subtitle={counting ? 'Begins in' : start !== undefined ? 'Has begun' : 'Ladder'}
        />

        {counting ? (
          <>
            <div
              className="flex items-start justify-center gap-1 sm:gap-3"
              role="timer"
              aria-live="off"
              aria-label={`${leagueName} starts ${new Date(start!).toLocaleString()}`}
            >
              {units.map((unit, index) => (
                <div key={unit.label} className="flex items-start">
                  {index > 0 && (
                    <span className="mt-1 font-fontinSmallcaps text-4xl leading-none text-primary-900 sm:text-5xl md:text-7xl">
                      :
                    </span>
                  )}
                  <Unit
                    value={unit.value}
                    label={unit.label}
                    hot={finalMinute}
                    solo={units.length === 1}
                  />
                </div>
              ))}
            </div>
            <Separator />
            <div className="font-fontinSmallcaps text-lg text-primary-600 md:text-xl">
              {new Date(start!).toLocaleString(undefined, {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </div>
          </>
        ) : (
          <>
            <div className="font-fontinSmallcaps text-3xl text-primary-400 md:text-4xl">
              Nobody on the ladder yet
            </div>
            <Separator />
            <div className="text-primary-800">The ladder syncs every 5 minutes</div>
          </>
        )}
      </div>
    </div>
  );
};
