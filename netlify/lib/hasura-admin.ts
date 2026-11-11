import { hasuraUrl } from './require-user';

/** Runs a query against hasura with the admin secret; throws on any error. */
export const hasuraAdmin = async <T>(
  query: string,
  variables: object = {},
): Promise<T> => {
  const response = await fetch(hasuraUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET as string,
    },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(10_000),
  });
  const result = (await response.json()) as { data?: T; errors?: unknown };
  if (!result.data || result.errors) {
    throw new Error(`hasura: ${JSON.stringify(result.errors ?? result)}`);
  }
  return result.data;
};
