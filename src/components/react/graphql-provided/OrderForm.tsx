import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';

import { IconTrash } from '@tabler/icons-react';
import {
  getUniqueItemWikiLink,
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

export const OrderForm = ({
  orderTypes,
  data,
  onSubmit,
  allowPriority,
  quickOrdersAvailable = true,
}: {
  quickOrdersAvailable?: boolean;
  orderTypes: OrderTypesQuery;
  data?: OrderFormInputs;
  onSubmit: SubmitHandler<OrderFormInputs>;
  allowPriority?: boolean;
}) => {
  const {
    watch,
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<OrderFormInputs>({
    defaultValues: { priority: data?.priority ?? false },
  });

  const [quickOrder, setQuickOrder] = useState(quickOrdersAvailable);

  const [quickSearchResults, setquickSearchResults] =
    useState<UniqueSearchResult[]>();

  const quickSearchInputRef = useRef<HTMLInputElement>(null);

  const [selectedQuickOrderResult, setSelectedQuickOrderResult] =
    useState<UniqueSearchResult | null>(null);

  const [validatingItem, setValidatingItem] = useState(false);
  const [itemIsValid, setItemIsValid] = useState(false);

  const type = useMemo(() => watch('type') ?? data?.type, [watch('type')]);
  const linkUrl = useMemo(
    () => watch('linkUrl') ?? data?.linkUrl,
    [watch('linkUrl')],
  );

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

  const handleFormSubmit = async (formData: OrderFormInputs) => {
    if (quickOrder) {
      if (!selectedQuickOrderResult) {
        // no item selected in quick order, do nothing or show error
        return;
      }

      const wikiLink = await getUniqueItemWikiLink(
        selectedQuickOrderResult.name,
      );

      // create data object from selected quick order result
      const quickOrderData: OrderFormInputs = {
        description: selectedQuickOrderResult.name,
        linkUrl: wikiLink,
        type: Item_Order_Type_Enum.Unique, // assuming quick order items are unique type
        priority: formData.priority ?? false,
        itemBaseType: '', // fill if applicable or leave blank
        iconUrl: selectedQuickOrderResult.icon,
        itemCategory: '', // if you have category info, add it here
      };

      onSubmit(quickOrderData);
    } else {
      // use react-hook-form's default onSubmit handler
      onSubmit(formData);
    }
  };

  const createOrderPrioDisable = !data && !allowPriority;
  const updateOrderPrioDisable =
    data && !allowPriority && !getValues('priority');

  return (
    /* "handleSubmit" will validate your inputs before invoking "onSubmit" */
    <form
      className="min-w-72 relative flex flex-col gap-2"
      onSubmit={handleSubmit(handleFormSubmit)}
    >
      <div className="absolute -top-9 right-0">
        <Toggle
          value={quickOrder}
          onChange={() => {
            if (!quickOrder) {
              quickSearchInputRef?.current?.focus();
            }
            setQuickOrder(!quickOrder);
          }}
          label={quickOrder ? 'Quick Order' : 'Custom Order'}
        />
      </div>

      {quickOrdersAvailable && quickOrder ? (
        <>
          {!selectedQuickOrderResult && (
            <Popover
              placement="bottom-start"
              open={!!quickSearchResults?.length && !selectedQuickOrderResult}
            >
              <PopoverTrigger asChild>
                <input
                  placeholder="search for unique items"
                  ref={quickSearchInputRef}
                  autoFocus
                  className="my-2 w-64 max-w-lg sm:w-[50vw]"
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
                    onClick={() => {
                      setSelectedQuickOrderResult(result);
                      setquickSearchResults([]);
                    }}
                    key={result.id}
                    className="flex cursor-pointer items-center gap-2 p-2 hover:bg-gray-800 focus:bg-gray-700"
                  >
                    <img
                      className="h-10 w-10 object-contain"
                      src={result.icon}
                    />
                    <span>{result.name}</span>
                  </div>
                ))}
              </PopoverContent>
            </Popover>
          )}

          {selectedQuickOrderResult && (
            <div className="flex items-center justify-between gap-2 rounded border-[1px] border-primary-800 py-2">
              <div className="flex items-center gap-2">
                <img
                  className="mx-2 h-12 w-12 object-contain"
                  src={selectedQuickOrderResult.icon}
                />
                <span className="text-xl text-primary-400">
                  {selectedQuickOrderResult.name}
                </span>
              </div>

              <button
                className="mx-6 rounded-full bg-primary-900 p-1 text-primary-500 opacity-80 hover:text-primary-300 hover:opacity-75"
                onClick={() => {
                  setSelectedQuickOrderResult(null);
                }}
              >
                <IconTrash size={30} />
              </button>
            </div>
          )}
        </>
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
                />
              ) : (
                <div className="h-10 w-10 p-1 md:h-12 md:w-12"></div>
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

      <Button
        className="flex h-12 w-full items-center justify-center gap-4 p-2 text-primary-500"
        type="submit"
        disabled={
          validatingItem ||
          (!validatingItem && !itemIsValid) ||
          (quickOrder && !selectedQuickOrderResult)
        }
      >
        {validatingItem ? (
          <>
            Validating...
            <Spinner />
          </>
        ) : itemIsValid ? (
          'Submit'
        ) : (
          <span className="text-red-500">Invalid Wiki link</span>
        )}
      </Button>
    </form>
  );
};
