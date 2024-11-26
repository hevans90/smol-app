import React from 'react';
import type { GGGItem, GGGSocketedItem } from '../../../models/ggg-responses';
import type { InventorySlot } from '../character-sheet/CharacterInventory';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/Popover';
import { ItemDetail } from './ItemDetail';
import { ItemSockets } from './ItemSockets';

interface PopoverItemProps {
  slot: InventorySlot;
  item: GGGItem | null;
  onItemHovered: (id: string) => void;
}

export const ItemPopover: React.FC<PopoverItemProps> = React.memo(
  ({
    slot: {
      id,
      className,
      size: { width, height },
    },
    item,
    onItemHovered,
  }) => (
    <Popover>
      <PopoverTrigger asChild>
        <div
          onMouseEnter={() => onItemHovered(item?.id || '')}
          className={`${className} group absolute flex items-center justify-center rounded-md border-primary-600 bg-gray-950 hover:border-2 ${width} ${height}`}
        >
          {item && <img src={item.icon} alt={id} />}

          {item?.sockets?.length && (
            <div className="invisible absolute w-full bg-red-600 bg-opacity-25 group-hover:visible">
              <ItemSockets
                key={item.id}
                inventoryId={item.inventoryId}
                sockets={item.sockets}
                socketedItems={item.socketedItems as GGGSocketedItem[]}
              />
            </div>
          )}
        </div>
      </PopoverTrigger>
      {item && (
        <PopoverContent className="outline-none focus:ring-0">
          <ItemDetail item={item} />
        </PopoverContent>
      )}
    </Popover>
  ),
);
