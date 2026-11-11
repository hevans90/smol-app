import type { Handler } from '@netlify/functions';
import { configuredLeague, pinTree } from '../lib/atlas-sync';
import { getAuthenticatedUserId, unauthorized } from '../lib/require-user';

const json = (statusCode: number, body: Record<string, unknown>) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

/**
 * "Set as main" on the caller's own Farm card: pins which of their atlas
 * trees stands for them ({ tree: <position> }), or removes the pin
 * ({ tree: null }).
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'method_not_allowed' });
  const userId = getAuthenticatedUserId(event);
  if (!userId) return unauthorized;

  let tree: unknown;
  try {
    ({ tree } = JSON.parse(event.body ?? '{}'));
  } catch {
    // falls through to the validation below
  }
  const valid = tree === null || (Number.isInteger(tree) && (tree as number) >= 0 && (tree as number) < 20);
  if (!valid) return json(400, { error: 'invalid_tree' });

  try {
    const league = await configuredLeague();
    if (!league) return json(503, { error: 'no_league' });
    const pinned = await pinTree(userId, league, tree as number | null);
    return pinned ? json(200, { tree }) : json(409, { error: 'not_shared' });
  } catch (e) {
    console.error('Atlas pin failed:', e instanceof Error ? e.message : e);
    return json(502, { error: 'failed' });
  }
};
