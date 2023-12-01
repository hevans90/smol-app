import { useStore } from '@nanostores/react';
import {
  orderBookShowFulfilledStore,
  orderBookShowInactiveStore,
  orderBookTypeFiltersStore,
} from '../../../_state/order-book';
import type {
  Item_Order_Type_Enum,
  OrderTypesQuery,
} from '../../../graphql-api';
import { Toggle } from '../ui/Toggle';

export const OrderBookFilters = ({
  orderTypes,
}: {
  orderTypes: OrderTypesQuery;
}) => {
  const showInactive = useStore(orderBookShowInactiveStore);
  const showFulfilled = useStore(orderBookShowFulfilledStore);

  const typeFilters = useStore(orderBookTypeFiltersStore);

  const typeMap: { [key in Item_Order_Type_Enum]: string } = {
    transfiguredgem: 'Transfigured Gems',
    unique: 'Uniques',
    other: 'Other',
  };

  return (
    <div className="flex grow gap-6 p-2 border-[1px] border-primary-900 rounded bg-gray-900">
      <Toggle
        value={showFulfilled}
        onChange={() => orderBookShowFulfilledStore.set(!showFulfilled)}
        label="Fulfilled orders"
      />
      {orderTypes.item_order_type.map(({ value }, i) => (
        <div key={i} className="flex gap-2">
          <img
            className="w-10 h-10 md:w-12 md:h-12 p-1"
            src={`/order-types/${value}.webp`}
          />
          <Toggle
            value={typeFilters?.[value as Item_Order_Type_Enum]}
            onChange={() =>
              orderBookTypeFiltersStore.set({
                ...typeFilters,
                [value]: !typeFilters?.[value as Item_Order_Type_Enum],
              })
            }
            label={typeMap[value as Item_Order_Type_Enum]}
          />
        </div>
      ))}
      <Toggle
        value={showInactive}
        onChange={() => orderBookShowInactiveStore.set(!showInactive)}
        label="Inactive (> 1 week)"
      />
    </div>
  );
};
