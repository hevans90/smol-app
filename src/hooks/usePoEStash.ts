import { useStore } from '@nanostores/react';
import { useEffect, useRef, useState } from 'react';
import { poeStore } from '../_state/poe.state';
import type {
  AggregatedStashItem,
  GGGStashTab,
  StashScanError,
  StashScanProgress,
} from '../models/ggg-stash';

const API = 'https://api.pathofexile.com';

// Map tabs split into hundreds of per-tier substashes, and maps are never
// ordered here, so their children aren't worth the rate-limit budget.
const SKIPPED_CHILDREN_OF = new Set(['MapStash']);

// Longest Retry-After worth waiting out in place; past this the scan stops
// with what it has and says when to try again.
const MAX_WAIT_SECONDS = 120;

const sleep = (ms: number, signal: { stopped: boolean }) =>
  new Promise<void>((resolve) => {
    const started = Date.now();
    const tick = (): void => {
      if (signal.stopped || Date.now() - started >= ms) resolve();
      else setTimeout(tick, Math.min(250, ms));
    };
    tick();
  });

const retryAfterSeconds = (response: Response): number => {
  const parsed = parseInt(response.headers.get('Retry-After') ?? '', 10);
  return Number.isFinite(parsed) ? parsed : 60;
};

// GGG's rate-limit headers: X-Rate-Limit-Rules names the rules (Account,
// Ip, ...), X-Rate-Limit-<rule> lists "max:period:penalty" windows and
// X-Rate-Limit-<rule>-State the matching "hits:period:active" counters
// (hits include the request just answered).
type Window = { max: number; period: number; hits: number };
const readWindows = (response: Response): Window[] =>
  (response.headers.get('X-Rate-Limit-Rules') ?? '')
    .split(',')
    .map((rule) => rule.trim())
    .filter(Boolean)
    .flatMap((rule) => {
      const limits =
        response.headers.get(`X-Rate-Limit-${rule}`)?.split(',') ?? [];
      const states =
        response.headers.get(`X-Rate-Limit-${rule}-State`)?.split(',') ?? [];
      return limits.map((limit, index) => {
        const [max, period] = limit.split(':').map(Number);
        const [hits] = (states[index] ?? '0').split(':').map(Number);
        return { max, period, hits };
      });
    })
    .filter(({ max, period }) => max > 0 && period > 0);

/**
 * How long to wait before the next request so no window fills. Our own
 * request times say when a slot frees up; if the server counts more hits
 * than we sent (another tool on the same account), wait the whole window.
 */
const pacingDelay = (windows: Window[], sentAt: number[]): number => {
  const now = Date.now();
  let delay = 0;
  for (const { max, period, hits } of windows) {
    if (hits < max) continue;
    const ours = sentAt.filter((time) => now - time < period * 1000);
    const frees =
      ours.length >= max
        ? ours[ours.length - max] + period * 1000 - now
        : period * 1000;
    delay = Math.max(delay, frees + 1000);
  }
  return delay;
};

type QueuedTab = { path: string; name: string; type: string };

const toQueued = (tab: GGGStashTab, parent?: QueuedTab): QueuedTab => ({
  path: parent ? `${parent.path}/${tab.id}` : tab.id,
  // unique and map substashes have no name of their own
  name: tab.name?.trim() || parent?.name || 'Stash',
  type: tab.type,
});

/**
 * Walks the stash tabs a member has in `league` and collects their items,
 * using the member's own PoE OAuth token (sent only to api.pathofexile.com).
 * Lazy: nothing happens until `scanStash()`. Items arrive tab by tab, so
 * matches can show while the scan is still going, and `stopScan()` keeps
 * what has been read so far.
 */
