import type { HandlerEvent } from '@netlify/functions';
import { verify } from 'jsonwebtoken';

// Lives outside netlify/functions on purpose: every file in that directory is
// deployed as its own public endpoint.

/**
 * Returns the hasura user id from a valid `Authorization: Bearer <hasura JWT>`
 * header (the token minted by verify.ts / refresh-token.ts), or undefined when
 * the header is missing, malformed, or not signed by us.
 */
export const getAuthenticatedUserId = (
  event: HandlerEvent,
): string | undefined => {
  const token = (event.headers.authorization ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return undefined;

  try {
    const decoded = verify(token, process.env.JWT_SECRET as string, {
      algorithms: ['HS256'],
    }) as { hasuraUserId?: string };
    return decoded.hasuraUserId || undefined;
  } catch {
    return undefined;
  }
};

export const unauthorized = {
  statusCode: 401,
  body: JSON.stringify({ message: 'Unauthorized' }),
};

// Only explicit user mentions may ping — never @everyone, @here or roles,
// whatever the message content says.
export const userMentionsOnly = { parse: ['users'] };
