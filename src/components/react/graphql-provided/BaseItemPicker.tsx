import { useStore } from '@nanostores/react';
import { useMemo, useState } from 'react';
import { sortedBaseItemsStore } from '../../../_state/base-items';
import {
  BASE_TYPE_CATEGORIES,
  type BaseTypeCategory,
} from '../../../models/base-types';

export const BaseItemPicker = ({
  value,
  onBasePicked,
}: {
  value?: {
    name: string;
    category: string;
    iconUrl: string;
  };
  onBasePicked: (base: {
    name: string;
    category: string;
    iconUrl: string;
  }) => void;
}) => {
  const baseItems = useStore(sortedBaseItemsStore);

  const [category, setCategory] = useState<BaseTypeCategory | null>(
    value ? (value.category as BaseTypeCategory) : null,
  );
  const [base, setBase] = useState<{ name: string; iconUrl: string } | null>(
    value ? { name: value.name, iconUrl: value.iconUrl } : null,
  );

  const itemsForBaseType = useMemo(
    () => (baseItems && category ? baseItems[category] : null),
    [category],
  );

  return (
    <>
      <div className="flex flex-col mb-2 w-full">
        <label className="mb-1">Base Type</label>
        <div className="flex gap-2 w-full">
          <select
            value={category ?? ''}
            className="grow w-[10rem]"
            onChange={(e) => {
              setCategory(e.target.value as BaseTypeCategory);
              setBase(null);
            }}
          >
            <option value="">Category</option>
            {BASE_TYPE_CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          {category ? (
            <select
              value={base?.name ?? ''}
              className="grow w-[15rem]"
              onChange={(e) => {
                const name = e.target.value;
                const item = itemsForBaseType?.find((i) => i.Name === name);

                if (!item) {
                  setBase(null);
                  return;
                }

                if (item) {
                  setBase({ name: item.Name, iconUrl: item.IconPath });
                  onBasePicked({
                    name: item.Name,
                    iconUrl: item.IconPath,
                    category,
                  });
                } else {
                  console.error(`Could not find item: ${name}`);
                }
              }}
            >
              <option value="">Base</option>
              {itemsForBaseType?.map(({ Name: name }, i) => (
                <option key={`${name}_${i}`} value={name}>
                  {name}
                </option>
              ))}
            </select>
          ) : null}

          <div className="grow md:w-24 relative">
            {base ? (
              <img
                className="w-full h-40 -bottom-10 p-1 absolute object-contain"
                src={base.iconUrl}
              />
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
};
