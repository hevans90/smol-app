import { useQuery } from '@apollo/client';
import invariant from 'tiny-invariant';
import {
  UserByIdDocument,
  UserByIdQuery,
  UserByIdQueryVariables,
} from '../graphql-api';

export const useMyHasuraUser = () => {
  const myId = localStorage.getItem('hasura_user_id');

  invariant(myId);

  const { data, loading } = useQuery<UserByIdQuery, UserByIdQueryVariables>(
    UserByIdDocument,
    {
      variables: { id: myId },
    }
  );

  return { data: data?.user_by_pk, loading };
};
