import { useState } from 'react';
import { useFieldArray, useForm, type SubmitHandler } from 'react-hook-form';

import { IconTrash } from '@tabler/icons-react';
import {
  decodeAndParsePob,
  extractUniqueItemNamesFromPob,
} from '../../../_utils/pob-decode';
import { getUniqueItemWikiInfo, searchUniquesByNameOrBase } from '../../../_utils/utils';
import {
  Item_Order_Type_Enum,
  type UpdateUserItemOrderMutationVariables,
} from '../../../graphql-api';
import { OrderItemPopover } from '../item-hovers/OrderItemPopover';
import { Button } from '../ui/Button';
import { ItemIcon } from '../ui/ItemIcon';
import { Spinner } from '../ui/Spinner';
import { OrderSearchPicker, type PickedOrderItem } from './OrderSearchPicker';

export type OrderFormInputs = Pick<
  UpdateUserItemOrderMutationVariables,
  | 'description'
  | 'linkUrl'
  | 'type'
  | 'priority'
  | 'itemBaseType'
  | 'iconUrl'
  | 'itemCategory'
>;

export type PreviewRow = {
  kind: PickedOrderItem['kind'];
  type: Item_Order_Type_Enum;
  name: string;
  icon: string;
  id: string;
  description: string;
  priority: boolean;
  itemBaseType?: string;
  itemCategory?: string;
  linkUrl?: string;
};

type FormValues = OrderFormInputs & { previews: PreviewRow[] };

const KIND_TO_ENUM: Record<PickedOrderItem['kind'], Item_Order_Type_Enum> = {
  unique: Item_Order_Type_Enum.Unique,
  base: Item_Order_Type_Enum.Base,
  gem: Item_Order_Type_Enum.Gem,
  other: Item_Order_Type_Enum.Other,
};

function pickedOrderItemToPreviewRow(item: PickedOrderItem): PreviewRow {
  return {
    kind: item.kind,
    type: KIND_TO_ENUM[item.kind],
    name: item.name,
    icon: item.icon,
    id: item.id,
    description: item.name,
    priority: false,
    itemBaseType: item.itemBaseType,
    itemCategory: item.itemCategory,
    linkUrl: item.linkUrl,
  };
}

// Path of Building exports only ever reference uniques by name — resolves
// straight through searchUniquesByNameOrBase + getUniqueItemWikiInfo
// (matching the same resolution searchAllOrderItems does for its own
// unique results), rather than going through the general multi-kind search.
function uniqueNameToPickedItem(name: string, icon: string): PickedOrderItem {
  const wiki = getUniqueItemWikiInfo(name);
  return {
    kind: 'unique',
    name,
    icon,
    sublabel: 'Unique',
    itemBaseType: wiki?.baseItem,
    linkUrl: wiki?.wikiLink,
    id: `unique:${name}`,
  };
}

