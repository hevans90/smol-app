/** Link to a member's profile, by user id or (ladder players) PoE account. */
export const profileHref = (target: { id: string } | { account: string }) =>
  'id' in target
    ? `/profile?id=${encodeURIComponent(target.id)}`
    : `/profile?account=${encodeURIComponent(target.account)}`;

/** Your own profile, by id once signed in. */
export const myProfileHref = () => {
  const id = localStorage.getItem('hasura_user_id')?.trim();
  return id ? profileHref({ id }) : '/profile';
};
