import { ApolloProvider } from '@apollo/client';
import { ReactNode, useState } from 'react';
import { apolloBootstrapper } from './apollo-bootstrapper';

import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';

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
      {children}
    </ApolloProvider>
  );
};

export default GraphQLAppWrapper;
