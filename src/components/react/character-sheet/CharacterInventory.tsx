import { useCallback, useMemo } from 'react';
import type { GGGItem } from '../../../models/ggg-responses';
import { ItemDetail } from '../item-hovers/ItemDetail';
import { ItemPopover } from '../item-hovers/ItemPopover';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/Popover';

export type InventorySlot = {
  id: string;
  className: string;
  size: { width: string; height: string };
};

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

  const inventorySlots: InventorySlot[] = useMemo(
    () => [
      {
        id: 'weapon',
        className: 'left-8 top-0',
        size: { width: 'w-24', height: 'h-[14.5rem]' },
      },
      {
        id: 'trinket',
        className: 'left-8 top-64',
        size: { width: 'w-12', height: 'h-12' },
      },
      {
        id: 'offhand',
        className: 'right-8 top-0',
        size: { width: 'w-24', height: 'h-[14.5rem]' },
      },
      {
        id: 'helm',
        className: 'left-1/2 top-0 transform -translate-x-1/2',
        size: { width: 'w-24', height: 'h-24' },
      },
      {
        id: 'bodyarmour',
        className:
          'left-1/2 top-48 transform -translate-x-1/2 -translate-y-1/2',
        size: { width: 'w-24', height: 'h-40' },
      },
      {
        id: 'belt',
        className: 'left-1/2 top-[18rem] transform -translate-x-1/2',
        size: { width: 'w-24', height: 'h-14' },
      },
      {
        id: 'gloves',
        className: 'left-24 top-[15.5rem]',
        size: { width: 'w-24', height: 'h-24' },
      },
      {
        id: 'boots',
        className: 'right-24 top-[15.5rem]',
        size: { width: 'w-24', height: 'h-24' },
      },
      {
        id: 'ring',
        className: 'left-36 top-[11.5rem]',
        size: { width: 'w-12', height: 'h-12' },
      },
      {
        id: 'ring2',
        className: 'right-36 top-[11.5rem]',
        size: { width: 'w-12', height: 'h-12' },
      },
      {
        id: 'amulet',
        className: 'right-36 top-28',
        size: { width: 'w-12', height: 'h-12' },
      },
    ],
    [],
  );

  return (
    <div className="relative h-full w-[32rem] min-w-[32rem]">
      {inventorySlots.map((slot) => {
        const item = getItemById(slot.id);

        return (
          item && (
            <ItemPopover
              key={slot.id}
              slot={slot}
              item={item}
              onItemHovered={onItemHovered}
            />
          )
        );
      })}

      {/* potions */}
      <div className="absolute left-1/2 top-[25.5rem] flex -translate-x-1/2 -translate-y-1/2 transform items-center gap-2 ">
        {potions.map((potion, i) => (
          <Popover key={potion.id} openOnHover={true}>
            <PopoverTrigger asChild>
              <div
                onMouseEnter={() => onItemHovered(potion?.id as string)}
                key={i}
                className="flex h-24 w-14 items-center justify-center rounded-md bg-gray-950"
              >
                <img src={potion?.icon} />
              </div>
            </PopoverTrigger>
            {potion && (
              <PopoverContent className="outline-none focus:ring-0">
                <ItemDetail item={potion} />
              </PopoverContent>
            )}
          </Popover>
        ))}
      </div>

      {/* jewels */}
      <div className="absolute -bottom-2 -left-64 flex w-1/2 flex-wrap gap-2">
        {passiveTreeItems
          .sort((a, b) => {
            if (a.baseType < b.baseType) return -1;
            if (a.baseType > b.baseType) return 1;
            return 0;
          })
          .map((passiveTreeItem, i) => (
            <Popover
              key={passiveTreeItem.id}
              openOnHover={true}
              placement="top"
            >
              <PopoverTrigger asChild>
                <div
                  onMouseEnter={() =>
                    onItemHovered(passiveTreeItem?.id as string)
                  }
                  key={i}
                  className="flex h-14 w-14 items-center justify-center rounded-md bg-gray-950"
                >
                  <img src={passiveTreeItem?.icon} />
                </div>
              </PopoverTrigger>
              {passiveTreeItem && (
                <PopoverContent className="outline-none focus:ring-0">
                  <ItemDetail item={passiveTreeItem} />
                </PopoverContent>
              )}
            </Popover>
          ))}
      </div>
    </div>
  );
};
