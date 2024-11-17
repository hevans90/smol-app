import type { GGGItem } from '../../../models/ggg-responses';

export const CharacterInventory = ({
  items,
  className,
}: {
  items: GGGItem[];
  className?: string;
}) => {
  // Utility to find a single item by inventoryId
  const getItemById = (id: string) =>
    items.find((item) => item.inventoryId.toLowerCase() === id.toLowerCase());

  // Utility to filter multiple items by inventoryId
  const getItemsById = (id: string) =>
    items.filter((item) => item.inventoryId.toLowerCase() === id.toLowerCase());

  // Fetch items
  const weapon = getItemById('weapon');
  const offhand = getItemById('offhand');
  const helm = getItemById('helm');
  const gloves = getItemById('gloves');
  const boots = getItemById('boots');
  const body = getItemById('bodyarmour');
  const ring1 = getItemById('ring');
  const ring2 = getItemById('ring2');
  const neck = getItemById('amulet');
  const belt = getItemById('belt');
  const potions = getItemsById('flask').sort((a, b) => a.x - b.x);

  return (
    <div className="relative h-full w-[32rem]">
      <div className="absolute left-8 top-0 flex h-[14.5rem] w-24 items-center justify-center rounded-md bg-gray-950">
        <img src={weapon?.icon} alt="weapon" />
      </div>
      <div className="absolute right-8 top-0 flex h-[14.5rem] w-24 items-center justify-center rounded-md bg-gray-950">
        <img src={offhand?.icon} />
      </div>

      {/* centered items */}
      <div className="absolute left-1/2 top-48 flex h-40 w-24 -translate-x-1/2 -translate-y-1/2 transform items-center rounded-md bg-gray-950">
        <img src={body?.icon} />
      </div>
      <div className="absolute left-1/2 top-0 flex h-24 w-24 -translate-x-1/2 transform items-center rounded-md bg-gray-950">
        <img src={helm?.icon} />
      </div>
      <div className="absolute left-1/2 top-[18rem] flex h-14 w-24 -translate-x-1/2 transform items-center rounded-md bg-gray-950">
        <img src={belt?.icon} />
      </div>

      <div className="absolute left-24 top-[15.5rem] flex h-24 w-24 items-center rounded-md bg-gray-950">
        <img src={gloves?.icon} />
      </div>
      <div className="absolute right-24 top-[15.5rem] flex h-24 w-24 items-center rounded-md bg-gray-950">
        <img src={boots?.icon} />
      </div>

      <div className="absolute left-36 top-[11.5rem] flex h-12 w-12 items-center rounded-md bg-gray-950">
        <img src={ring1?.icon} />
      </div>
      <div className="absolute right-36 top-[11.5rem] flex h-12 w-12 items-center rounded-md bg-gray-950">
        <img src={ring2?.icon} />
      </div>

      <div className="absolute right-36 top-28 flex h-12 w-12 items-center rounded-md bg-gray-950">
        <img src={neck?.icon} />
      </div>

      <div className="absolute left-1/2 top-[25.5rem] flex -translate-x-1/2 -translate-y-1/2 transform items-center gap-2">
        {potions.map((potion) => (
          <div className="flex h-24 w-14 items-center justify-center rounded-md bg-gray-950">
            <img src={potion?.icon} />
          </div>
        ))}
      </div>

      {/* potions */}
    </div>
  );
};
