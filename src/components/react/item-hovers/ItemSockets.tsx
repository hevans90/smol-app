import type { CSSProperties } from 'react';
import { useMemo, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import {
  type GGGItemSocket,
  type GGGSocketedItem,
} from '../../../models/ggg-responses';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/Popover';
import { ItemDetail } from './ItemDetail';

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

// Sprite coordinates for gem icons from socket-map.png
const gemSpriteMap: Record<string, { x: number; y: number }> = {
  S: { x: 72, y: 2 },
  D: { x: 36, y: 36 },
  I: { x: 2, y: 36 },
  W: { x: 72, y: 36 },
};

// Helper to get sprite background style for gem
const getGemSpriteStyle = (
  colour: string | undefined,
): CSSProperties | undefined => {
  if (!colour) return undefined;

  const spritePos = gemSpriteMap[colour];
  if (!spritePos) return undefined;

  return {
    backgroundImage: "url('/item-preview/sockets/socket-map.png')",
    backgroundPosition: `-${spritePos.x}px -${spritePos.y}px`,
    backgroundSize: 'auto',
    width: '32px',
    height: '32px',
  };
};

// Component to render gem icon (sprite or API icon)
const GemIcon = ({ socketedItem }: { socketedItem: GGGSocketedItem }) => {
  const spriteStyle = getGemSpriteStyle(socketedItem.colour);

  // Use sprite from socket-map.png if available
  if (spriteStyle) {
    return (
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ ...spriteStyle, zIndex: 2 }}
      />
    );
  }

  return null;
};

// Component to render gem icon with nested popover
const SocketedGemPopover = ({
  socketedItem,
}: {
  socketedItem: GGGSocketedItem;
}) => {
  const [placement, setPlacement] = useState<'left' | 'right'>('right');

  return (
    <Popover placement={placement} openOnHover={true}>
      <PopoverTrigger
        asChild
        onMouseEnter={(e) => e.stopPropagation()}
        onMouseLeave={(e) => e.stopPropagation()}
      >
        <div className="absolute left-1/2 top-1/2 z-10 h-10 w-10 -translate-x-1/2 -translate-y-1/2 cursor-pointer">
          <GemIcon socketedItem={socketedItem} />
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="outline-none focus:ring-0"
        style={{ zIndex: 200 }}
      >
        <ItemDetail item={socketedItem} />
      </PopoverContent>
    </Popover>
  );
};

export const ItemSockets = ({
  sockets,
  socketedItems,
}: {
  sockets: GGGItemSocket[];
  socketedItems: GGGSocketedItem[];
}) => {
  const gridCellSize = 48;
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

  // Create a mapping from socket index to socketed item
  const socketToItemMap = useMemo(() => {
    const map: Record<number, GGGSocketedItem> = {};

    if (!socketedItems || socketedItems.length === 0) return map;

    socketedItems.forEach((item, index) => {
      // Primary method: Use socket property if available
      if (item.socket !== undefined && item.socket !== null) {
        map[item.socket] = item;
      } else {
        // Fallback: Assume array index matches socket index (common PoE API pattern)
        // Only map if index is within valid socket range
        if (index < sockets.length) {
          map[index] = item;
        }
      }
    });

    return map;
  }, [socketedItems, sockets]);

  // Pre-calculate the socket positions for links
  const socketPositions = useMemo(() => {
    const positions: Record<number, { top: number; left: number }> = {};

    orderedSockets.forEach((socketIndex, index) => {
      const column = index % 2; // Assuming 2 columns
      const row = Math.floor(index / 2);
      const top = row * gridCellSize;
      const left = column * gridCellSize;

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
      width: horizontal
        ? `${Math.abs(position1.left - position2.left)}px`
        : imageLinkWidth,
      height: vertical
        ? `${Math.abs(position1.top - position2.top)}px`
        : imageLinkWidth,
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
              className="h-full"
            />
            {/* Render gem icon with popover if socketed item exists */}
            {socketToItemMap[socketIndex] && (
              <SocketedGemPopover socketedItem={socketToItemMap[socketIndex]} />
            )}
          </div>
        );
      })}
    </div>
  );
};
