import { useMemo } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import type {
  OrderTypesQuery,
  UpdateUserItemOrderMutationVariables,
} from '../../../graphql-api';
import { Button } from '../ui/Button';

export type OrderFormInputs = Pick<
  UpdateUserItemOrderMutationVariables,
  'description' | 'linkUrl' | 'type' | 'priority'
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
    formState: { errors },
  } = useForm<OrderFormInputs>({ defaultValues: { priority: data?.priority } });

  const type = useMemo(() => watch('type') ?? data?.type, [watch('type')]);

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
      </div>
      <div className="flex mb-2 flex-col">
        <div className="flex gap-4 text-primary-500 items-center">
          <p>Is this a priority order?</p>
          <input
            disabled={!allowPriority}
            type="checkbox"
            {...register('priority')}
          />
          {!allowPriority && (
            <p className="text-red-400">Priority order limit reached.</p>
          )}
        </div>
        {allowPriority ? (
          <p className="text-primary-800">
            (non-priority orders will go inactive after a week of not being
            fulfilled)
          </p>
        ) : null}
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
          <span className="text-red-400">Your order requires a type.</span>
        )}
      </div>
      <div className="flex flex-col mb-2">
        <label className="mb-1">Wiki link (optional)</label>
        <input defaultValue={data?.linkUrl ?? ''} {...register('linkUrl')} />
        {errors.description && (
          <span className="text-red-400">
            Your order requires a description.
          </span>
        )}
      </div>
      {/* errors will return when field validation fails  */}

      <Button className="p-4" type="submit">
        Submit
      </Button>
    </form>
  );
};
