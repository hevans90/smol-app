import type { GGGItem } from '../../../models/ggg-responses';
import { ItemDetail } from '../item-detail/ItemDetail';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/Popover';

type InventorySlot = {
  id: string;
  className: string;
  size: { width: string; height: string };
};

export const CharacterInventory = ({
  items,
  className,
  onItemHovered,
}: {
  items: GGGItem[];
  className?: string;
  onItemHovered: (itemId: string) => void;
}) => {
  const getItemById = (id: string) =>
    items.find((item) => item.inventoryId.toLowerCase() === id.toLowerCase());

  const getItemsById = (id: string) =>
    items.filter((item) => item.inventoryId.toLowerCase() === id.toLowerCase());

  const potions = getItemsById('flask').sort((a, b) => a.x - b.x);

  const inventorySlots: InventorySlot[] = [
    {
      id: 'weapon',
      className: 'left-8 top-0',
      size: { width: 'w-24', height: 'h-[14.5rem]' },
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
      className: 'left-1/2 top-48 transform -translate-x-1/2 -translate-y-1/2',
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
  ];

  return (
    <div className="relative h-full w-[32rem] min-w-[32rem]">
      {inventorySlots.map(({ id, className, size: { width, height } }, i) => {
        const item = getItemById(id);

        return (
          <Popover key={id}>
            <PopoverTrigger asChild>
              <div
                onMouseEnter={() => onItemHovered(item?.id as string)}
                className={`${className} absolute flex items-center justify-center rounded-md border-primary-600 bg-gray-950 hover:border-2 ${width} ${height}`}
              >
                {item && <img src={item.icon} alt={id} />}
              </div>
            </PopoverTrigger>
            {item && (
              <PopoverContent className="outline-none focus:ring-0">
                <ItemDetail item={item} />
              </PopoverContent>
            )}
          </Popover>
        );
      })}

      <div className="absolute left-1/2 top-[25.5rem] flex -translate-x-1/2 -translate-y-1/2 transform items-center gap-2 ">
        {potions.map((potion, i) => (
          <Popover key={potion.id}>
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

      {/* potions */}
    </div>
  );
};
