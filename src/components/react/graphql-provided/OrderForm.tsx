import { useEffect, useMemo, useRef, useState } from 'react';
import { useFieldArray, useForm, type SubmitHandler } from 'react-hook-form';

import { IconTrash } from '@tabler/icons-react';
import {
  decodeAndParsePob,
  extractUniqueItemNamesFromPob,
} from '../../../_utils/pob-decode';
import {
  getUniqueItemWikiInfo,
  searchUniquesByNameOrBase,
  type UniqueSearchResult,
} from '../../../_utils/utils';
import {
  Item_Order_Type_Enum,
  type OrderTypesQuery,
  type UpdateUserItemOrderMutationVariables,
} from '../../../graphql-api';
import type { BaseTypeCategory } from '../../../models/base-types';
import { Button } from '../ui/Button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/Popover';
import { Spinner } from '../ui/Spinner';
import { Toggle } from '../ui/Toggle';
import { BaseItemPicker } from './BaseItemPicker';

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
  name: string;
  icon: string;
  id: string;
  description: string;
  priority: boolean;
};

type FormValues = OrderFormInputs & { previews: PreviewRow[] };

function uniqueSearchResultToPreviewRow(r: UniqueSearchResult): PreviewRow {
  return {
    name: r.name,
    icon: r.icon,
    id: r.id,
    description: r.name,
    priority: false,
  };
}

