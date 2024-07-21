import { useEffect, useMemo, useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';

import {
  Item_Order_Type_Enum,
  type OrderTypesQuery,
  type UpdateUserItemOrderMutationVariables,
} from '../../../graphql-api';
import type { BaseTypeCategory } from '../../../models/base-types';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
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
}: {
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
        console.log(response);
        const data = (await response.json()) as {
          baseItem: string;
          category: BaseTypeCategory;
        };
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

  const createOrderPrioDisable = !data && !allowPriority;
  const updateOrderPrioDisable =
    data && !allowPriority && !getValues('priority');

  return (
    /* "handleSubmit" will validate your inputs before invoking "onSubmit" */
    <form className="flex flex-col gap-2" onSubmit={handleSubmit(onSubmit)}>
      {/* register your input into the hook by invoking the "register" function */}

      <div className="flex flex-col mb-2">
        <label className="mb-1">Description</label>
        <input
          className="w-64 sm:w-[50vw] max-w-lg"
          defaultValue={data?.description ?? ''}
          {...register('description', { required: true })}
        />
        {errors.description && (
          <span className="text-red-400 mt-1">
            Your order requires a description
          </span>
        )}
      </div>
      <div className="flex mb-2 flex-col">
        <div className="flex gap-4 text-primary-500 items-center">
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
      <div className="flex flex-col mb-2">
        <label className="mb-1">Type</label>
        <div className="flex w-1/2 gap-2">
          <select
            value={type ?? ''}
            className="grow w-[15rem]"
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
              className="w-10 h-10 md:w-12 md:h-12 p-1"
              src={`/order-types/${type}.webp`}
            />
          ) : (
            <div className="w-10 h-10 md:w-12 md:h-12 p-1"></div>
          )}
        </div>
        {errors.type && (
          <span className="text-red-400 mt-1">Your order requires a type</span>
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

      <div className="flex flex-col mb-2">
        <div className="flex justify-between">
          <label className="mb-1">Wiki link (optional)</label>

        </div>
        <input
          defaultValue={data?.linkUrl ?? ''}
          {...register('linkUrl', { validate: validateWikiLink })}
        />

        {errors.linkUrl && (
          <span className="text-red-400 mt-1">
            Links must begin with{' '}
            <span className="text-primary-500">https://poewiki.net</span>
          </span>
        )}
      </div>

      {/* errors will return when field validation fails  */}

      <Button
        className="text-primary-500 p-2 flex w-full items-center justify-center gap-4 h-12"
        type="submit"
        disabled={validatingItem || (!validatingItem && !itemIsValid)}
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
