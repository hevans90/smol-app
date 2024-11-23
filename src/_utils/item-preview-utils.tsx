import type { CSSProperties, ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';
import type { GGGItemProperty, GGGItemRarity } from '../models/ggg-responses';

export const itemHeaderBg = (
  rarity: GGGItemRarity,
  height: 'single' | 'double' = 'single',
): CSSProperties => ({
  background: `
      url('/item-preview/${rarity}/header-${height === 'double' ? 'double-' : ''}${rarity}-left.png') 0 0 no-repeat,
      url('/item-preview/${rarity}/header-${height === 'double' ? 'double-' : ''}${rarity}-right.png') 100% 0 no-repeat,
      url('/item-preview/${rarity}/header-${height === 'double' ? 'double-' : ''}${rarity}-middle.png') top repeat-x
    `,
});

export const ItemSeparator = ({
  rarity,
  className,
}: {
  rarity: GGGItemRarity;
  className?: string;
}) => (
  <img
    className={twMerge('object-contain', className)}
    src={`/item-preview/${rarity}/separator-${rarity}.png`}
  />
);

export const itemHeaderFontColor = (rarity: GGGItemRarity) =>
  ({
    normal: 'text-white',
    magic: 'text-poeItem-magic',
    rare: 'text-poeItem-rare',
    unique: 'text-poeItem-unique',
    gem: 'text-poeItem-gem',
    currency: 'text-primary-600',
  })[rarity];

export const formatItemProperty = (input: GGGItemProperty) => {
  const { name, values } = input;

  const formattedString = name.replace(/{(\d+)}/g, (match, index) => {
    const valueIndex = parseInt(index, 10);
    return values[valueIndex] ? values[valueIndex][0] : match;
  });

  return formattedString;
};

export const StyledDefaultItemProperty = ({
  input,
}: {
  input: GGGItemProperty;
}) => {
  const { name, values } = input;

  const containsPlaceholders = name.includes('{');

  if (containsPlaceholders) {
    // Split the string into parts and handle placeholders
    const parts = name.split(/({\d+})/g).map((part, index) => {
      const match = part.match(/{(\d+)}/);
      if (match) {
        const valueIndex = parseInt(match[1], 10);
        const value = values[valueIndex]?.[0] ?? match[0]; // Fallback to the placeholder itself

        const valueStyle =
          values[valueIndex]?.[1] === 0 ? 'text-white' : 'text-poeItem-magic';
        return (
          <span
            key={index}
            className={twMerge('leading-[17.5px] text-white', valueStyle)}
          >
            {value}
          </span>
        );
      }
      return (
        <span key={index} className="text-poeItem-darkGrey leading-[17.5px]">
          {part}
        </span>
      );
    });

    return <div className="leading-[17.5px]">{parts}</div>;
  } else {
    let elements: ReactNode;

    if (values.length) {
      const displayValueColorMap: Record<number, string> = {
        0: 'text-white',
        1: 'text-poeItem-magic',
        4: 'text-poeItem-fire',
        5: 'text-poeItem-cold',
        6: 'text-poeItem-lightning',
      };

      elements = values.map((value, i) => (
        <span key={i} className={displayValueColorMap[value[1]]}>
          {value[0]}{' '}
        </span>
      ));
    }

    return (
      <span className="leading-[17.5px]">
        <span className="text-poeItem-darkGrey">{name}: </span>
        {elements}
      </span>
    );
  }
};
