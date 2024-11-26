import { useMemo } from 'react';
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

const linkImages: Record<'horizontal' | 'vertical', string> = {
  horizontal: '/item-preview/links/link-horizontal.png',
  vertical: '/item-preview/links/link-vertical.png',
};

export const ItemSockets = ({
  sockets,
  socketedItems,
}: {
  sockets: GGGItemSocket[];
  socketedItems: GGGSocketedItem[];
}) => {
  console.log({ sockets });

  const gridCellSize = 46;
  const imageLinkWidth = 20;

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

  // Pre-calculate the socket positions for links
  const socketPositions = useMemo(() => {
    const positions: Record<number, { top: number; left: number }> = {};

    orderedSockets.forEach((socketIndex, index) => {
      const column = index % 2; // Assuming 2 columns
      const row = Math.floor(index / 2);
      const top = row * gridCellSize; // 50px for each socket (can be adjusted)
      const left = column * gridCellSize; // 50px for each socket (can be adjusted)

      positions[socketIndex] = { top, left };
    });

    return positions;
  }, [orderedSockets]);

  // Render a link between two sockets
  const renderLink = (from: number, to: number) => {
    const position1 = socketPositions[from];
    const position2 = socketPositions[to];

    if (!position1 || !position2) return null;

    const horizontal = position1.top === position2.top;
    const vertical = position1.left === position2.left;

    if (!horizontal && !vertical) return null;

    const gridCellSizeOffset = gridCellSize / 2;

    const linkSizeOffset = imageLinkWidth / 2;

    const linkStyle: React.CSSProperties = {
      position: 'absolute',
      left: horizontal
        ? Math.min(position1.left, position2.left) + gridCellSizeOffset // Adjusted to center the link
        : position1.left + gridCellSizeOffset - linkSizeOffset, // Center horizontally
      top: vertical
        ? Math.min(position1.top, position2.top) + gridCellSizeOffset // Adjusted to center the link
        : position1.top + gridCellSizeOffset - linkSizeOffset, // Center vertically
      width: horizontal ? `${Math.abs(position1.left - position2.left)}px` : 20,
      height: vertical ? `${Math.abs(position1.top - position2.top)}px` : 20,
      zIndex: 1,
    };

    const linkImage = horizontal ? linkImages.horizontal : linkImages.vertical;

    return (
      <div style={linkStyle} className="flex items-center justify-center">
        <img src={linkImage} alt="link" />
      </div>
    );
  };

  // Generate all links based on socket groupings
  const renderLinks = () => {
    const links: React.ReactNode[] = [];
    const groupedSockets: Record<number, number[]> = {};

    // Group sockets by their group property
    sockets.forEach((socket, index) => {
      if (!groupedSockets[socket.group]) {
        groupedSockets[socket.group] = [];
      }
      groupedSockets[socket.group].push(index);
    });

    // Render links within each group
    Object.values(groupedSockets).forEach((group) => {
      for (let i = 0; i < group.length - 1; i++) {
        links.push(renderLink(group[i], group[i + 1]));
      }
    });

    return links;
  };

  return (
    <div
      className={twMerge(
        'relative grid h-fit w-full',
        getGridTemplate(actualSockets),
      )}
      style={{ minWidth: '50px' }}
    >
      {/* Render links first */}
      {renderLinks()}

      {/* Render sockets */}
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
            className={`relative flex items-center justify-center ${
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
