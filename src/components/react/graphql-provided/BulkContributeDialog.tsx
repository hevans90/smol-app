import { useEffect, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { buildBulkEmbed, type BulkDiscordUser } from '../../../_utils/bulk-discord';
import { matchBulkOrder } from '../../../_utils/stash-matching';
import type { AggregatedStashItem } from '../../../models/ggg-stash';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeading,
} from '../ui/Dialog';
import { Button } from '../ui/Button';
import type { BulkOrderWithContributions } from './BulkOrderCard';

export type BulkContributeValues = {
  quantity: number;
  delivery: 'gstash' | 'dm';
  note?: string;
};

const NOTE_MAX_LENGTH = 140;

const sumOf = (order: BulkOrderWithContributions) =>
  order.contributions.reduce((acc, c) => acc + c.quantity, 0);

// Mirrors a real Discord message closely enough to be a trustworthy
// preview: bot name header + an embed card with a colored left accent bar.
const DiscordPreview = ({
  content,
  embed,
}: {
  content?: string;
  embed: ReturnType<typeof buildBulkEmbed>['embeds'][number];
}) => (
  <div className="rounded-md bg-[#313338] p-3 font-sans text-[#dbdee1]">
    <div className="mb-1 flex items-center gap-2">
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-800 text-xs text-white">
        S
      </div>
      <span className="text-sm font-medium text-white">smol-bot</span>
      <span className="rounded bg-[#5865f2] px-1 text-[10px] text-white">
        BOT
      </span>
    </div>
    {content && <div className="mb-2 text-sm">{content}</div>}
    <div
      className="rounded border-l-4 bg-[#2b2d31] p-3"
      style={{ borderColor: `#${(embed.color ?? 0).toString(16).padStart(6, '0')}` }}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          {embed.title && (
            <div className="mb-1 text-sm font-semibold text-white">
              {embed.title}
            </div>
          )}
          {embed.description && (
            <div className="mb-2 whitespace-pre-line text-sm">
              {embed.description}
            </div>
          )}
        </div>
        {embed.thumbnail && (
          <img
            src={embed.thumbnail.url}
            className="h-16 w-16 shrink-0 rounded object-contain"
            alt=""
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        )}
      </div>
      {embed.fields?.map((field, i) => (
        <div key={i} className="mb-1">
          <div className="text-xs font-semibold text-[#b5bac1]">
            {field.name}
          </div>
          <div className="whitespace-pre-line text-sm">{field.value}</div>
        </div>
      ))}
      {embed.footer && (
        <div className="mt-2 text-xs text-[#949ba4]">{embed.footer.text}</div>
      )}
    </div>
  </div>
);

// Reuses whatever stash scan the order list already ran (see
// BulkOrderBook.tsx's "Check my stash" button) — this dialog never triggers
// its own scan, it just surfaces a quick-fill for the same result.
const StashQuickFill = ({
  order,
  remaining,
  stashItems,
  onQuantityFound,
}: {
  order: BulkOrderWithContributions;
  remaining: number;
  stashItems: AggregatedStashItem[] | null | undefined;
  onQuantityFound: (quantity: number) => void;
}) => {
  if (!stashItems) return null;
  const verdict = matchBulkOrder(stashItems, order);
  if (!verdict.matched) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-primary-300">
      <span>
        You have <strong>{verdict.availableQuantity.toLocaleString()}</strong> of these in your stash.
      </span>
      <button
        type="button"
        className="rounded bg-gray-800 px-3 py-1.5 text-xs text-primary-300 hover:bg-gray-700"
        onClick={() => onQuantityFound(Math.min(remaining, verdict.availableQuantity))}
      >
        Fill from stash
      </button>
    </div>
  );
};

