import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  split,
  type DefaultOptions,
  type InMemoryCacheConfig,
  type NormalizedCacheObject,
} from '@apollo/client';

import { createClient } from 'graphql-ws';

import { GraphQLWsLink } from '@apollo/client/link/subscriptions';

import { getMainDefinition } from '@apollo/client/utilities';
import type { OperationDefinitionNode } from 'graphql';
import type { User_Item_Order } from '../graphql-api';

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
  cacheConfig = {
    typePolicies: {
      Subscription: {
        fields: {
          // each live result is the whole list, so it replaces the last one
          // (merging would keep deleted orders around)
          user_item_order: {
            merge: (_existing: User_Item_Order[] | undefined, incoming: User_Item_Order[]) =>
              incoming,
          },
        },
      },
    },
  },
  options = {},
}: ApolloBootstrapperProps) => {
  const headers = { Authorization: `Bearer ${token}` };

  const httpLink = createHttpLink({
    uri: `${secure ? 'https' : 'http'}://${uri}`,
    headers,
  });

  const wsClient = createClient({
    url: `${secure ? 'wss' : 'ws'}://${uri}`,
    connectionParams: {
      headers,
    },
    // a tab switch unsubscribes everything before the next page subscribes;
    // stay connected through it
    lazyCloseTimeout: 30_000,
  });
  const wsLink = new GraphQLWsLink(wsClient);

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
        query,
      ) as OperationDefinitionNode;
      return kind === 'OperationDefinition' && operation === 'subscription';
    },
    wsLink,
    httpLink,
  );

  // Initialize ApolloClient
  const client: ApolloClient<NormalizedCacheObject> = new ApolloClient({
    cache: new InMemoryCache(cacheConfig),
    link,
    defaultOptions: options,
    connectToDevTools: process.env.NODE_ENV !== 'production',
  });

  sockets.set(client, wsClient);
  return client;
};

const sockets = new WeakMap<ApolloClient<NormalizedCacheObject>, { dispose: () => void }>();

let shared:
  | { key: string; client: ApolloClient<NormalizedCacheObject> }
  | undefined;

/**
 * The one client every island on the page uses. Page navigation (view
 * transitions) keeps this module loaded, so the socket, its subscriptions
 * and the cache carry over between tabs instead of reconnecting each time.
 * A different token (login, role change) replaces it.
 */
export const sharedApolloClient = (props: ApolloBootstrapperProps) => {
  const key = `${props.uri}|${props.token}|${props.secure}`;
  if (shared?.key !== key) {
    if (shared) {
      shared.client.stop();
      sockets.get(shared.client)?.dispose();
    }
    shared = { key, client: apolloBootstrapper(props) };
  }
  return shared.client;
};
