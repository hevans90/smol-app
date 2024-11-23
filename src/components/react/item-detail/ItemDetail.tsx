import { twMerge } from 'tailwind-merge';
import {
  itemHeaderBg,
  itemHeaderFontColor,
  ItemSeparator,
  StyledDefaultItemProperty,
} from '../../../_utils/item-preview-utils';
import type { GGGItem } from '../../../models/ggg-responses';

export const ItemDetail = ({ item }: { item: GGGItem }) => {
  const rarity = item.rarity.toLowerCase() as any;

  const doubleHeader = rarity === 'unique' || rarity === 'rare';

  const headerBackground = itemHeaderBg(
    rarity,
    doubleHeader ? 'double' : 'single',
  );
  const headerFontColor = itemHeaderFontColor(rarity);

  return (
    <div className="font-fontinSmallcaps flex flex-col items-center bg-black pb-2 text-center">
      <div
        className={twMerge(
          'flex w-full flex-col items-center px-[1.875rem] text-[19px] text-primary-500 md:text-xl',
          headerFontColor,
          doubleHeader ? 'h-[3.75rem]' : 'h-10 pt-0.5',
        )}
        style={headerBackground}
      >
        <span className="leading-7">
          {item.name?.length ? item.name : item.typeLine}
        </span>
        {doubleHeader && item.baseType && (
          <span className="leading-none">{item.baseType}</span>
        )}
      </div>

      {item.properties?.length && (
        <div className="flex flex-col items-center text-[15px]">
          {item.properties.map((property) => (
            <StyledDefaultItemProperty key={property.name} input={property} />
          ))}
          <ItemSeparator rarity={rarity} className="my-[1px]" />
        </div>
      )}

      {item.enchantMods?.length && (
        <div className="text-poeItem-enchant flex flex-col items-center text-[15px] leading-[18px]">
          {item.enchantMods.map((enchant) => (
            <span key={enchant} className="mx-2">
              {enchant}
            </span>
          ))}
          <ItemSeparator rarity={rarity} className="my-0.5" />
        </div>
      )}
      {item.implicitMods?.length && (
        <div className="text-poeItem-magic flex flex-col items-center text-[15px] leading-[18px]">
          {item.implicitMods.map((implicit, i) => (
            <span key={i} className="mx-2">
              {implicit}
            </span>
          ))}
          <ItemSeparator rarity={rarity} className="my-0.5" />
        </div>
      )}
      {item.explicitMods?.length && (
        <div className="text-poeItem-magic flex flex-col text-[15px] leading-[18px]">
          {item.explicitMods.map((mod) => (
            <span key={mod} className="mx-2">
              {mod}
            </span>
          ))}
        </div>
      )}
      {item.corrupted && (
        <div className="text-poeItem-corrupted flex flex-col text-[15px] leading-[18px]">
          <ItemSeparator rarity={rarity} className="my-0.5" />
          <span className="mx-2">Corrupted</span>
          <ItemSeparator rarity={rarity} className="my-0.5" />
        </div>
      )}
    </div>
  );
};
