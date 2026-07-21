import { Fragment } from 'react';
import { twMerge } from 'tailwind-merge';
import {
  getItemInfluenceIcons,
  itemHeaderBg,
  itemHeaderFontColor,
  ItemSeparator,
  StyledDefaultItemProperty,
} from '../../../_utils/item-preview-utils';
import type {
  GGGItem,
  GGGItemRarity,
  GGGSocketedItem,
} from '../../../models/ggg-responses';

export const ItemDetail = ({ item }: { item: GGGItem | GGGSocketedItem }) => {
  const rarity = (item?.rarity?.toLowerCase() as GGGItemRarity) ?? 'gem';

  const doubleHeader = rarity === 'unique' || rarity === 'rare';

  const headerBackground = itemHeaderBg(
    rarity,
    doubleHeader ? 'double' : 'single',
  );
  const headerFontColor = itemHeaderFontColor(rarity);

  // A single influence mirrors the same icon on both sides of the header;
  // two influences show one icon per side. Pinned to the header's own left
  // and right edges (not next to the name) — the name stays centered in
  // the header regardless of whether icons are present, matching the game.
  const influenceIcons = getItemInfluenceIcons(item);
  const leftInfluence = influenceIcons[0];
  const rightInfluence =
    influenceIcons.length === 1 ? influenceIcons[0] : influenceIcons[1];

  return (
    <div className="flex flex-col items-center bg-black pb-2 text-center font-fontinSmallcaps">
      <div
        className={twMerge(
          'relative flex w-full flex-col items-center px-[1.875rem] text-[19px] text-primary-500 md:text-xl',
          headerFontColor,
          doubleHeader ? 'h-[3.75rem]' : 'h-10 pt-0.5',
        )}
        style={headerBackground}
      >
        {leftInfluence && (
          <img
            src={leftInfluence}
            alt=""
            className="absolute left-1 top-1/2 h-8 w-8 -translate-y-1/2"
          />
        )}
        <span className="leading-7">
          {item.name?.length ? item.name : item.typeLine}
        </span>
        {rightInfluence && (
          <img
            src={rightInfluence}
            alt=""
            className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
          />
        )}
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
        <div className="flex flex-col items-center text-[15px] leading-[18px] text-poeItem-enchant">
          {item.enchantMods.map((enchant) => (
            <span key={enchant} className="mx-2">
              {enchant}
            </span>
          ))}
          <ItemSeparator rarity={rarity} className="my-0.5" />
        </div>
      )}
      {item.implicitMods?.length && (
        <div className="flex flex-col items-center text-[15px] leading-[18px] text-poeItem-magic">
          {item.implicitMods.map((implicit, i) => (
            <span key={i} className="mx-2">
              {implicit}
            </span>
          ))}
          <ItemSeparator rarity={rarity} className="my-0.5" />
        </div>
      )}
      {item.fracturedMods?.length && (
        <div className="flex flex-col text-[15px] leading-[18px] text-primary-800">
          {item.fracturedMods.map((mod) => (
            <span key={mod} className="mx-2">
              {mod}
            </span>
          ))}
        </div>
      )}
      {item.explicitMods?.length && (
        <div className="flex flex-col text-[15px] leading-[18px] text-poeItem-magic">
          {item.explicitMods.map((mod) => (
            <span key={mod} className="mx-2">
              {' '}
              {mod.split('\n').map((line, index) => (
                <Fragment key={index}>
                  {line}
                  <br />
                </Fragment>
              ))}
            </span>
          ))}
        </div>
      )}
      {item.craftedMods?.length && (
        <div className="flex flex-col text-[15px] leading-[18px] text-poeItem-enchant">
          {item.craftedMods.map((mod) => (
            <span key={mod} className="mx-2">
              {mod}
            </span>
          ))}
        </div>
      )}
      {item.corrupted && (
        <div className="flex flex-col text-[15px] leading-[18px] text-poeItem-corrupted">
          <ItemSeparator rarity={rarity} className="my-0.5" />
          <span className="mx-2">Corrupted</span>
          <ItemSeparator rarity={rarity} className="my-0.5" />
        </div>
      )}
    </div>
  );
};
