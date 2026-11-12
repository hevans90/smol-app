import type { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

export const Panel = ({
  title,
  aside,
  className,
  children,
}: {
  title?: ReactNode;
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
}) => (
  <section
    className={twMerge(
      'min-w-0 rounded-lg border border-primary-900/50 bg-gray-900/60 p-4 md:p-5',
      className,
    )}
  >
    {(title || aside) && (
      <header className="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        {title && (
          <h2 className="m-0 font-fontinSmallcaps text-lg text-primary-500">{title}</h2>
        )}
        {aside && <div className="text-xs text-primary-800">{aside}</div>}
      </header>
    )}
    {children}
  </section>
);

/** A thin horizontal fill, 0-1. */
export const Meter = ({
  value,
  colour = '#dfcf99',
  className,
}: {
  value: number;
  colour?: string;
  className?: string;
}) => (
  <div className={twMerge('h-1 overflow-hidden rounded-full bg-gray-800', className)}>
    <div
      className="h-full rounded-full"
      style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, background: colour }}
    />
  </div>
);
