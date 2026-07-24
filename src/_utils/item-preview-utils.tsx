import type { CSSProperties, ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';
import {
  INFLUENCE_ORDER,
  type GGGItem,
  type GGGItemProperty,
  type GGGItemRarity,
  type GGGItemRequirement,
  type GGGSocketedItem,
} from '../models/ggg-responses';

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

// An item can have at most two influences at once. Returns their icon URLs
// in a stable order so the first renders left-of-name and the second
// right-of-name, matching the game's own tooltip layout. Checks both the
// flat legacy fields (shaper/elder) and the nested `influences` object (the
// four Conquerors-of-the-Atlas influences, which never got flat fields) —
// see the comment on GGGItem for why both need checking.
export const getItemInfluenceIcons = (
  item: GGGItem | GGGSocketedItem,
): string[] => {
  const flatFields = item as unknown as Record<string, boolean | undefined>;

  return INFLUENCE_ORDER.filter(
    (influence) => item.influences?.[influence] || flatFields[influence],
  ).map((influence) => `/item-preview/influences/${influence}-symbol.png`);
};

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

// Marks the Foulborn portion of an annotated mod line (see
// annotateFoulbornReplacements in src/_utils/utils.ts) for distinct-colour
// rendering — control characters, so guaranteed never to collide with real
// mod text. renderModLine below is what actually splits on these.
export const FOULBORN_MARK_START = '\u0001';
export const FOULBORN_MARK_END = '\u0002';

// Renders a single mod line, colouring any Foulborn-marked portion (see
// FOULBORN_MARK_START/END) in poeItem-foulborn instead of the surrounding
// line's own colour. Lines without a marker render unchanged.
export const renderModLine = (line: string): ReactNode => {
  if (!line.includes(FOULBORN_MARK_START)) return line;

  const [before, rest] = line.split(FOULBORN_MARK_START);
  const [marked, after] = rest.split(FOULBORN_MARK_END);
  return (
    <>
      {before}
      <span className="text-poeItem-foulborn">{marked}</span>
      {after}
    </>
  );
};

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
    // A property with no values (e.g. a gem's own tag string, "Fire,
    // Support") is a plain standalone line in the real game's tooltip — no
    // trailing "name: " label, just the text itself.
    if (!values.length) {
      return (
        <span className="leading-[17.5px] text-poeItem-darkGrey">{name}</span>
      );
    }

    const displayValueColorMap: Record<number, string> = {
      0: 'text-white',
      1: 'text-poeItem-magic',
      4: 'text-poeItem-fire',
      5: 'text-poeItem-cold',
      6: 'text-poeItem-lightning',
    };

    const elements = values.map((value, i) => (
      <span key={i} className={displayValueColorMap[value[1]]}>
        {value[0]}{' '}
      </span>
    ));

    return (
      <span className="leading-[17.5px]">
        <span className="text-poeItem-darkGrey">{name}: </span>
        {elements}
      </span>
    );
  }
};

// Real gem tooltips show all requirement attributes as one combined line —
// "Requires Level X, Y Str, Z Dex, W Int" — rather than each on its own row
// the way `properties` render. `values[0][0]` is used since requirements
// only ever carry a single value per attribute (no {0}/{1} placeholder
// formatting like some properties use).
export const formatRequirementsLine = (
  requirements: GGGItemRequirement[],
): string => {
  const parts = requirements
    .map((req) => {
      const value = req.values[0]?.[0];
      if (!value) return null;
      return req.name === 'Level' ? `Level ${value}` : `${value} ${req.name}`;
    })
    .filter((part): part is string => !!part);
  return parts.length ? `Requires ${parts.join(', ')}` : '';
};
