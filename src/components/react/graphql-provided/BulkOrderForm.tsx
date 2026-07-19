import { useState } from 'react';
import { useMyHasuraUser } from '../../../hooks/useMyHasuraId';
import { Button } from '../ui/Button';
import type { BulkOrderWithContributions } from './BulkOrderCard';
import { StackableItemPicker, type PickedStackable } from './StackableItemPicker';

export type BulkOrderFormValues = {
  itemName: string;
  quantity: number;
  description?: string;
  iconUrl?: string;
};

const QUANTITY_CHIPS = [10, 100];

/**
 * Search-first bulk order creation/edit dialog content. Create mode is
 * built around one typing experience: search → select → quantity → submit.
 * Edit mode locks the item (immutable after creation) and only allows
 * changing quantity/description/link.
 */
export const BulkOrderForm = ({
  mode,
  order,
  contributedSum,
  onSubmit,
  onClose,
}: {
  mode: 'create' | 'edit';
  order?: BulkOrderWithContributions;
  contributedSum: number;
  onSubmit: (values: BulkOrderFormValues) => Promise<void>;
  onClose: () => void;
}) => {
  const { data: myUser } = useMyHasuraUser();

  const [selected, setSelected] = useState<PickedStackable | null>(
    order
      ? {
          kind: 'known',
          name: order.item_name,
          category: '',
          icon: order.icon_url ?? '',
        }
      : null,
  );
  const [quantity, setQuantity] = useState(order?.quantity ?? 1);
  const [description, setDescription] = useState(order?.description ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const minQuantity = mode === 'edit' ? Math.max(1, contributedSum) : 1;
  const canSubmit = !!selected?.name && quantity >= minQuantity && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !selected) return;
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        itemName: selected.name,
        quantity,
        description: description.trim() || undefined,
        iconUrl: selected.icon || undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {mode === 'create' && !selected && (
        <StackableItemPicker onSelect={setSelected} />
      )}

      {selected && (
        <div className="flex items-center gap-3 rounded-md border border-primary-800 bg-gray-800 bg-opacity-40 p-3">
          {selected.icon && (
            <img
              src={selected.icon}
              className="h-12 w-12 object-contain"
              alt=""
              onError={(e) => {
                // custom items guess a wiki icon URL that doesn't always
                // exist — hide it rather than show a broken image
                e.currentTarget.style.visibility = 'hidden';
              }}
            />
          )}
          <div className="grow">
            <div className="text-lg text-primary-300">{selected.name}</div>
            {selected.kind === 'known' && selected.category && (
              <div className="text-xs text-primary-800">{selected.category}</div>
            )}
            {selected.kind === 'custom' && (
              <div className="text-xs text-primary-800">Custom item</div>
            )}
          </div>
          {mode === 'create' && (
            <button
              type="button"
              className="text-primary-800 hover:text-red-400"
              onClick={() => setSelected(null)}
              title="Clear and search again"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {selected && (
        <div className="flex flex-col gap-1">
          <label className="text-sm text-primary-800" htmlFor="bulk-quantity">
            Quantity
          </label>
          <div className="flex items-center gap-2">
            <input
              id="bulk-quantity"
              type="number"
              min={minQuantity}
              autoFocus={mode === 'create'}
              value={quantity}
              onChange={(e) =>
                setQuantity(Math.max(minQuantity, Number(e.target.value) || 0))
              }
              className="w-32 border border-primary-800 bg-gray-900 px-3 py-2 text-lg"
            />
            {QUANTITY_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                className="rounded bg-gray-800 px-3 py-1.5 text-sm text-primary-300 hover:bg-gray-700"
                onClick={() => setQuantity((q) => q + chip)}
              >
                +{chip}
              </button>
            ))}
          </div>
          {mode === 'edit' && contributedSum > 0 && (
            <span className="text-xs text-primary-800">
              {contributedSum.toLocaleString()} already contributed — quantity
              can't go lower than that
            </span>
          )}
        </div>
      )}

      {selected && (
        <>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-primary-800" htmlFor="bulk-description">
              Description <span className="opacity-60">(optional)</span>
            </label>
            <textarea
              id="bulk-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="border border-primary-800 bg-gray-900 px-3 py-2"
            />
          </div>

          {!myUser?.discord_user_id && (
            <div className="rounded bg-gray-800 p-2 text-sm text-primary-800">
              You don't have Discord linked — you won't be pinged when people
              contribute to this order.
            </div>
          )}

          {error && <div className="text-sm text-red-400">{error}</div>}

          <div className="flex gap-3">
            <Button
              type="submit"
              className="h-auto text-lg"
              disabled={!canSubmit}
              loading={submitting}
            >
              {mode === 'edit' ? 'Save changes' : 'Create Bulk Order'}
            </Button>
            <Button type="button" className="h-auto" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </>
      )}
    </form>
  );
};
