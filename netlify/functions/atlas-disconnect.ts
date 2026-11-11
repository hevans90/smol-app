import type { Handler } from '@netlify/functions';
import { removeConnection } from '../lib/atlas-sync';
import { getAuthenticatedUserId, unauthorized } from '../lib/require-user';

/**
 * "Stop sharing" on the Farm page: revokes and deletes the caller's stored
 * atlas token and deletes their atlas snapshots.
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'method_not_allowed' }) };
  }
  const userId = getAuthenticatedUserId(event);
  if (!userId) return unauthorized;

  try {
    await removeConnection(userId);
    return { statusCode: 200, body: JSON.stringify({ connected: false }) };
  } catch (e) {
    console.error('Atlas disconnect failed:', e instanceof Error ? e.message : e);
    return { statusCode: 502, body: JSON.stringify({ error: 'failed' }) };
  }
};
