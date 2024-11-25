import { twMerge } from 'tailwind-merge';
import {
  maxGemSockets,
  type GGGInventoryId,
  type GGGItemSocket,
  type GGGSocketedItem,
} from '../../../models/ggg-responses';

const socketImages: Record<string, string> = {
  R: '/item-preview/sockets/str.png',
  G: '/item-preview/sockets/dex.png',
  B: '/item-preview/sockets/int.png',
  W: '/item-preview/sockets/white.png',
  A: '/item-preview/sockets/abyss.png', // Abyss socket
};

export const ItemSockets = ({
  inventoryId,
  sockets,
  socketedItems,
}: {
  inventoryId: GGGInventoryId;
  sockets: GGGItemSocket[];
  socketedItems: GGGSocketedItem[];
}) => {
  const maxItemSockets = maxGemSockets[inventoryId];

  // Create a grid layout based on the number of sockets
  const getGridTemplate = (sockets: number): string => {
    switch (sockets) {
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-2';
      case 3:
      case 4:
        return 'grid-cols-2 grid-rows-2';
      case 6:
        return 'grid-cols-2 grid-rows-3';
      default:
        return '';
    }
  };

  return (
    <div
      className={twMerge(
        'grid h-full w-full gap-1 p-1',
        getGridTemplate(maxItemSockets),
      )}
      style={{ minWidth: '50px' }}
    >
      {sockets.map((socket, index) => {
        const socketImage =
          socketImages[socket.sColour] || '/images/sockets/default.png';
        return (
          <div
            key={index}
            className="relative flex items-center justify-center"
          >
            <img
              src={socketImage}
              alt={`${socket.sColour} socket`}
              className="h-12 w-12 object-cover"
            />
            {/* Optional: Show socketed item index or other details */}
            {socketedItems[index] && (
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                {/* <img src={socketedItems[index].icon} /> */}
                {socketedItems[index].socket}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
