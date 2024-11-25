import React from 'react';
import type { GGGItem } from '../../../models/ggg-responses';
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
            <div className="invisible absolute h-full w-full bg-red-600 bg-opacity-25 group-hover:visible">
              {/* Assuming ItemSockets is a component that takes sockets as a prop */}
              <ItemSockets sockets={item.sockets} />
            </div>
          )}
        </div>
      </PopoverTrigger>
      {item && (
        <PopoverContent className="outline-none focus:ring-0">
          {/* Assuming ItemDetail is a component that displays item details */}
          <ItemDetail item={item} />
        </PopoverContent>
      )}
    </Popover>
  ),
);
