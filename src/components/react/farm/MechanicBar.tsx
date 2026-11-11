import type { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';
import { MECHANICS_WITH_ICON } from '../../../_utils/atlas';
import { TREE_COLOURS } from '../../../_utils/atlas-geometry';

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

/**
 * One mechanic as a labelled bar. The mechanic is identified by its icon and
 * name; the bar is a single hue and only ever encodes `fraction`.
 */
export const MechanicBar = ({
  mechanic,
  label,
  fraction,
  value,
  title,
  active,
  compact,
  children,
}: {
  mechanic: string;
  label: string;
  /** 0-1 */
  fraction: number;
  /** what the bar is worth, in words: "42%", "5 members" */
  value: string;
  title?: string;
  active?: boolean;
  compact?: boolean;
  children?: ReactNode;
}) => (
  <div title={title} className="min-w-0">
    <div className="flex items-center gap-2">
      <MechanicIcon mechanic={mechanic} className={compact ? 'h-5 w-5' : undefined} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span
            className={twMerge(
              'truncate text-sm',
              active ? 'text-primary-300' : 'text-primary-500',
            )}
          >
            {label}
          </span>
          <span className="shrink-0 text-xs tabular-nums text-primary-800">{value}</span>
        </div>
        <div className="mt-1 h-1.5 rounded-full bg-gray-800">
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.max(fraction * 100, 2)}%`,
              backgroundColor: active ? TREE_COLOURS.highlight : TREE_COLOURS.allocated,
            }}
          />
        </div>
      </div>
    </div>
    {children}
  </div>
);
