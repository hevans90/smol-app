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
          user_item_order: {
            merge(existing: User_Item_Order[] = [], incoming) {
              const merged = [...existing];

              incoming.forEach((incomingItem: User_Item_Order) => {
                // Find if the item already exists in the cache
                const existingItemIndex = existing.findIndex(
                  (item) => item.id === incomingItem.id,
                );

                // If the item exists, update it; otherwise, add it to the list
                if (existingItemIndex > -1) {
                  merged[existingItemIndex] = incomingItem;
                } else {
                  merged.push(incomingItem);
                }
              });

              return merged;
            },
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

  const wsLink = new GraphQLWsLink(
    createClient({
      url: `${secure ? 'wss' : 'ws'}://${uri}`,
      connectionParams: {
        headers,
      },
    }),
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
    //remove in production
    connectToDevTools: true,
  });

  return client;
};
