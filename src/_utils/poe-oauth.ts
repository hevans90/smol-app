// The PoE OAuth scopes a login asks for. Shared by the browser (authorize
// URL) and netlify/functions/verify.ts (token exchange) so they can never
// drift apart.
//   account:profile   who you are
//   account:stashes   "Stash check" on the order book
export const POE_OAUTH_SCOPES = 'account:profile account:stashes';

// The separate, opt-in grant behind "Share my atlas" on the Farm page. Its
// token is the only PoE token the server keeps (encrypted, in
// atlas_connection), so it is limited to the one scope the atlas sync needs:
// it cannot read stashes, characters or the profile.
export const POE_ATLAS_SCOPES = 'account:league_accounts';

export const POE_CLIENT_ID = 'smolapp';
export const POE_REDIRECT_URI = 'https://smol-app.netlify.app/api/auth';
