import { useCallback, useMemo } from 'react';
import { twMerge } from 'tailwind-merge';
import type { GGGInventoryId, GGGItem } from '../../../models/ggg-responses';
import { ItemDetail } from '../item-hovers/ItemDetail';
import { ItemPopover } from '../item-hovers/ItemPopover';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/Popover';

// Named grid areas reproduce the equipment "paper doll" shape without any
// absolute positioning — every named area below is a valid CSS grid
// rectangle. `ring3` (the third-ring ruleset, e.g. "Nameless bloodline")
// sits directly above the first ring slot; its cell is simply empty for
// the common two-ring case.
const DOLL_GRID_TEMPLATE_AREAS = `
  "weapon .      helm    .       offhand"
  "weapon ring3  body    amulet  offhand"
  "weapon ring   body    ring2   offhand"
  "trinket gloves .      boots   ."
  ".      .      belt    .       ."
`;

type DollSlot = {
  id: GGGInventoryId;
  area: string;
  // Slot box sizes stay fixed (matching the original absolutely-positioned
  // sizes) — only their arrangement is now grid-driven.
  size: string;
};

const DOLL_SLOTS: DollSlot[] = [
  { id: 'Weapon', area: 'weapon', size: 'w-24 h-[14.5rem]' },
  { id: 'Offhand', area: 'offhand', size: 'w-24 h-[14.5rem]' },
  { id: 'Helm', area: 'helm', size: 'w-24 h-24' },
  { id: 'Amulet', area: 'amulet', size: 'w-12 h-12' },
  { id: 'BodyArmour', area: 'body', size: 'w-24 h-40' },
  { id: 'Ring3', area: 'ring3', size: 'w-12 h-12' },
  { id: 'Ring', area: 'ring', size: 'w-12 h-12' },
  { id: 'Ring2', area: 'ring2', size: 'w-12 h-12' },
  { id: 'Trinket', area: 'trinket', size: 'w-12 h-12' },
  { id: 'Gloves', area: 'gloves', size: 'w-24 h-24' },
  { id: 'Boots', area: 'boots', size: 'w-24 h-24' },
  { id: 'Belt', area: 'belt', size: 'w-24 h-14' },
];

export const CharacterInventory = ({
  items,
  passiveTreeItems,
  className,
  onItemHovered,
}: {
  items: GGGItem[];
  passiveTreeItems: GGGItem[];
  className?: string;
  onItemHovered: (itemId: string) => void;
}) => {
  const getItemById = useCallback(
    (id: string) =>
      items.find((item) => item.inventoryId.toLowerCase() === id.toLowerCase()),
    [items],
  );

  const getItemsById = (id: string) =>
    items.filter((item) => item.inventoryId.toLowerCase() === id.toLowerCase());

  const potions = getItemsById('flask').sort((a, b) => a.x - b.x);

  const slotsWithItems = useMemo(
    () =>
      DOLL_SLOTS.map((slot) => ({ slot, item: getItemById(slot.id) ?? null })),
    [getItemById],
  );

  return (
    <div className={twMerge('flex w-full flex-col items-center gap-3', className)}>
      {/* Doll grid — md and up. Fixed-size slot boxes ("auto" tracks size to
          fit them), arranged purely via named grid areas instead of
          hand-tuned absolute offsets. */}
      <div
        className="hidden gap-2 md:grid md:place-items-center"
        style={{
          gridTemplateAreas: DOLL_GRID_TEMPLATE_AREAS,
          gridTemplateColumns: 'repeat(5, auto)',
          gridTemplateRows: 'repeat(5, auto)',
        }}
      >
        {slotsWithItems.map(
          ({ slot, item }) =>
            item && (
              <div
                key={slot.id}
                style={{ gridArea: slot.area }}
                className={slot.size}
              >
                <ItemPopover item={item} onItemHovered={onItemHovered} />
              </div>
            ),
        )}
      </div>

      {/* Simplified list — below md. No spatial doll shape needed at this
          size; every slot renders as an equal-sized grid cell. */}
      <div className="grid w-full grid-cols-4 gap-2 md:hidden">
        {slotsWithItems.map(
          ({ slot, item }) =>
            item && (
              <div key={slot.id} className="aspect-square w-full">
                <ItemPopover item={item} onItemHovered={onItemHovered} />
              </div>
            ),
        )}
      </div>

      {/* potions — normal flow, wraps instead of a fixed absolute offset */}
      {potions.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {potions.map((potion) => (
            <Popover key={potion.id} openOnHover={true}>
              <PopoverTrigger asChild>
                <div
                  onMouseEnter={() => onItemHovered(potion.id)}
                  className="flex h-24 w-14 items-center justify-center rounded-md bg-gray-950"
                >
                  <img src={potion.icon} />
                </div>
              </PopoverTrigger>
              <PopoverContent className="outline-none focus:ring-0">
                <ItemDetail item={potion} />
              </PopoverContent>
            </Popover>
          ))}
        </div>
      )}

      {/* jewels — normal flow, no negative offset / bleed */}
      {passiveTreeItems.length > 0 && (
        <div className="flex w-full flex-wrap items-center justify-center gap-2">
          {passiveTreeItems
            .slice()
            .sort((a, b) => {
              if (a.baseType < b.baseType) return -1;
              if (a.baseType > b.baseType) return 1;
              return 0;
            })
            .map((passiveTreeItem) => (
              <Popover key={passiveTreeItem.id} openOnHover={true} placement="top">
                <PopoverTrigger asChild>
                  <div
                    onMouseEnter={() => onItemHovered(passiveTreeItem.id)}
                    className="flex h-14 w-14 items-center justify-center rounded-md bg-gray-950"
                  >
                    <img src={passiveTreeItem.icon} />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="outline-none focus:ring-0">
                  <ItemDetail item={passiveTreeItem} />
                </PopoverContent>
              </Popover>
            ))}
        </div>
      )}
    </div>
  );
};
