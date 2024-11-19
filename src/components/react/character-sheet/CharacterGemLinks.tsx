import { twMerge } from 'tailwind-merge';
import type { GGGItem, GGGItemProperty } from '../../../models/ggg-responses';

export const SocketTreeVisualizer = ({ item }: { item: GGGItem }) => {
  const baseSize = 'w-16 h-16';
  const iconSize = 'w-10 h-10';

  // Helper to determine border color based on socket color
  const getSocketColor = (colour: string | undefined): string => {
    switch (colour) {
      case 'S':
        return 'border-red-500';
      case 'D':
        return 'border-green-500';
      case 'I':
        return 'border-blue-500';
      default:
        return 'border-gray-400';
    }
  };

  // Helper to determine text color based on frame type
  const getTextColor = (frameType: number): string => {
    switch (frameType) {
      case 3:
        return 'text-amber-500'; // Unique
      case 4:
        return 'text-cyan-400'; // Gem
      default:
        return 'text-gray-200';
    }
  };

  // Helper to get gem level from properties
  const getGemLevel = (properties: GGGItemProperty[] | undefined): string => {
    const levelProp = properties?.find((p) => p.name === 'Level');
    return levelProp?.values[0][0] || '1';
  };

  // Helper to get gem quality from properties
  const getGemQuality = (properties: GGGItemProperty[] | undefined) => {
    const qualityProp = properties?.find((p) => p.name === 'Quality');
    return qualityProp?.values[0][0] || null;
  };

  if (!item.socketedItems) return null;

  const sortedSocketedItems = item.socketedItems.sort((a, b) => {
    const supportA = a.support === undefined ? false : a.support;
    const supportB = b.support === undefined ? false : b.support;

    // Sorting so that true comes first, followed by false (and undefined treated as false)
    return (supportA ? 1 : 0) - (supportB ? 1 : 0);
  });

  return (
    <div className="flex flex-col items-start">
      <div className="relative h-full">
        {/* Vertical connecting line */}
        {item.socketedItems?.length > 0 && (
          <div
            style={{
              position: 'absolute',
              left: '2rem',
              top: '4rem',
              height: `calc(${item.socketedItems.length * 3.5}rem + 3px)`,
            }}
            className="w-1 bg-primary-600"
          />
        )}

        {/* Main item */}
        <div className="mb-8 flex items-center">
          <div
            className={`${baseSize} relative flex items-center justify-center overflow-hidden rounded-lg border-2 border-primary-600 bg-gray-800`}
          >
            <img
              src={item.icon}
              alt={item.name}
              className={`${baseSize} object-contain`}
            />
          </div>
          <div className="ml-4">
            <div className={`font-bold ${getTextColor(item.frameType)}`}>
              {item.name}
            </div>
            <div className="text-sm text-primary-500">{item.baseType}</div>
          </div>
        </div>

        {/* Gems */}
        {sortedSocketedItems?.map((socketedItem, index) => {
          const quality = getGemQuality(socketedItem.properties);
          return (
            <div
              key={socketedItem.id}
              className="relative ml-8 flex h-14 items-center"
            >
              {/* Horizontal line */}
              <div className="h-1 w-8 bg-primary-600" />

              <div
                className={twMerge(
                  `relative flex items-center justify-center overflow-hidden rounded-lg border-2 border-primary-600 bg-gray-800`,
                  iconSize,
                  getSocketColor(socketedItem.colour),
                )}
              >
                <img
                  src={socketedItem.icon}
                  alt={socketedItem.typeLine}
                  className={`${iconSize} object-contain`}
                />
              </div>

              {/* Item details */}
              <div className="ml-4">
                <div
                  className={twMerge(
                    socketedItem.support &&
                      getTextColor(socketedItem.frameType),
                    !socketedItem.support && 'font-bold text-cyan-200',
                  )}
                >
                  {socketedItem.typeLine}
                </div>
                <div className="flex gap-2 text-sm text-gray-400">
                  <span>Lvl {getGemLevel(socketedItem.properties)}</span>

                  {quality && (
                    <>
                      <span>•</span>
                      <span>Qual {quality}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
