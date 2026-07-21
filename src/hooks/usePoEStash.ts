import { useStore } from '@nanostores/react';
import { useState } from 'react';
import { poeStore } from '../_state/poe.state';
import type {
  AggregatedStashItem,
  GGGStashTab,
  StashScanError,
  StashScanProgress,
} from '../models/ggg-stash';

// Flattens the tab tree returned by GET /stash/<league> into the leaf tabs
// that actually have their own items — folder-type tabs only exist to
// group other tabs and have nothing to fetch for themselves.
const flattenLeafTabs = (
  tabs: GGGStashTab[],
  parentId?: string,
): { id: string; parentId?: string; name: string }[] =>
  tabs.flatMap((tab) =>
    tab.children?.length
      ? flattenLeafTabs(tab.children, tab.id)
      : [{ id: tab.id, parentId, name: tab.name }],
  );

const parseRetryAfter = (response: Response): number => {
  const header = response.headers.get('Retry-After');
  const parsed = header ? parseInt(header, 10) : NaN;
  return Number.isFinite(parsed) ? parsed : 60;
};

/**
 * Walks every stash tab a member has in `league` and aggregates their items,
 * using the member's own PoE OAuth token (never sent anywhere but directly
 * to api.pathofexile.com) — mirrors usePoECharacters/usePoEProfile's pattern.
 * Always lazy: nothing happens until `scanStash()` is called (e.g. by a
 * "Check my stash" button), since a full scan can mean dozens of requests.
 */
export const usePoEStash = (league: string) => {
  const { token } = useStore(poeStore);

  const [items, setItems] = useState<AggregatedStashItem[]>([]);
  const [progress, setProgress] = useState<StashScanProgress>({
    phase: 'listing-tabs',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<StashScanError>();

  const scanStash = async () => {
    if (!token) {
      setError({ kind: 'no-poe-account' });
      return;
    }

    setItems([]);
    setError(undefined);
    setLoading(true);
    setProgress({ phase: 'listing-tabs' });

    const authHeaders = { Authorization: `Bearer ${token}` };

    try {
      const tabsResponse = await fetch(
        `https://api.pathofexile.com/stash/${encodeURIComponent(league)}`,
        { headers: authHeaders },
      );

      if (tabsResponse.status === 403) {
        setError({ kind: 'missing-scope' });
        setLoading(false);
        return;
      }
      if (tabsResponse.status === 429) {
        setError({ kind: 'rate-limited', retryAfterSeconds: parseRetryAfter(tabsResponse) });
        setLoading(false);
        return;
      }
      if (!tabsResponse.ok) {
        setError({
          kind: 'unknown',
          message: `PoE API returned ${tabsResponse.status} listing stash tabs`,
        });
        setLoading(false);
        return;
      }

      const { tabs } = (await tabsResponse.json()) as { tabs: GGGStashTab[] };
      const leafTabs = flattenLeafTabs(tabs ?? []);

      setProgress({ phase: 'fetching-tabs', totalTabs: leafTabs.length });

      const aggregated: AggregatedStashItem[] = [];

      // Fetched one at a time, deliberately not in parallel — GGG's dynamic
      // rate-limit windows apply per endpoint, and a member can have dozens
      // of tabs, so this avoids slamming the API with a burst of requests.
      for (let i = 0; i < leafTabs.length; i++) {
        const tab = leafTabs[i];
        setProgress({
          phase: 'fetching-tabs',
          currentTabIndex: i + 1,
          totalTabs: leafTabs.length,
          currentTabName: tab.name,
        });

        const path = tab.parentId
          ? `${tab.parentId}/${tab.id}`
          : tab.id;
        const contentsResponse = await fetch(
          `https://api.pathofexile.com/stash/${encodeURIComponent(league)}/${path}`,
          { headers: authHeaders },
        );

        if (contentsResponse.status === 429) {
          setError({
            kind: 'rate-limited',
            retryAfterSeconds: parseRetryAfter(contentsResponse),
          });
          // Keep whatever was already aggregated rather than throwing it away.
          setItems(aggregated);
          setLoading(false);
          return;
        }
        if (!contentsResponse.ok) {
          // A single unfetchable tab (e.g. an unsupported tab type)
          // shouldn't abort the whole scan — skip it and keep going.
          continue;
        }

        const { items: tabItems } = (await contentsResponse.json()) as {
          items?: AggregatedStashItem[];
        };
        for (const item of tabItems ?? []) {
          aggregated.push({ ...item, tabId: tab.id, tabName: tab.name });
        }
      }

      setItems(aggregated);
      setProgress({ phase: 'done', totalTabs: leafTabs.length });
    } catch (e) {
      setError({
        kind: 'network',
        message: e instanceof Error ? e.message : 'Failed to reach the PoE API',
      });
    } finally {
      setLoading(false);
    }
  };

  return { loading, items, progress, error, scanStash, hasToken: !!token };
};
