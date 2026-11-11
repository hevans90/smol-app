import { useSubscription } from '@apollo/client';
import { useCallback, useState } from 'react';
import {
  MyAtlasConnectionDocument,
  type MyAtlasConnectionSubscription,
} from '../graphql-api';

export type AtlasActionError =
  | { kind: 'rate-limited'; retryAfterSeconds: number }
  | { kind: 'failed' };

const post = (path: string, body?: object) =>
  fetch(`${window.location.origin}/api/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('hasura_token') ?? ''}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

/**
 * The logged-in member's atlas sharing: whether they opted in, how the last
 * server-side sync went, and the two things they can do about it. The PoE
 * token behind it lives on the server only (see netlify/lib/atlas-sync.ts);
 * opting in is startAtlasConnect() in PoEAuth.tsx.
 *
 * Must be rendered inside an ApolloProvider.
 */
export const useAtlasConnection = () => {
  const { data } = useSubscription<MyAtlasConnectionSubscription>(
    MyAtlasConnectionDocument,
  );
  const [busy, setBusy] = useState<'sync' | 'disconnect' | 'pin'>();
  const [error, setError] = useState<AtlasActionError>();

  const run = useCallback(async (action: 'sync' | 'disconnect' | 'pin', body?: object) => {
    setBusy(action);
    setError(undefined);
    try {
      const response = await post(`atlas-${action}`, body);
      if (response.ok) return true;
      const result = await response.json().catch(() => ({}));
      setError(
        response.status === 429
          ? { kind: 'rate-limited', retryAfterSeconds: result.retryAfterSeconds ?? 60 }
          : { kind: 'failed' },
      );
      return false;
    } catch {
      setError({ kind: 'failed' });
      return false;
    } finally {
      setBusy(undefined);
    }
  }, []);

  return {
    // undefined until the first result arrives; null = not sharing
    connection: data ? (data.atlas_connection[0] ?? null) : undefined,
    syncNow: useCallback(() => run('sync'), [run]),
    disconnect: useCallback(() => run('disconnect'), [run]),
    /** `tree` is its position in the snapshot's trees; null removes the pin */
    pinTree: useCallback((tree: number | null) => run('pin', { tree }), [run]),
    busy,
    error,
  };
};