export const BulkContributeDialog = ({
  order,
  myUser,
  open,
  onOpenChange,
  onSubmit,
  stashItems,
}: {
  order: BulkOrderWithContributions;
  myUser: BulkDiscordUser | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: BulkContributeValues) => Promise<void>;
  // Whatever the order list's "Check my stash" scan already found, if any —
  // this dialog only reuses it, it never scans on its own.
  stashItems?: AggregatedStashItem[] | null;
}) => {
  const sum = sumOf(order);
  const remaining = Math.max(0, order.quantity - sum);

  const [quantity, setQuantity] = useState(1);
  const [delivery, setDelivery] = useState<'gstash' | 'dm'>('gstash');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reclampedHint, setReclampedHint] = useState(false);

  // If the live subscription shrinks `remaining` while this dialog is open
  // (someone else contributed first), re-clamp instead of letting the user
  // submit a now-invalid amount.
  useEffect(() => {
    setQuantity((q) => {
      if (q > remaining) {
        setReclampedHint(true);
        return remaining;
      }
      return q;
    });
  }, [remaining]);

  if (remaining <= 0) return null;

  const willComplete = quantity >= remaining;
  const previewOwner = order.user;
  const previewContributor: BulkDiscordUser = myUser ?? {
    id: '',
    poe_name: 'You',
  };

  const preview = willComplete
    ? buildBulkEmbed({
        type: 'completed',
        order,
        owner: previewOwner,
        finalContributor: previewContributor,
        contributionQty: quantity,
        contributors: [
          ...new Map(
            [...order.contributions.map((c) => c.user), previewContributor].map(
              (u) => [u.id, u],
            ),
          ).values(),
        ],
        delivery,
        note: note || undefined,
        origin: window.location.origin,
      })
    : buildBulkEmbed({
        type: 'contribution',
        order,
        owner: previewOwner,
        contributor: previewContributor,
        contributionQty: quantity,
        sumAfter: sum + quantity,
        delivery,
        note: note || undefined,
        origin: window.location.origin,
      });

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit({ quantity, delivery, note: note.trim() || undefined });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[36rem] max-w-[95vw]">
        <DialogHeading>Contribute to {order.item_name}</DialogHeading>
        <DialogDescription className="mb-2 max-w-md">
          {remaining.toLocaleString()} of {order.quantity.toLocaleString()}{' '}
          still needed.
        </DialogDescription>

        {reclampedHint && (
          <div className="mb-3 text-sm text-primary-500">
            Someone just contributed — the remaining amount updated.
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-primary-800" htmlFor="contribute-quantity">
              How much are you contributing?
            </label>
            <div className="flex items-center gap-2">
              <input
                id="contribute-quantity"
                type="number"
                min={1}
                max={remaining}
                autoFocus
                value={quantity}
                onChange={(e) =>
                  setQuantity(
                    Math.max(1, Math.min(remaining, Number(e.target.value) || 0)),
                  )
                }
                className="w-28 border border-primary-800 bg-gray-900 px-3 py-2 text-lg"
              />
              <button
                type="button"
                className="rounded bg-gray-800 px-3 py-1.5 text-sm text-primary-300 hover:bg-gray-700 disabled:opacity-30"
                disabled={remaining < 10}
                onClick={() => setQuantity((q) => Math.min(remaining, q + 10))}
              >
                +10
              </button>
              <button
                type="button"
                className="rounded bg-gray-800 px-3 py-1.5 text-sm text-primary-300 hover:bg-gray-700"
                onClick={() => setQuantity(Math.max(1, Math.ceil(remaining / 2)))}
              >
                Half
              </button>
              <button
                type="button"
                className="rounded bg-gray-800 px-3 py-1.5 text-sm text-primary-300 hover:bg-gray-700"
                onClick={() => setQuantity(remaining)}
              >
                All ({remaining})
              </button>
            </div>
            <StashQuickFill
              order={order}
              remaining={remaining}
              stashItems={stashItems}
              onQuantityFound={(found) => setQuantity(Math.max(1, found))}
            />
          </div>

          <div>
            <label className="mb-2 block cursor-pointer hover:text-primary-500">
              <input
                type="radio"
                checked={delivery === 'gstash'}
                onChange={() => setDelivery('gstash')}
              />
              <span className="ml-2">Guild Stash 1</span>
            </label>
            <label className="block cursor-pointer hover:text-primary-500">
              <input
                type="radio"
                checked={delivery === 'dm'}
                onChange={() => setDelivery('dm')}
              />
              <span className="ml-2">Direct Message</span>
            </label>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-primary-800" htmlFor="contribute-note">
              Note <span className="opacity-60">(optional, included in the Discord message)</span>
            </label>
            <input
              id="contribute-note"
              value={note}
              maxLength={NOTE_MAX_LENGTH}
              onChange={(e) => setNote(e.target.value)}
              className="border border-primary-800 bg-gray-900 px-3 py-2"
            />
            <span className="self-end text-xs text-primary-900">
              {note.length}/{NOTE_MAX_LENGTH}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-sm text-primary-800">
              This will be sent to Discord:
            </span>
            <DiscordPreview content={preview.content} embed={preview.embeds[0]} />
          </div>

          <div className="flex gap-3">
            <Button
              className={twMerge(
                'h-auto text-lg',
                willComplete && 'border-emerald-500 text-emerald-400',
              )}
              onClick={handleSubmit}
              disabled={submitting || quantity < 1}
              loading={submitting}
            >
              {willComplete ? '🎉 Complete the order' : 'Contribute'}
            </Button>
            <Button className="h-auto" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