export const OrderForm = ({
  orderTypes,
  data,
  onSubmit,
  onBulkSubmit,
  allowPriority,
  quickOrdersAvailable = true,
  priorityOrderLimit = 2,
  existingPriorityCount = 0,
  isSubmitting = false,
}: {
  quickOrdersAvailable?: boolean;
  orderTypes: OrderTypesQuery;
  data?: OrderFormInputs;
  onSubmit: SubmitHandler<OrderFormInputs>;
  onBulkSubmit?: (items: OrderFormInputs[]) => void | Promise<void>;
  allowPriority?: boolean;
  priorityOrderLimit?: number;
  existingPriorityCount?: number;
  isSubmitting?: boolean;
}) => {
  const {
    watch,
    register,
    control,
    handleSubmit,
    getValues,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      priority: data?.priority ?? false,
      previews: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'previews' });

  const [quickOrder, setQuickOrder] = useState(quickOrdersAvailable);

  const [quickSearchResults, setquickSearchResults] =
    useState<UniqueSearchResult[]>();

  const quickSearchInputRef = useRef<HTMLInputElement>(null);

  const [validatingItem, setValidatingItem] = useState(false);
  const [itemIsValid, setItemIsValid] = useState(false);
  const [pobImporting, setPobImporting] = useState(false);
  const [pobError, setPobError] = useState<string | null>(null);
  const [pobImportResult, setPobImportResult] = useState<
    { name: string; icon: string }[] | null
  >(null);
  const [submitting, setSubmitting] = useState(false);

  const type = useMemo(() => watch('type') ?? data?.type, [watch('type')]);
  const linkUrl = useMemo(
    () => watch('linkUrl') ?? data?.linkUrl,
    [watch('linkUrl')],
  );
  const previews = watch('previews') ?? [];

  const remainingPrioritySlots = Math.max(
    0,
    priorityOrderLimit - existingPriorityCount,
  );
  const priorityCheckedInForm = previews.filter((p) => p.priority).length;
  const priorityLimitReached =
    remainingPrioritySlots <= 0 || priorityCheckedInForm >= remainingPrioritySlots;

  // Persist quick/non-quick selection in localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('smol.quickOrder');
      if (saved !== null) {
        const savedValue = saved === 'true';
        setQuickOrder(quickOrdersAvailable ? savedValue : false);
      } else {
        setQuickOrder(!!quickOrdersAvailable);
      }
    } catch {}
  }, [quickOrdersAvailable]);

  useEffect(() => {
    try {
      localStorage.setItem('smol.quickOrder', String(quickOrder));
    } catch {}
  }, [quickOrder]);

  const validateWikiLink = (linkUrl?: string | null) =>
    !linkUrl || linkUrl?.startsWith('https://www.poewiki.net/');

  const getBaseItemInfoFromWikiLink = async () => {
    const valid = validateWikiLink(linkUrl);

    if (
      type === Item_Order_Type_Enum.Transfiguredgem ||
      type === Item_Order_Type_Enum.Other
    ) {
      return;
    }

    if (!valid) {
      setItemIsValid(valid);
      return;
    }

    const name = linkUrl?.split('/').pop();
    if (name) {
      setValidatingItem(true);
      try {
        const response = await fetch(
          `${window.location.origin}/api/get-item-info?name=${name}`,
        );
        const data = (await response.json()) as {
          baseItem: string;
          category: BaseTypeCategory;
          errorMessage?: string;
        };
        if (!response.ok) {
          throw new Error(data?.errorMessage);
        }
        if (data) {
          setValue('itemBaseType', data.baseItem);
          setValue('itemCategory', data.category);
          setValidatingItem(false);
          setItemIsValid(true);
        }
      } catch (e) {
        setValidatingItem(false);
        setItemIsValid(false);

        console.error(e);
      }
    }
  };

  useEffect(() => {
    if (linkUrl) {
      getBaseItemInfoFromWikiLink();
    } else {
      setItemIsValid(true);
    }
  }, [linkUrl]);

  const addPreviewRow = (row: PreviewRow) => {
    const existing = getValues('previews');
    if (existing.some((p) => p.name === row.name)) return;
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
          addPreviewRow(uniqueSearchResultToPreviewRow(match));
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
    if (quickOrder && onBulkSubmit) {
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
        const resolved: OrderFormInputs[] = [];
        for (const row of list) {
          const wikiResult = await getUniqueItemWikiInfo(row.name);
          resolved.push({
            description: row.description || row.name,
            linkUrl: wikiResult?.wikiLink ?? '',
            type: Item_Order_Type_Enum.Unique,
            priority: row.priority,
            itemBaseType: wikiResult?.baseItem ?? '',
            iconUrl: row.icon,
            itemCategory: '',
          });
        }
        await onBulkSubmit(resolved);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (quickOrder && !onBulkSubmit) {
      return;
    }

    onSubmit(formData);
  };

  const createOrderPrioDisable = !data && !allowPriority;
  const updateOrderPrioDisable =
    data && !allowPriority && !getValues('priority');

  const isCreateWithBulk = !data && quickOrder && !!onBulkSubmit;
  const submitDisabled =
    (isSubmitting || submitting) ||
    validatingItem ||
    (!validatingItem && !itemIsValid && !quickOrder) ||
    (isCreateWithBulk && previews.length === 0);

  return (
    <form
      className={`relative flex flex-col gap-2 ${quickOrder && isCreateWithBulk ? 'w-full min-w-0 max-w-[48rem]' : 'min-w-72'}`}
      onSubmit={handleSubmit(handleFormSubmit)}
    >
      <div className="absolute -top-9 right-0">
        <Toggle
          value={quickOrder}
          onChange={() => {
            setValue('description', null);
            if (!quickOrder) {
              quickSearchInputRef?.current?.focus();
            }
            setQuickOrder(!quickOrder);
          }}
          label={quickOrder ? 'Quick Order' : 'Custom Order'}
        />
      </div>

      {quickOrdersAvailable && quickOrder ? (
        <div
          className={
            isCreateWithBulk
              ? 'grid min-h-[70vh] grid-cols-1 gap-4 md:grid-cols-2'
              : ''
          }
        >
          {/* Column 1: inputs + submit at bottom */}
          <div className="flex flex-col gap-3">
            <Popover
              placement="bottom-start"
              open={!!quickSearchResults?.length}
            >
              <PopoverTrigger asChild>
                <input
                  placeholder="Search for unique items and add to list"
                  ref={quickSearchInputRef}
                  autoFocus
                  className="w-full border border-primary-800 bg-gray-900 px-3 py-2"
                  onChange={(e) =>
                    setquickSearchResults(
                      searchUniquesByNameOrBase(e.target.value),
                    )
                  }
                />
              </PopoverTrigger>

              <PopoverContent
                className="rounded-sm border-[1px] border-primary-800 bg-gray-900 outline-none focus:ring-0"
                initialFocusRef={quickSearchInputRef}
              >
                {quickSearchResults?.map((result) => (
                  <div
                    tabIndex={0}
                    role="button"
                    onClick={() => {
                      addPreviewRow(uniqueSearchResultToPreviewRow(result));
                      setquickSearchResults([]);
                      if (quickSearchInputRef.current)
                        quickSearchInputRef.current.value = '';
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        addPreviewRow(uniqueSearchResultToPreviewRow(result));
                        setquickSearchResults([]);
                        if (quickSearchInputRef.current)
                          quickSearchInputRef.current.value = '';
                      }
                    }}
                    key={result.id}
                    className="flex cursor-pointer items-center gap-2 p-2 hover:bg-gray-800 focus:bg-gray-700"
                  >
                    <img
                      className="h-10 w-10 object-contain"
                      src={result.icon}
                      alt=""
                    />
                    <span>{result.name}</span>
                  </div>
                ))}
              </PopoverContent>
            </Popover>

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
                    ) : validatingItem ? (
                      <>
                        Validating...
                        <Spinner />
                      </>
                    ) : itemIsValid || quickOrder ? (
                      previews.length > 0
                        ? `Submit ${previews.length} order(s)`
                        : 'Submit'
                    ) : (
                      <span className="text-red-500">Invalid Wiki link</span>
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
                    <img
                      className="h-10 w-10 shrink-0 object-contain"
                      src={previews[index]?.icon}
                      alt=""
                    />
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
            <label className="mb-1">Type</label>
            <div className="flex w-1/2 gap-2">
              <select
                value={type ?? ''}
                className="w-[15rem] grow"
                {...register('type', { required: true })}
              >
                <option value="">Select type</option>
                {orderTypes.item_order_type.map(({ value }) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
              {type ? (
                <img
                  className="h-10 w-10 p-1 md:h-12 md:w-12"
                  src={`/order-types/${type}.webp`}
                  alt=""
                />
              ) : (
                <div className="h-10 w-10 p-1 md:h-12 md:w-12" />
              )}
            </div>
            {errors.type && (
              <span className="mt-1 text-red-400">
                Your order requires a type
              </span>
            )}
          </div>

          {type === Item_Order_Type_Enum.Base ? (
            <BaseItemPicker
              value={
                data
                  ? {
                      name: data.itemBaseType as string,
                      category: data.itemCategory as string,
                      iconUrl: data.iconUrl as string,
                    }
                  : undefined
              }
              onBasePicked={({ name, iconUrl, category }) => {
                setValue('itemBaseType', name);
                setValue('iconUrl', iconUrl);
                setValue('itemCategory', category);
              }}
            />
          ) : null}

          <div className="mb-2 flex flex-col">
            <div className="flex justify-between">
              <label className="mb-1">Wiki link (optional)</label>
            </div>
            <input
              defaultValue={data?.linkUrl ?? ''}
              {...register('linkUrl', { validate: validateWikiLink })}
            />

            {errors.linkUrl && (
              <span className="mt-1 text-red-400">
                Links must begin with{' '}
                <span className="text-primary-500">https://poewiki.net</span>
              </span>
            )}
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

      {!(quickOrder && isCreateWithBulk) && (
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
          ) : validatingItem ? (
            <>
              Validating...
              <Spinner />
            </>
          ) : itemIsValid || quickOrder ? (
            'Submit'
          ) : (
            <span className="text-red-500">Invalid Wiki link</span>
          )}
        </Button>
      )}
    </form>
  );
};
