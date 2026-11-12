import { ApolloProvider } from '@apollo/client';
import { useEffect } from 'react';
import { sharedApolloClient } from '../../_utils/apollo-bootstrapper';
import { useAdminAccess } from '../../hooks/useAdminAccess';

const Watcher = () => {
  const { isAdmin, adminPending, loading } = useAdminAccess();

  // the head script in Layout.astro set data-admin from the token; follow
  // the live flag from here on
  useEffect(() => {
    if (loading) return;
    document.documentElement.toggleAttribute('data-admin', isAdmin || adminPending);
  }, [isAdmin, adminPending, loading]);

  return null;
};

/**
 * Renders nothing. Watches the member's admin flag on every page: shows or
 * hides the Admin tab (via html[data-admin]) and, through useAdminAccess,
 * re-mints the token when the flag and the token's roles disagree.
 */
export const AdminAccessWatcher = ({ hasuraUri }: { hasuraUri: string }) => {
  const token = localStorage.getItem('hasura_token');
  const myId = localStorage.getItem('hasura_user_id');

  if (!token || !myId) return null;

  return (
    <ApolloProvider
      client={sharedApolloClient({
        uri: hasuraUri,
        token,
        secure: process.env.NODE_ENV === 'production',
      })}
    >
      <Watcher />
    </ApolloProvider>
  );
};
