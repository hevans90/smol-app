import { useStore } from '@nanostores/react';
import {
  orderBookTypeFiltersStore
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
  const typeFilters = useStore(orderBookTypeFiltersStore);

  const typeMap: { [key in Item_Order_Type_Enum]: string } = {
    transfiguredgem: 'T Gems',
    unique: 'Uniques',
    other: 'Other',
    base: 'Bases',
  };

  return (
    <div className="flex grow gap-6 p-2 border-[1px] border-primary-900 rounded bg-gray-900">
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
    </div>
  );
};
