import { useEffect, useState } from 'react';
import type { usePoEStash } from '../../../hooks/usePoEStash';
import { Button } from '../ui/Button';
import { StashScopeReauthPrompt } from './StashScopeReauthPrompt';

const useSecondsUntil = (until?: number) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!until) return;
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, [until]);
  return until ? Math.max(0, Math.ceil((until - now) / 1000)) : 0;
};

const plural = (count: number, word: string) =>
  `${count} ${word}${count === 1 ? '' : 's'}`;

/**
 * The "Stash check" button and its status for an order board: progress
 * while it reads tabs, the wait when GGG's rate limit kicks in, and once
 * done how many orders it found.
 */
export const StashCheck = ({
  stash,
  matches,
  disabled,
}: {
  stash: ReturnType<typeof usePoEStash>;
  /** orders found in the stash so far */
  matches: number;
  disabled?: boolean;
}) => {
  const { loading, progress, error, scanStash, stopScan, scanned } = stash;
  const waitSeconds = useSecondsUntil(
    progress.phase === 'waiting' ? progress.waitUntil : undefined,
  );

  const found =
    matches > 0 ? (
      <span className="text-emerald-400">
        {plural(matches, 'order')} found in your stash
      </span>
    ) : (
      <span>No orders found in your stash</span>
    );

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <Button
        className="h-auto whitespace-nowrap text-lg"
        disabled={disabled}
        onClick={() => (loading ? stopScan() : void scanStash())}
      >
        {loading ? 'Stop' : 'Stash check'}
      </Button>

      <span className="whitespace-nowrap text-sm text-primary-800">
        {progress.phase === 'listing' && 'Listing tabs…'}
        {progress.phase === 'fetching' &&
          `Tab ${progress.scanned + progress.skipped + 1} of ${progress.total}`}
        {progress.phase === 'waiting' &&
          `GGG rate limit: next tab in ${waitSeconds}s (${progress.scanned + progress.skipped} of ${progress.total} read)`}
        {progress.phase === 'done' && (
          <>
            {found} ({plural(progress.scanned, 'tab')})
          </>
        )}
        {progress.phase === 'stopped' && (
          <>
            {found} (stopped after {progress.scanned} of{' '}
            {plural(progress.total, 'tab')})
          </>
        )}
        {(progress.phase === 'done' || progress.phase === 'stopped') &&
          progress.skipped > 0 && (
            <>, {plural(progress.skipped, 'tab')} couldn't be read</>
          )}
      </span>
      {loading && scanned && matches > 0 && (
        <span className="whitespace-nowrap text-sm text-emerald-400">
          {plural(matches, 'order')} found so far
        </span>
      )}

      {error?.kind === 'missing-scope' && <StashScopeReauthPrompt />}
      {error?.kind === 'rate-limited' && (
        <span className="text-sm text-red-400">
          Rate-limited by GGG, try again in {error.retryAfterSeconds}s.
        </span>
      )}
      {(error?.kind === 'network' || error?.kind === 'unknown') && (
        <span className="text-sm text-red-400">
          Couldn't check your stash: {error.message}
        </span>
      )}
    </div>
  );
};
