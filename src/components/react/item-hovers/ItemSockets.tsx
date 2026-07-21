import type { CSSProperties } from 'react';
import { useMemo, useState } from 'react';
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

// Single source of truth for the socket grid's cell size — both the grid
// container's track sizing and each socket image's explicit dimensions are
// derived from this, so link-line geometry (which assumes this exact cell
// size) can't silently drift out of sync with what's actually rendered.
const SOCKET_CELL_PX = 48;

// Sprite coordinates for gem icons from socket-map.png
const gemSpriteMap: Record<string, { x: number; y: number }> = {
  EYE: { x: 2, y: 2 },
  S: { x: 72, y: 2 },
  SS: { x: 2, y: 142 },
  D: { x: 36, y: 36 },
  DS: { x: 142, y: 106 },
  I: { x: 2, y: 36 },
  IS: { x: 142, y: 72 },
  W: { x: 72, y: 36 },
  WS: { x: 36, y: 142 },
};

// Helper to get sprite background style for gem
const getGemSpriteStyle = (
  colour: string | undefined,
  support: boolean,
): CSSProperties | undefined => {
  if (!colour) return undefined;

  let actualColour = support ? `${colour}S` : colour;

  const spritePos = gemSpriteMap[actualColour];
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
  const colour = socketedItem.baseType.toLowerCase().includes('eye jewel')
    ? 'EYE'
    : socketedItem.colour;

  const spriteStyle = getGemSpriteStyle(colour, !!socketedItem.support);

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
        <div className="absolute left-1/2 top-1/2 z-10 h-10 w-10 -translate-x-1/2 -translate-y-1/2">
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
  const imageLinkWidth = 20;

  // Define the fixed socket order for all items
  const socketOrder = [0, 1, 3, 2, 4, 5];

  // Determine the actual number of sockets for the item based on passed prop
  const actualSockets = sockets.length;

  // Column/row counts for the socket grid, by socket count.
  const getGridDimensions = (sockets: number): { cols: number; rows: number } => {
    switch (sockets) {
      case 1:
        return { cols: 1, rows: 1 };
      case 2:
        return { cols: 2, rows: 1 };
      case 3:
        return { cols: 2, rows: 2 }; // 3 sockets: first 2 on top, 1 below
      case 4:
        return { cols: 2, rows: 2 };
      case 5:
        return { cols: 2, rows: 3 };
      case 6:
        return { cols: 2, rows: 3 };
      default:
        return { cols: 1, rows: 1 };
    }
  };

  const gridDimensions = getGridDimensions(actualSockets);

  // Create an ordered list of socket indices, ensuring that we respect the desired order
  const orderedSockets = socketOrder.filter((index) => index < actualSockets);

  // Single source of truth for where a socket actually renders in the grid.
  // The natural fill order is left-to-right, top-to-bottom in 2 columns —
  // except 3- and 5-socket items, where the lone leftover socket in the
  // last row is visually centered under the pair above it (right column,
  // not left) to match how PoE itself lays these out. This MUST be the
  // only place that decides socket placement — a previous version had this
  // logic duplicated (once here, once as literal CSS grid classes on the
  // rendered socket), and the two definitions disagreed for the 3- and
  // 5-socket cases, so the link lines were drawn to a different cell than
  // the socket icon actually occupied.
  const getSocketGridPosition = (
    index: number,
  ): { row: number; col: number } => {
    if (actualSockets === 3 && index === 2) return { row: 1, col: 1 };
    if (actualSockets === 5 && index === 4) return { row: 2, col: 1 };
    return { row: Math.floor(index / 2), col: index % 2 };
  };

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
      const { row, col } = getSocketGridPosition(index);
      positions[socketIndex] = {
        top: row * SOCKET_CELL_PX,
        left: col * SOCKET_CELL_PX,
      };
    });

    return positions;
  }, [orderedSockets, actualSockets]);

  // Render a link between two sockets
  const renderLink = (from: number, to: number) => {
    const position1 = socketPositions[from];
    const position2 = socketPositions[to];

    if (!position1 || !position2) return null;

    const horizontal = position1.top === position2.top;
    const vertical = position1.left === position2.left;

    if (!horizontal && !vertical) return null;

    const gridCellSizeOffset = SOCKET_CELL_PX / 2;

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
      <div
        key={`${from}_${to}`}
        style={linkStyle}
        className="flex items-center justify-center"
      >
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
      className="relative grid h-fit w-full"
      style={{
        gridTemplateColumns: `repeat(${gridDimensions.cols}, ${SOCKET_CELL_PX}px)`,
        gridTemplateRows: `repeat(${gridDimensions.rows}, ${SOCKET_CELL_PX}px)`,
        minWidth: '50px',
      }}
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

        const { row, col } = getSocketGridPosition(index);

        return (
          <div
            key={socketIndex}
            className="relative flex items-center justify-center"
            style={{ gridRow: row + 1, gridColumn: col + 1 }}
          >
            <img
              src={socketImage}
              alt={`${socket.sColour || 'default'} socket`}
              className="object-contain"
              style={{ width: SOCKET_CELL_PX, height: SOCKET_CELL_PX }}
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
