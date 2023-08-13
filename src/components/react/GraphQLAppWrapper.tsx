import { ApolloProvider } from '@apollo/client';
import { useState } from 'react';
import { apolloBootstrapper } from '../../_utils/apollo-bootstrapper';

import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';
import UserList from './graphql-provided/UserList';

const GraphQLAppWrapper = ({ uri }: { uri: string }) => {
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
      <UserList />
    </ApolloProvider>
  );
};

export default GraphQLAppWrapper;
