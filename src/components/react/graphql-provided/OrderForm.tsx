import { SubmitHandler, useForm } from 'react-hook-form';
import type { UpdateUserItemOrderMutationVariables } from '../../../graphql-api';
import { Button } from '../ui/Button';

export type OrderFormInputs = Pick<
  UpdateUserItemOrderMutationVariables,
  'description' | 'linkUrl'
>;

export const OrderForm = ({
  data,

  onSubmit,
}: {
  data?: OrderFormInputs;
  onSubmit: SubmitHandler<OrderFormInputs>;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrderFormInputs>();

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
      <div className="flex flex-col mb-2">
        <label className="mb-1">Wiki link (optional)</label>
        <input defaultValue={data?.linkUrl ?? ''} {...register('linkUrl')} />
        {errors.description && <span>Your order requires a description.</span>}
      </div>
      {/* errors will return when field validation fails  */}

      <Button className="p-4" type="submit">
        Submit
      </Button>
    </form>
  );
};
