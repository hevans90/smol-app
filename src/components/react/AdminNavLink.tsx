import { ApolloProvider } from '@apollo/client';
import { twMerge } from 'tailwind-merge';
import { apolloBootstrapper } from '../../_utils/apollo-bootstrapper';
import { useAdminAccess } from '../../hooks/useAdminAccess';

const AdminNavLinkInner = ({ className }: { className?: string }) => {
  const { isAdmin, adminPending } = useAdminAccess();

  if (!isAdmin && !adminPending) return null;

  const isCurrent = window.location.pathname.startsWith('/admin');

  return (
    <a
      href="/admin"
      className={twMerge(
        className,
        isCurrent
          ? 'bg-gray-800 text-primary-500'
          : 'bg-gray-900 hover:bg-gray-800 hover:text-primary-500',
      )}
    >
      Admin
    </a>
  );
};

/**
 * Nav item that appears (in realtime) only for users with the admin flag.
 * Runs its own Apollo client because the navigation lives outside the
 * page-level GraphQL providers; useAdminAccess doubles as the token
 * upgrade/downgrade watcher on every page.
 */
export const AdminNavLink = ({
  hasuraUri,
  className,
}: {
  hasuraUri: string;
  className?: string;
}) => {
  const token = localStorage.getItem('hasura_token');
  const myId = localStorage.getItem('hasura_user_id');

  if (!token || !myId) return null;

  return (
    <ApolloProvider
      client={apolloBootstrapper({
        uri: hasuraUri,
        token,
        secure: process.env.NODE_ENV === 'production',
      })}
    >
      <AdminNavLinkInner className={className} />
    </ApolloProvider>
  );
};
