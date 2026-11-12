// Profiles live at /profile/<account>, with the account's "#1234"
// discriminator written "-1234" (# can't sit in a URL path), as
// pathofexile.com does in its own profile URLs.

export const accountSlug = (account: string) => account.replace(/#(\d+)$/, '-$1');
export const accountFromSlug = (slug: string) => slug.replace(/-(\d+)$/, '#$1');

/**
 * Link to a member's profile: by PoE account name, or a user with one.
 * Users without a PoE name fall back to their id.
 */
export const profileHref = (
  target: string | { id: string; poe_name?: string | null },
): string => {
  if (typeof target === 'string') return `/profile/${encodeURIComponent(accountSlug(target))}`;
  return target.poe_name
    ? profileHref(target.poe_name)
    : `/profile?id=${encodeURIComponent(target.id)}`;
};

/** Your own profile, once signed in to Path of Exile. */
export const myProfileHref = () => {
  const account = localStorage.getItem('poe_username')?.trim();
  return account ? profileHref(account) : '/profile';
};
