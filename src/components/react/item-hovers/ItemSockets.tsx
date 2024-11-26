import { twMerge } from 'tailwind-merge';
import {
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
  sockets,
  socketedItems,
}: {
  sockets: GGGItemSocket[];
  socketedItems: GGGSocketedItem[];
}) => {
  console.log({ sockets });

  // Define the fixed socket order for all items
  const socketOrder = [0, 1, 3, 2, 4, 5];

  // Determine the actual number of sockets for the item based on passed prop
  const actualSockets = sockets.length;

  // Create a grid layout based on the number of actual sockets
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
      case 5:
        return 'grid-cols-2 grid-rows-3'; // 5 sockets
      case 6:
        return 'grid-cols-2 grid-rows-3'; // 6 sockets
      default:
        return '';
    }
  };

  // Create an ordered list of socket indices, ensuring that we respect the desired order
  const orderedSockets = socketOrder.filter((index) => index < actualSockets);

  return (
    <div
      className={twMerge(
        'grid h-fit w-full gap-1 p-1',
        getGridTemplate(actualSockets), // Apply dynamic grid template
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
              // Adjust placement for 3-socket, 5-socket, or 6-socket items
              actualSockets === 3 && index === 2
                ? 'col-start-2 row-start-2' // For the 3rd socket in 3-socket items
                : actualSockets === 5 && index === 4
                  ? 'col-start-2 row-start-3' // For the 5th socket in 5-socket items
                  : actualSockets === 6 && index === 5
                    ? 'col-start-2 row-start-3' // For the 6th socket in 6-socket items
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
              <div className="absolute flex items-center justify-center text-xs font-bold text-white">
                {/* {socketIndex} */}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
