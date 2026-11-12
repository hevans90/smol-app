import { useEffect, useState } from 'react';
import { twMerge } from 'tailwind-merge';

// The empty ladder: a unique-item name plate for the league and a countdown
// to its start, building up as it gets close. Once it has started (or with no
// start time) it says the ladder fills on the next sync.

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const useNow = (active: boolean) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    // tick on the second boundary so every unit flips together
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      setNow(Date.now());
      timer = setTimeout(tick, SECOND - (Date.now() % SECOND));
    };
    timer = setTimeout(tick, SECOND - (Date.now() % SECOND));
    return () => clearTimeout(timer);
  }, [active]);
  return now;
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
      // re-keyed each change so the flip animation plays on the digit that moved
      key={value}
      className={twMerge(
        'font-fontinSmallcaps tabular-nums leading-none motion-safe:animate-countdown-flip',
        solo ? 'text-8xl sm:text-9xl md:text-[12rem]' : 'text-5xl sm:text-6xl md:text-8xl',
        hot ? 'text-[#ff9b6b]' : 'text-primary-400',
      )}
      style={{
        textShadow: hot
          ? '0 0 18px rgba(255,80,30,.85), 0 0 42px rgba(202,36,36,.6)'
          : '0 0 16px rgba(223,207,121,.45), 0 0 38px rgba(175,96,37,.35)',
      }}
    >
      {String(value).padStart(2, '0')}
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
  const now = useNow(start !== undefined && start > Date.now() - SECOND);
  const left = start !== undefined ? start - now : undefined;
  const counting = left !== undefined && left > 0;

  // the build-up: warmer in the last hour, burning in the last minute
  const finalHour = counting && left! < HOUR;
  const finalMinute = counting && left! < MINUTE;

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
    <div className="relative flex min-h-[28rem] flex-1 flex-col items-center justify-center overflow-hidden px-4 py-12 text-center">
      {/* glow and embers */}
      <div
        aria-hidden
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

      <div className="relative flex w-full flex-col items-center gap-6">
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