export const OrderForm = ({
  data,
  onSubmit,
  onBulkSubmit,
  allowPriority,
  quickOrdersAvailable = true,
  priorityOrderLimit = 2,
  existingPriorityCount = 0,
  isSubmitting = false,
}: {
  // Historically gated the Quick/Custom-order toggle; now this is the only
  // flow, so it just distinguishes the create-with-search-and-list form
  // (true) from the single-order edit form used by the Update dialog
  // (false) — an existing order's type/base item doesn't change on edit.
  quickOrdersAvailable?: boolean;
  data?: OrderFormInputs;
  onSubmit: SubmitHandler<OrderFormInputs>;
  onBulkSubmit?: (items: OrderFormInputs[]) => void | Promise<void>;
  allowPriority?: boolean;
  priorityOrderLimit?: number;
  existingPriorityCount?: number;
  isSubmitting?: boolean;
}) => {
  const {
    register,
    control,
    handleSubmit,
    getValues,
    watch,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      priority: data?.priority ?? false,
      description: data?.description ?? '',
      linkUrl: data?.linkUrl ?? '',
      type: data?.type,
      itemBaseType: data?.itemBaseType ?? '',
      itemCategory: data?.itemCategory ?? '',
      iconUrl: data?.iconUrl ?? '',
      previews: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'previews' });

  const [pobImporting, setPobImporting] = useState(false);
  const [pobError, setPobError] = useState<string | null>(null);
  const [pobImportResult, setPobImportResult] = useState<
    { name: string; icon: string }[] | null
  >(null);
  const [submitting, setSubmitting] = useState(false);

  const previews = watch('previews') ?? [];

  const remainingPrioritySlots = Math.max(
    0,
    priorityOrderLimit - existingPriorityCount,
  );
  const priorityCheckedInForm = previews.filter((p) => p.priority).length;
  const priorityLimitReached =
    remainingPrioritySlots <= 0 || priorityCheckedInForm >= remainingPrioritySlots;

  const addPreviewRow = (item: PickedOrderItem) => {
    const row = pickedOrderItemToPreviewRow(item);
    const existing = getValues('previews');
    if (existing.some((p) => p.kind === row.kind && p.name === row.name)) return;
    append(row);
  };

  const handlePoBImport = async (encoded: string) => {
    if (!encoded.trim()) return;
    setPobError(null);
    setPobImportResult(null);
    setPobImporting(true);
    try {
      const parsed = await decodeAndParsePob(encoded.trim());
      const names = extractUniqueItemNamesFromPob(parsed);
      const added: { name: string; icon: string }[] = [];
      for (const name of names) {
        const results = searchUniquesByNameOrBase(name, 1);
        const match = results[0];
        if (match) {
          addPreviewRow(uniqueNameToPickedItem(match.name, match.icon));
          added.push({ name: match.name, icon: match.icon });
        }
      }
      setPobImportResult(added);
    } catch (e) {
      console.error(e);
      setPobError('Failed to decode or parse Path of Building data.');
    } finally {
      setPobImporting(false);
    }
  };

  const handleFormSubmit = async (formData: FormValues) => {
    if (quickOrdersAvailable && onBulkSubmit) {
      const list = formData.previews ?? [];
      if (list.length === 0) {
        setError('root', { message: 'Add at least one item to the list.' });
        return;
      }
      if (priorityCheckedInForm > remainingPrioritySlots) {
        setError('root', {
          message: `You can mark at most ${remainingPrioritySlots} order(s) as priority.`,
        });
        return;
      }
      clearErrors('root');
      setSubmitting(true);
      try {
        const resolved: OrderFormInputs[] = list.map((row) => ({
          description: row.description || row.name,
          type: row.type,
          linkUrl: row.linkUrl ?? '',
          itemBaseType: row.itemBaseType ?? '',
          itemCategory: row.itemCategory ?? '',
          iconUrl: row.icon,
          priority: row.priority,
        }));
        await onBulkSubmit(resolved);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (quickOrdersAvailable && !onBulkSubmit) {
      return;
    }

    onSubmit(formData);
  };

  const createOrderPrioDisable = !data && !allowPriority;
  const updateOrderPrioDisable =
    data && !allowPriority && !getValues('priority');

  const isCreateWithBulk = !data && quickOrdersAvailable && !!onBulkSubmit;
  const submitDisabled =
    (isSubmitting || submitting) || (isCreateWithBulk && previews.length === 0);

  return (
    <form
      className={`relative flex flex-col gap-2 ${isCreateWithBulk ? 'w-full min-w-0 max-w-[48rem]' : 'min-w-72'}`}
      onSubmit={handleSubmit(handleFormSubmit)}
    >
      {quickOrdersAvailable ? (
        <div
          className={
            isCreateWithBulk
              ? 'grid min-h-[70vh] grid-cols-1 gap-4 md:grid-cols-2'
              : ''
          }
        >
          {/* Column 1: search + PoB import + submit at bottom */}
          <div className="flex flex-col gap-3">
            <OrderSearchPicker onSelect={addPreviewRow} />

            {isCreateWithBulk && (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-primary-500">
                    Path of Building code (encoded)
                  </label>
                  <textarea
                    id="pob-encoded-input"
                    placeholder="Paste encoded PoB export here, then click Import"
                    className="min-h-[80px] w-full resize-y border border-primary-800 bg-gray-900 p-2 text-sm"
                    disabled={pobImporting}
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById(
                        'pob-encoded-input',
                      ) as HTMLTextAreaElement | null;
                      if (el?.value) handlePoBImport(el.value);
                    }}
                    disabled={pobImporting}
                  >
                    {pobImporting ? (
                      <>
                        <Spinner />
                        Importing…
                      </>
                    ) : (
                      'Import from Path of Building'
                    )}
                  </Button>
                  {pobError && (
                    <span className="text-sm text-red-400">{pobError}</span>
                  )}
                  {pobImportResult && pobImportResult.length > 0 && (
                    <div className="rounded border border-primary-800 bg-gray-900/50 p-2">
                      <p className="mb-2 text-sm text-primary-500">
                        {pobImportResult.length} unique
                        {pobImportResult.length === 1 ? '' : 's'} added to
                        preview
                      </p>
                      <ul className="flex max-h-32 flex-col gap-1 overflow-y-auto">
                        {pobImportResult.map((item, i) => (
                          <li
                            key={`${item.name}-${i}`}
                            className="flex items-center gap-2 text-sm"
                          >
                            <img
                              className="h-6 w-6 shrink-0 object-contain"
                              src={item.icon}
                              alt=""
                            />
                            <span className="truncate text-primary-300">
                              {item.name}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="mt-auto flex flex-col gap-2">
                  {errors.root?.message && (
                    <span className="text-sm text-red-400">
                      {errors.root.message}
                    </span>
                  )}
                  <Button
                    className="flex h-12 w-full items-center justify-center gap-4 p-2 text-primary-500"
                    type="submit"
                    disabled={submitDisabled}
                  >
                    {isSubmitting || submitting ? (
                      <>
                        <Spinner />
                        Submitting…
                      </>
                    ) : previews.length > 0 ? (
                      `Submit ${previews.length} order(s)`
                    ) : (
                      'Submit'
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Column 2: item preview list (bulk only) */}
          {isCreateWithBulk && (
            <div className="flex min-h-[70vh] flex-col overflow-hidden rounded border border-primary-800">
              <div className="border-b border-primary-800 bg-gray-900/50 px-3 py-2">
                <p className="text-primary-500">
                  Order previews ({previews.length})
                </p>
                {remainingPrioritySlots > 0 && (
                  <p className="text-sm text-primary-700">
                    You can mark up to {remainingPrioritySlots} order(s) as
                    priority.
                  </p>
                )}
              </div>
              <ul className="flex max-h-[70vh] min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2">
                {fields.map((field, index) => (
                  <li
                    key={field.id}
                    className="flex items-center gap-2 rounded border border-primary-800/50 bg-gray-900/50 p-2"
                  >
                    <OrderItemPopover
                      order={{
                        type: previews[index]?.kind ?? 'unique',
                        description: previews[index]?.name ?? '',
                        item_base_type: previews[index]?.itemBaseType,
                        link_url: previews[index]?.linkUrl,
                      }}
                      placement="right"
                    >
                      <ItemIcon
                        className="h-10 w-10 shrink-0 object-contain"
                        src={previews[index]?.icon}
                      />
                    </OrderItemPopover>
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-primary-400">
                        {previews[index]?.name}
                      </span>
                      <input
                        className="mt-1 w-full border border-primary-800 bg-gray-800 text-sm"
                        placeholder="Description (optional)"
                        {...register(`previews.${index}.description`)}
                      />
                    </div>
                    <label className="flex shrink-0 items-center gap-1 text-sm text-primary-500">
                      <input
                        type="checkbox"
                        disabled={
                          priorityLimitReached && !previews[index]?.priority
                        }
                        {...register(`previews.${index}.priority`)}
                      />
                      Priority
                    </label>
                    <button
                      type="button"
                      className="rounded-full bg-primary-900 p-1 text-primary-500 opacity-80 hover:text-primary-300 hover:opacity-75"
                      onClick={() => remove(index)}
                      aria-label="Remove"
                    >
                      <IconTrash size={20} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        // Single-order edit form (Update dialog) — an existing order's
        // type/base item/category/icon don't change on edit, so those ride
        // through unchanged via useForm's defaultValues above; only
        // description/link/priority are user-editable here.
        <>
          <div className="mb-2 flex flex-col">
            <label className="mb-1">Description</label>
            <input
              className="w-64 max-w-lg sm:w-[50vw]"
              defaultValue={data?.description ?? ''}
              {...register('description', { required: true })}
            />
            {errors.description && (
              <span className="mt-1 text-red-400">
                Your order requires a description
              </span>
            )}
          </div>

          <div className="mb-2 flex flex-col">
            <div className="flex justify-between">
              <label className="mb-1">Wiki link (optional)</label>
            </div>
            <input defaultValue={data?.linkUrl ?? ''} {...register('linkUrl')} />
          </div>
        </>
      )}

      {!isCreateWithBulk && (
        <div className="mb-2 flex flex-col">
          <div className="flex items-center gap-4 text-primary-500">
            <p>Is this a priority order?</p>
            <input
              disabled={createOrderPrioDisable || updateOrderPrioDisable}
              type="checkbox"
              {...register('priority')}
            />
            {!allowPriority && (
              <p className="text-red-400">Priority order limit reached.</p>
            )}
          </div>

          <p className="text-primary-800">
            (non-priority orders will go inactive after 2 weeks of not being
            fulfilled)
          </p>
        </div>
      )}

      {!(quickOrdersAvailable && isCreateWithBulk) && (
        <Button
          className="flex h-12 w-full items-center justify-center gap-4 p-2 text-primary-500"
          type="submit"
          disabled={submitDisabled}
        >
          {isSubmitting || submitting ? (
            <>
              <Spinner />
              Submitting…
            </>
          ) : (
            'Submit'
          )}
        </Button>
      )}
    </form>
  );
};
