import invariant from 'tiny-invariant';

export const useMyHasuraId = () => {
  const myId = localStorage.getItem('hasura_user_id');

  invariant(myId);
  return myId;
};
