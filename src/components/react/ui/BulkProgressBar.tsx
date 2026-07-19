import { twMerge } from 'tailwind-merge';
import { Popover, PopoverContent, PopoverTrigger } from './Popover';

export type BulkProgressSegment = {
  userId: string;
  name: string;
  quantity: number;
};

// Deterministic palette per contributor — same person always gets the same
// color across renders/reloads (hashed from their user id), so a returning
// contributor's segment is recognizable at a glance.
const SEGMENT_COLORS = [
  'bg-sky-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-fuchsia-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-lime-500',
  'bg-violet-500',
];

const colorForUser = (userId: string) => {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  }
  return SEGMENT_COLORS[Math.abs(hash) % SEGMENT_COLORS.length];
};

const Segment = ({
  segment,
  widthPct,
}: {
  segment: BulkProgressSegment;
  widthPct: number;
}) => (
  <Popover placement="top" openOnHover floatOffset={8}>
    <PopoverTrigger asChild={true}>
      <div
        className={twMerge(
          'h-full transition-[width] duration-500 ease-out',
          colorForUser(segment.userId),
        )}
        style={{ width: `${widthPct}%` }}
      />
    </PopoverTrigger>
    <PopoverContent className="rounded bg-gray-800 px-2 py-1 text-xs text-primary-300 shadow-lg">
      {segment.name}: {segment.quantity.toLocaleString()}
    </PopoverContent>
  </Popover>
);

/** Stacked per-contributor segments over a total, with an animated fill and
 * a hover tooltip per segment. Used by bulk order cards to show live
 * progress toward the target quantity. */
export const BulkProgressBar = ({
  total,
  segments,
  className,
}: {
  total: number;
  segments: BulkProgressSegment[];
  className?: string;
}) => {
  const sum = segments.reduce((acc, s) => acc + s.quantity, 0);

  return (
    <div className={twMerge('flex flex-col gap-1', className)}>
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-800">
        <div className="absolute inset-0 flex">
          {segments.map((segment, i) => (
            <Segment
              key={`${segment.userId}-${i}`}
              segment={segment}
              widthPct={total > 0 ? (segment.quantity / total) * 100 : 0}
            />
          ))}
        </div>
      </div>
      <div className="text-right text-xs text-primary-800">
        {sum.toLocaleString()} / {total.toLocaleString()}
      </div>
    </div>
  );
};
