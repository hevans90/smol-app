import { twMerge } from 'tailwind-merge';
import type { GGGItem, GGGSocketedItem } from '../../../models/ggg-responses';
import { ItemDetail } from '../item-hovers/ItemDetail';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/Popover';

const getGemBorderColor = (colour: string | undefined): string => {
  switch (colour) {
    case 'S':
      return 'border-red-500';
    case 'D':
      return 'border-green-500';
    case 'I':
      return 'border-blue-500';
    default:
      return 'border-gray-400';
  }
};

const getNameColor = (frameType: number): string => {
  switch (frameType) {
    case 3:
      return 'text-amber-500'; // Unique
    case 4:
      return 'text-cyan-400'; // Gem
    default:
      return 'text-gray-200';
  }
};

// Sockets carry a `group` index — gems whose sockets share a group are
// actually linked in-game. Splitting by group (rather than treating every
// socketed gem as one long chain) keeps e.g. a 3+3 split six-socket item
// visually honest instead of implying a fake 6-link.
const groupGemsByLink = (item: GGGItem): GGGSocketedItem[][] => {
  const groups = new Map<number, GGGSocketedItem[]>();

  (item.socketedItems ?? []).forEach((gem) => {
    const socketIndex = gem.socket ?? 0;
    const groupId = item.sockets?.[socketIndex]?.group ?? 0;
    const list = groups.get(groupId) ?? [];
    list.push(gem);
    groups.set(groupId, list);
  });

  // Supports last within each link, matching the item's own socket order.
  return Array.from(groups.values()).map((gems) =>
    gems
      .slice()
      .sort((a, b) => (a.support ? 1 : 0) - (b.support ? 1 : 0)),
  );
};

const GemIcon = ({ gem }: { gem: GGGSocketedItem }) => (
  <Popover openOnHover={true} placement="top">
    <PopoverTrigger asChild>
      <div
        className={twMerge(
          'relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md border-2 bg-gray-800',
          getGemBorderColor(gem.colour),
        )}
      >
        <img
          src={gem.icon}
          alt={gem.typeLine}
          className="h-full w-full object-contain"
        />
      </div>
    </PopoverTrigger>
    <PopoverContent className="outline-none focus:ring-0" style={{ zIndex: 200 }}>
      <ItemDetail item={gem} />
    </PopoverContent>
  </Popover>
);

// A single link group renders as a horizontal chain — a short bar between
// each adjacent pair of gems stands in for the in-game link line, so it's
// visually obvious which gems are actually linked together (as opposed to
// merely occupying different, unlinked sockets on the same item).
const LinkGroup = ({ gems }: { gems: GGGSocketedItem[] }) => (
  <div className="flex items-center">
    {gems.map((gem, index) => (
      <div key={gem.id} className="flex items-center">
        {index > 0 && <div className="h-1 w-2.5 shrink-0 bg-primary-600" />}
        <GemIcon gem={gem} />
      </div>
    ))}
  </div>
);

const ItemGemSection = ({
  item,
  highlighted,
}: {
  item: GGGItem;
  highlighted: boolean;
}) => {
  const linkGroups = groupGemsByLink(item);

  return (
    <div
      className={twMerge(
        // A real `border` (not `ring`, which paints as a box-shadow outside
        // the border-box) — the panel scrolls with `overflow-y-auto`, which
        // forces `overflow-x` to compute as `auto` too, clipping anything
        // painted outside the box on the left edge. A border is part of the
        // box itself so it can't be clipped that way. Transparent by default
        // to reserve the space and avoid a 1px layout shift on highlight.
        'flex flex-col gap-2 rounded-md border p-2 transition-colors duration-200',
        highlighted
          ? 'border-primary-500 bg-primary-900/40'
          : 'border-transparent',
      )}
    >
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded bg-gray-800">
          <img
            src={item.icon}
            alt={item.name || item.typeLine}
            className="h-full w-full object-contain"
          />
        </div>
        <div
          className={twMerge(
            'truncate text-sm font-bold',
            getNameColor(item.frameType),
          )}
        >
          {item.name || item.typeLine}
        </div>
      </div>

      <div className="flex flex-row flex-wrap gap-x-4 gap-y-2">
        {linkGroups.map((gems, index) => (
          <LinkGroup key={index} gems={gems} />
        ))}
      </div>
    </div>
  );
};

// GGG returns weapon-swap items with these inventoryIds — they're not
// currently equipped (CharacterInventory's doll grid doesn't show them
// either), so they shouldn't get a row here.
const WEAPON_SWAP_INVENTORY_IDS = new Set(['weapon2', 'offhand2']);

// Always-visible list of every equipped item's gems and links — no hover
// required to see it, and no single "selected" item replacing the rest.
// Hovering a doll-grid slot (CharacterInventory) just highlights the
// matching section here via `highlightedItemId`.
export const GemLinksPanel = ({
  items,
  highlightedItemId,
  className,
}: {
  items: GGGItem[];
  highlightedItemId?: string | null;
  className?: string;
}) => {
  const itemsWithGems = items.filter(
    (item) =>
      (item.socketedItems?.length ?? 0) > 0 &&
      !WEAPON_SWAP_INVENTORY_IDS.has(item.inventoryId.toLowerCase()),
  );

  if (itemsWithGems.length === 0) return null;

  return (
    <div className={twMerge('flex flex-col gap-3', className)}>
      {itemsWithGems.map((item) => (
        <ItemGemSection
          key={item.id}
          item={item}
          highlighted={item.id === highlightedItemId}
        />
      ))}
    </div>
  );
};
