import { twMerge } from 'tailwind-merge';
import {
  maxGemSockets,
  type GGGInventoryId,
  type GGGItemSocket,
  type GGGSocketedItem,
} from '../../../models/ggg-responses';

// Images for each socket color
const socketImages: Record<string, string> = {
  R: '/item-preview/sockets/str.png',
  G: '/item-preview/sockets/dex.png',
  B: '/item-preview/sockets/int.png',
  W: '/item-preview/sockets/white.png',
  A: '/item-preview/sockets/abyss.png', // Abyss socket
  // Default image if socket color is undefined or invalid
  default: '/images/sockets/default.png',
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

  // Define the fixed socket order for all items
  const socketOrder = [0, 1, 3, 2, 4, 5];

  // Create a grid layout based on the number of sockets
  const getGridTemplate = (sockets: number): string => {
    switch (sockets) {
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-2';
      case 3:
        return 'grid-cols-2 grid-rows-2'; // 3 sockets: first 2 on top, 1 below
      case 4:
        return 'grid-cols-2 grid-rows-2'; // 4 sockets
      case 6:
        return 'grid-cols-2 grid-rows-3'; // 6 sockets
      default:
        return '';
    }
  };

  // Create an ordered list of socket indices, ensuring that we respect the desired order
  const orderedSockets = socketOrder.filter((index) => index < maxItemSockets);

  return (
    <div
      className={twMerge(
        'grid h-fit w-full gap-1 p-1',
        getGridTemplate(maxItemSockets),
      )}
      style={{ minWidth: '50px' }}
    >
      {orderedSockets.map((socketIndex, index) => {
        const socket = sockets[socketIndex];

        if (!socket) return null;

        // Fallback to 'default' if socket.sColour is undefined or invalid
        const socketImage =
          socket.sColour && socketImages[socket.sColour]
            ? socketImages[socket.sColour]
            : socketImages.default;

        return (
          <div
            key={socketIndex}
            className={`relative -m-1 flex items-center justify-center ${
              // For the 3rd socket, move it to the second row (for 3-socket items only)
              maxItemSockets === 3 && index === 2
                ? 'col-start-2 row-start-2'
                : ''
            }`}
          >
            <img
              src={socketImage}
              alt={`${socket.sColour || 'default'} socket`}
              className="h-full w-full"
            />
            {/* Optional: Show socketed item index or other details */}
            {socketedItems[socketIndex] && (
              <div className="absolute  flex items-center justify-center text-xs font-bold text-white">
                {socketIndex}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
