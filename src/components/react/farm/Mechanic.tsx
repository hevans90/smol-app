import type { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';
import { MECHANICS_WITH_ICON } from '../../../_utils/atlas';

export const MechanicIcon = ({
  mechanic,
  className,
}: {
  mechanic: string;
  className?: string;
}) =>
  MECHANICS_WITH_ICON.has(mechanic) ? (
    <img
      src={`/league-icons/${mechanic}.webp`}
      alt=""
      className={twMerge('h-6 w-6 shrink-0', className)}
    />
  ) : (
    // keeps rows aligned for mechanics with no artwork
    <span
      className={twMerge(
        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gray-700 text-xs text-primary-800',
        className,
      )}
      aria-hidden
    >
      ·
    </span>
  );

/** "6 notables", for the notables and keystones someone took in a mechanic. */
export const notableCount = (names: string[]) =>
  names.length ? `${names.length} ${names.length === 1 ? 'notable' : 'notables'}` : undefined;

/** One mechanic as a row: its icon and name, with an optional short note. */
export const MechanicRow = ({
  mechanic,
  label,
  note,
  title,
  active,
  compact,
  children,
}: {
  mechanic: string;
  label: string;
  note?: string;
  title?: string;
  active?: boolean;
  compact?: boolean;
  children?: ReactNode;
}) => (
  <div title={title} className="min-w-0">
    <div className="flex items-center gap-2">
      <MechanicIcon mechanic={mechanic} className={compact ? 'h-5 w-5' : undefined} />
      <span
        className={twMerge(
          'min-w-0 flex-1 truncate text-sm',
          active ? 'text-primary-300' : 'text-primary-500',
        )}
      >
        {label}
      </span>
      {note && <span className="shrink-0 text-xs text-primary-800">{note}</span>}
    </div>
    {children}
  </div>
);
