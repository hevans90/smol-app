import { useSubscription } from '@apollo/client';
import {
  MyLeagueMembershipDocument,
  type MyLeagueMembershipSubscription,
  type MyLeagueMembershipSubscriptionVariables,
} from '../graphql-api';

/**
 * Whether the logged-in user's PoE account has a character on the current
 * league's ladder. This replaced the guild check (GGG's API stopped exposing
 * guilds) and mirrors what Hasura enforces: non-members can read everything
 * and place or edit their own orders (so orders can go in before the league
 * starts), but cannot fulfil or contribute to anyone else's.
 *
 * A subscription, so it flips on its own once the next scheduled ladder
 * sync (every 5 minutes) picks up a newly created character.
 *
 * Must be rendered inside an ApolloProvider.
 */
export const useLeagueMembership = () => {
  const myId = localStorage.getItem('hasura_user_id')?.trim();

  const { data, loading } = useSubscription<
    MyLeagueMembershipSubscription,
    MyLeagueMembershipSubscriptionVariables
  >(MyLeagueMembershipDocument, {
    variables: { userId: myId ?? '' },
    skip: !myId,
  });

  return {
    // undefined until the first result arrives, so callers don't flash a
    // "not a member" state while loading
    isMember: data ? data.league_member.length > 0 : undefined,
    loading,
  };
};