export const usePoEStash = (league: string) => {
  const { token } = useStore(poeStore);

  const [items, setItems] = useState<AggregatedStashItem[]>([]);
  const [progress, setProgress] = useState<StashScanProgress>({
    phase: 'idle',
  });
  const [error, setError] = useState<StashScanError>();
  const run = useRef<{ stopped: boolean }>();

  // abandon a scan when the page goes away
  useEffect(() => () => void (run.current && (run.current.stopped = true)), []);

  const stopScan = () => {
    if (run.current) run.current.stopped = true;
  };

  const scanStash = async () => {
    if (!token) {
      setError({ kind: 'no-poe-account' });
      return;
    }
    stopScan();
    const signal = { stopped: false };
    run.current = signal;

    const headers = { Authorization: `Bearer ${token}` };
    const sentAt: number[] = [];
    const collected: AggregatedStashItem[] = [];
    let scanned = 0;
    let skipped = 0;
    let halted = false;

    setItems([]);
    setError(undefined);
    setProgress({ phase: 'listing', scanned, skipped, total: 0 });

    // One GET, paced against GGG's windows and retried after a 429.
    const get = async (
      path: string,
      onWait: (until: number) => void,
    ): Promise<Response | 'stopped' | StashScanError> => {
      for (;;) {
        if (signal.stopped) return 'stopped';
        sentAt.push(Date.now());
        const response = await fetch(
          `${API}/stash/${encodeURIComponent(league)}${path}`,
          {
            headers,
          },
        );
        if (response.status !== 429) {
          const delay = pacingDelay(readWindows(response), sentAt);
          if (delay > 0) {
            onWait(Date.now() + delay);
            await sleep(delay, signal);
          }
          return response;
        }
        const wait = retryAfterSeconds(response);
        if (wait > MAX_WAIT_SECONDS) {
          return { kind: 'rate-limited', retryAfterSeconds: wait };
        }
        onWait(Date.now() + (wait + 1) * 1000);
        await sleep((wait + 1) * 1000, signal);
      }
    };

    try {
      const listed = await get('', () => undefined);
      if (listed === 'stopped') return;
      if (!(listed instanceof Response)) {
        setError(listed);
        setProgress({ phase: 'done', scanned, skipped, total: 0 });
        return;
      }
      if (listed.status === 403) {
        setError({ kind: 'missing-scope' });
        setProgress({ phase: 'idle' });
        return;
      }
      if (!listed.ok) {
        setError({
          kind: 'unknown',
          message: `PoE API returned ${listed.status} listing stash tabs`,
        });
        setProgress({ phase: 'idle' });
        return;
      }

      const { stashes } = (await listed.json()) as { stashes?: GGGStashTab[] };
      const queue: QueuedTab[] = [];
      const enqueue = (tabs: GGGStashTab[] | undefined, parent?: QueuedTab) => {
        if (parent && SKIPPED_CHILDREN_OF.has(parent.type)) return;
        for (const tab of tabs ?? []) {
          const queued = toQueued(tab, parent);
          // folders list their children up front and hold no items
          if (tab.children?.length) enqueue(tab.children, queued);
          else queue.push(queued);
        }
      };
      enqueue(stashes);

      const report = (
        phase: 'fetching' | 'waiting',
        current?: string,
        waitUntil?: number,
      ) =>
        setProgress({
          phase,
          scanned,
          skipped,
          total:
            scanned + skipped + queue.length + (phase === 'fetching' ? 1 : 0),
          currentTabName: current,
          waitUntil,
        });

      while (queue.length) {
        const tab = queue.shift()!;
        report('fetching', tab.name);
        const response = await get(`/${tab.path}`, (until) =>
          report('waiting', tab.name, until),
        );
        if (response === 'stopped') break;
        if (!(response instanceof Response)) {
          setError(response);
          halted = true;
          break;
        }
        if (!response.ok) {
          // an unsupported tab type shouldn't sink the whole scan
          skipped++;
          continue;
        }
        const { stash } = (await response.json()) as {
          stash?: GGGStashTab & { items?: AggregatedStashItem[] };
        };
        // unique and other special tabs only reveal their substashes here
        if (stash?.children?.length) enqueue(stash.children, tab);
        for (const item of stash?.items ?? []) {
          collected.push({ ...item, tabId: tab.path, tabName: tab.name });
        }
        scanned++;
        setItems([...collected]);
      }

      setProgress({
        phase: signal.stopped || halted ? 'stopped' : 'done',
        scanned,
        skipped,
        total: scanned + skipped + queue.length,
      });
    } catch (e) {
      setError({
        kind: 'network',
        message: e instanceof Error ? e.message : 'Failed to reach the PoE API',
      });
      setProgress({
        phase: scanned ? 'stopped' : 'idle',
        scanned,
        skipped,
        total: scanned,
      });
    } finally {
      if (run.current === signal) run.current = undefined;
    }
  };

  const loading =
    progress.phase === 'listing' ||
    progress.phase === 'fetching' ||
    progress.phase === 'waiting';

  return {
    loading,
    items,
    progress,
    error,
    scanStash,
    stopScan,
    hasToken: !!token,
    // a scan has produced results worth matching against (even partial)
    scanned: progress.phase !== 'idle' && progress.phase !== 'listing',
  };
};
