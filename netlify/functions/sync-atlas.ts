import { schedule } from '@netlify/functions';
import {
  CONNECTION_FIELDS,
  RECONNECT_NEEDED,
  configuredLeague,
  syncConnection,
  type AtlasConnection,
} from '../lib/atlas-sync';
import { hasuraAdmin } from '../lib/hasura-admin';

/**
 * Refreshes the atlas of every member who opted in on the Farm page, every
 * 30 minutes, least recently synced first.
 *
 * Scheduled functions run on production deploys only, cannot be invoked by
 * URL, and are cut off after 30 seconds — hence the time budget: whoever
 * doesn't fit in one run is first in line for the next.
 */

const TIME_BUDGET_MS = 20_000;

export const syncAllAtlases = async () => {
  const startedAt = Date.now();
  const league = await configuredLeague();
  if (!league) throw new Error('no league configured in app_config');

  // connections waiting on a reconnect are skipped: only the member can fix
  // those, and retrying a dead token just burns rate limit
  const { atlas_connection } = await hasuraAdmin<{
    atlas_connection: AtlasConnection[];
  }>(
    `query AtlasConnectionsToSync($skip: String!) {
      atlas_connection(
        where: { _or: [{ last_error: { _is_null: true } }, { last_error: { _neq: $skip } }] }
        order_by: { last_synced_at: asc_nulls_first }
      ) { ${CONNECTION_FIELDS} }
    }`,
    { skip: RECONNECT_NEEDED },
  );

  const outcomes: Record<string, number> = {};
  let stopped: string | undefined;
  for (const connection of atlas_connection) {
    if (Date.now() - startedAt > TIME_BUDGET_MS) {
      stopped = 'time budget';
      break;
    }
    const result = await syncConnection(connection, league);
    outcomes[result.outcome] = (outcomes[result.outcome] ?? 0) + 1;
    if (result.outcome === 'rate_limited') {
      stopped = `rate limited for ${result.retryAfterSeconds}s`;
      break;
    }
  }

  return { league, connections: atlas_connection.length, outcomes, stopped };
};

export const handler = schedule('*/30 * * * *', async () => {
  try {
    console.log('Atlases synced', await syncAllAtlases());
    return { statusCode: 200 };
  } catch (e) {
    console.error('Atlas sync failed:', e instanceof Error ? e.message : e);
    return { statusCode: 500 };
  }
});
