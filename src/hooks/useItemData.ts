import { useEffect, useState } from 'react';

// The item data (uniques, bases, gems, stackables) is several megabytes, so
// it loads after the page has painted rather than with it. Every caller
// shares the one import.
type ItemData = typeof import('../_utils/utils');

let loaded: ItemData | undefined;
let loading: Promise<ItemData> | undefined;

export const loadItemData = () =>
  (loading ??= import('../_utils/utils').then((module) => (loaded = module)));

/** The item data module, or undefined until it has loaded. */
export const useItemData = () => {
  const [data, setData] = useState(loaded);
  useEffect(() => {
    if (data) return;
    let live = true;
    void loadItemData().then((module) => live && setData(module));
    return () => {
      live = false;
    };
  }, [data]);
  return data;
};
