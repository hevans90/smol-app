import {
  ApolloClient,
  createHttpLink,
  DefaultOptions,
  InMemoryCache,
  InMemoryCacheConfig,
  NormalizedCacheObject,
  split,
} from '@apollo/client';

import { createClient } from 'graphql-ws';

import { GraphQLWsLink } from '@apollo/client/link/subscriptions';

import { getMainDefinition } from '@apollo/client/utilities';
import type { OperationDefinitionNode } from 'graphql';

export type ApolloBootstrapperProps = {
  uri: string;
  token: string;
  secure?: boolean;
  cacheConfig?: InMemoryCacheConfig;
  options?: DefaultOptions;
};

export const apolloBootstrapper = ({
  uri,
  token,
  secure = true,
  cacheConfig = {},
  options = {},
}: ApolloBootstrapperProps) => {
  const headers = { Authorization: `Bearer ${token}` };

  const httpLink = createHttpLink({
    uri: `${secure ? 'https' : 'http'}://${uri}`,
    headers,
  });

  const wsLink = new GraphQLWsLink(
    createClient({
      url: `${secure ? 'wss' : 'ws'}://${uri}`,
      connectionParams: {
        headers,
      },
    })
  );

  //   const wsLink = new GraphQLWsLink({
  //     url: `${secure ? 'wss' : 'ws'}://${uri}`,
  //     options: {
  //       lazy: true,
  //       reconnect: true,
  //       connectionParams: async () => ({
  //         headers: { ...headers },
  //       }),
  //     },
  //   });

  // split based on operation type - so queries/mutations go via HTTP and subscriptions go via WS
  const link = split(
    ({ query }) => {
      const { kind, operation } = getMainDefinition(
        query
      ) as OperationDefinitionNode;
      return kind === 'OperationDefinition' && operation === 'subscription';
    },
    wsLink,
    httpLink
  );

  // Initialize ApolloClient
  const client: ApolloClient<NormalizedCacheObject> = new ApolloClient({
    cache: new InMemoryCache(cacheConfig),
    link,
    defaultOptions: options,
    //remove in production
    connectToDevTools: true,
  });

  return client;
};
