import { ApolloProvider } from '@apollo/client';
import { useState, type ReactNode } from 'react';
import { Toaster, resolveValue, toast } from 'react-hot-toast';
import { apolloBootstrapper } from './apollo-bootstrapper';

import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';
import { Toast } from '../components/react/ui/Toast';

const GraphQLAppWrapper = ({
  uri,
  children,
}: {
  uri: string;
  children: ReactNode;
}) => {
  if (process.env.NODE_ENV !== 'production') {
    // Adds messages only in a dev environment
    loadDevMessages();
    loadErrorMessages();
  }
  const [hasuraAccessToken, setHasuraAccessToken] = useState<string | null>(
    localStorage.getItem('hasura_token') ?? null
  );

  if (!hasuraAccessToken) {
    return <>Log in via PoE to get started.</>;
  }

  return (
    <ApolloProvider
      client={apolloBootstrapper({ uri, token: hasuraAccessToken })}
    >
      <Toaster position="bottom-center" toastOptions={{ duration: 3000 }}>
        {(t) => (
          <Toast onClose={() => toast.dismiss(t.id)} icon={t.icon}>
            {resolveValue(t.message, t)}
          </Toast>
        )}
      </Toaster>
      {children}
    </ApolloProvider>
  );
};

export default GraphQLAppWrapper;
