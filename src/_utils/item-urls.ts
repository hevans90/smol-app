// Icon URL helpers. Kept out of utils.ts, which pulls in megabytes of item
// data, so pages that only need an icon don't load it.

export const mapDdsToPoeImageUrl = (
  ddsFilePath: string,
  width = 1,
  height = 1,
) => {
  const baseUrl = 'https://web.poecdn.com/image/';
  const pathWithoutExt = ddsFilePath.replace(/\.dds$/, '');
  return `${baseUrl}${pathWithoutExt}.png?scale=1&w=${width}&h=${height}`;
};

// Derives an inventory icon from a poewiki page link, e.g.
// https://www.poewiki.net/wiki/Ming%27s_Heart -> Special:FilePath/Ming's_Heart_inventory_icon.png
export const getWikiImgSrcFromUrl = (url: string) => {
  const itemName = url.split('/').pop();
  return `https://www.poewiki.net/wiki/Special:FilePath/${itemName}_inventory_icon.png`;
};

// Same idea, but starting from a bare item name rather than a full wiki URL
// (used for the bulk order "custom item" escape hatch, where there's no
// wiki link yet — just a best-effort guess at the icon).
export const guessWikiIconUrlFromName = (name: string) =>
  `https://www.poewiki.net/wiki/Special:FilePath/${name.replace(/ /g, '_')}_inventory_icon.png`;
