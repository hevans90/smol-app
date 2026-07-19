import { useSubscription } from '@apollo/client';
import { jwtDecode } from 'jwt-decode';
import { useEffect, useRef } from 'react';
import {
  MyAdminFlagDocument,
  type MyAdminFlagSubscription,
  type MyAdminFlagSubscriptionVariables,
} from '../graphql-api';

const tokenHasDevRole = (token: string | null): boolean => {
  if (!token) return false;
  try {
    const decoded: {
      'https://hasura.io/jwt/claims': {
        'x-hasura-allowed-roles': string[];
      };
    } = jwtDecode(token);
    return decoded['https://hasura.io/jwt/claims'][
      'x-hasura-allowed-roles'
    ].includes('dev');
  } catch {
    return false;
  }
};

/**
 * Watches the current user's admin flag in realtime. When the flag disagrees
 * with the roles baked into the stored JWT (admin was granted or revoked
 * since login), silently re-mints the token via /api/refresh-token and
 * reloads so the new role takes effect — no re-login needed.
 *
 * Must be rendered inside an ApolloProvider.
 */
export const useAdminAccess = () => {
  const myId = localStorage.getItem('hasura_user_id')?.trim();
  const token = localStorage.getItem('hasura_token');
  const refreshAttempted = useRef(false);

  const { data, loading } = useSubscription<
    MyAdminFlagSubscription,
    MyAdminFlagSubscriptionVariables
  >(MyAdminFlagDocument, {
    variables: { id: myId ?? '' },
    skip: !myId || !token,
  });

  const isAdminInDb = data?.user_by_pk?.admin === true;
  const hasDevRole = tokenHasDevRole(token);

  useEffect(() => {
    if (loading || !data || !token || refreshAttempted.current) return;
    if (isAdminInDb === hasDevRole) return;

    refreshAttempted.current = true;
    fetch('/api/refresh-token', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((body: { hasuraToken?: string } | null) => {
        const newToken = body?.hasuraToken;
        // only swap + reload when the roles genuinely changed, so a
        // misbehaving endpoint can never cause a reload loop
        if (newToken && tokenHasDevRole(newToken) !== hasDevRole) {
          localStorage.setItem('hasura_token', newToken);
          window.location.reload();
        }
      })
      .catch(() => {});
  }, [data, loading, isAdminInDb, hasDevRole, token]);

  return {
    // flag set AND role active: full admin access
    isAdmin: isAdminInDb && hasDevRole,
    // flag set but token not yet upgraded (refresh in flight)
    adminPending: isAdminInDb && !hasDevRole,
    loading,
  };
};
