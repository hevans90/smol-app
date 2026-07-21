import { FloatingTree } from '@floating-ui/react';
import React from 'react';
import type { GGGItem, GGGSocketedItem } from '../../../models/ggg-responses';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/Popover';
import { ItemDetail } from './ItemDetail';
import { ItemSockets } from './ItemSockets';

interface PopoverItemProps {
  item: GGGItem | null;
  onItemHovered: (id: string) => void;
}

// Fills whatever box its parent gives it — placement/sizing is entirely the
// parent's responsibility (see CharacterInventory.tsx's grid-area wrappers).
export const ItemPopover: React.FC<PopoverItemProps> = React.memo(
  ({ item, onItemHovered }) => (
    <FloatingTree>
      <Popover openOnHover={true}>
        <PopoverTrigger asChild>
          <div
            onMouseEnter={() => {
              onItemHovered(item?.id || '');
            }}
            className="group relative flex h-full w-full items-center justify-center overflow-hidden rounded-md bg-gray-950"
          >
            {item && (
              <img
                src={item.icon}
                alt={item.inventoryId}
                className="max-h-full max-w-full object-contain"
              />
            )}

            {item?.sockets?.length && (
              <div className="invisible absolute w-full group-hover:visible">
                <ItemSockets
                  key={item.id}
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
    </FloatingTree>
  ),
);
