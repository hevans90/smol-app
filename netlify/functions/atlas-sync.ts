import type { Handler } from '@netlify/functions';
import { configuredLeague, connectionOf, syncConnection } from '../lib/atlas-sync';
import { getAuthenticatedUserId, unauthorized } from '../lib/require-user';

const MIN_SECONDS_BETWEEN_SYNCS = 60;

const json = (statusCode: number, body: Record<string, unknown>) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

/** "Sync now" on the Farm page: refreshes the caller's own atlas. */
export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'method_not_allowed' });
  const userId = getAuthenticatedUserId(event);
  if (!userId) return unauthorized;

  try {
    const connection = await connectionOf(userId);
    if (!connection) return json(409, { error: 'not_connected' });

    const sinceLast = connection.last_synced_at
      ? (Date.now() - new Date(connection.last_synced_at).getTime()) / 1000
      : Infinity;
    if (sinceLast < MIN_SECONDS_BETWEEN_SYNCS) {
      return json(429, {
        error: 'rate_limited',
        retryAfterSeconds: Math.ceil(MIN_SECONDS_BETWEEN_SYNCS - sinceLast),
      });
    }

    const league = await configuredLeague();
    if (!league) return json(503, { error: 'no_league' });

    const result = await syncConnection(connection, league);
    if (result.outcome === 'rate_limited') {
      return json(429, { error: 'rate_limited', retryAfterSeconds: result.retryAfterSeconds });
    }
    if (result.outcome === 'failed') return json(502, { error: 'failed' });
    return json(200, { sync: result.outcome });
  } catch (e) {
    console.error('Atlas sync request failed:', e instanceof Error ? e.message : e);
    return json(502, { error: 'failed' });
  }
};
