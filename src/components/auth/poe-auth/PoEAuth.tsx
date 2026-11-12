import { Buffer } from 'buffer';

import { isAfter } from 'date-fns';
import { useEffect, useState } from 'react';
import { poeStore } from '../../../_state/poe.state';
import {
  POE_ATLAS_SCOPES,
  POE_CLIENT_ID,
  POE_OAUTH_SCOPES,
  POE_REDIRECT_URI,
} from '../../../_utils/poe-oauth';
import { myProfileHref } from '../../react/profile/links';

// PKCE secrets for one authorize redirect, kept in localStorage under
// `${prefix}_verifier` / `${prefix}_state` until verify.astro consumes them.
// The login ('poe') and the atlas opt-in ('poe_atlas') use separate prefixes
// so verify.astro can tell which flow a callback belongs to.
const generateAuthSecrets = async (prefix: string) => {
  localStorage.removeItem(`${prefix}_verifier`);
  localStorage.removeItem(`${prefix}_state`);

  function base64urlEncode(value: Uint8Array) {
    return Buffer.from(value)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  // Generate a random secret
  const state = crypto.getRandomValues(new Uint8Array(8));
  const secret = crypto.getRandomValues(new Uint8Array(32));
  const codeVerifier = base64urlEncode(secret);
  const poeState = base64urlEncode(state);

  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);

  // Hash the code verifier using SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

  const codeChallenge = base64urlEncode(new Uint8Array(hashBuffer));

  localStorage.setItem(`${prefix}_verifier`, codeVerifier);
  localStorage.setItem(`${prefix}_state`, poeState);

  return { poeState, codeChallenge };
};

const generateUrlParams = async (prefix = 'poe', scope = POE_OAUTH_SCOPES) => {
  const { poeState, codeChallenge } = await generateAuthSecrets(prefix);

  return new URLSearchParams({
    client_id: POE_CLIENT_ID,
    response_type: 'code',
    scope,
    state: poeState,
    redirect_uri: POE_REDIRECT_URI,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });
};

// Members who logged in before the account:stashes scope was added hold a
// token without it. Rather than forcing everyone to re-login, the feature
// that needs the scope calls this lazily (only once someone actually tries
// to use it) to grab a fresh token with every current scope, then bounces
// back to wherever they were via poe_return_to (see verify.astro).
export const startPoEReauth = async (returnTo?: string) => {
  localStorage.setItem(
    'poe_return_to',
    returnTo ?? window.location.pathname + window.location.search,
  );
  const params = await generateUrlParams();
  window.location.href = `https://www.pathofexile.com/oauth/authorize?${params.toString()}`;
};

// "Share my atlas" on the Farm page: a second, separate grant limited to
// POE_ATLAS_SCOPES. verify.astro hands its code to /api/atlas-connect, which
// keeps the resulting token server-side; the login token in this browser is
// not replaced.
export const startAtlasConnect = async () => {
  localStorage.setItem(
    'poe_atlas_return_to',
    window.location.pathname + window.location.search,
  );
  const params = await generateUrlParams('poe_atlas', POE_ATLAS_SCOPES);
  window.location.href = `https://www.pathofexile.com/oauth/authorize?${params.toString()}`;
};

// Signs the member out of the app entirely: the PoE token and the hasura
// token minted alongside it. Dispatches `storage` so the auth modal reacts.
export const clearPoESession = () => {
  localStorage.removeItem('poe_token');
  localStorage.removeItem('poe_expiry');
  localStorage.removeItem('poe_username');
  localStorage.removeItem('hasura_user_id');
  localStorage.removeItem('hasura_token');
  window.dispatchEvent(new Event('storage'));

  poeStore.set({ expiry: '', token: '', username: '', id: '' });
};

const PoEAuth = ({ logoutOnly }: { logoutOnly?: boolean }) => {
  const [url, setUrl] = useState<string>();
  const [loggedIn, setloggedIn] = useState<boolean>(false);
  // PoE token has lapsed but the member is still signed in to the app (the
  // hasura token has no expiry). PoE-backed features — stash check, profile,
  // characters — are off until they reconnect.
  const [expired, setExpired] = useState<boolean>(false);
  const [username, setUsername] = useState<string | null>(
    localStorage.getItem('poe_username'),
  );

  const logout = () => {
    clearPoESession();
    setUsername(null);
  };

  useEffect(() => {
    const existingUsername = localStorage.getItem('poe_username');
    const existingToken = localStorage.getItem('poe_token');
    const existingExpiry = localStorage.getItem('poe_expiry');

    const loggedInCheck =
      !!existingUsername &&
      !!existingToken &&
      !!existingExpiry &&
      isAfter(new Date(existingExpiry), new Date());

    setloggedIn(loggedInCheck);
    setExpired(
      !loggedInCheck &&
        !!existingUsername &&
        !!localStorage.getItem('hasura_token'),
    );

    if (loggedInCheck) {
      poeStore.set({
        expiry: existingExpiry,
        token: existingToken,
        username: existingUsername,
        id: '',
      });
    }

    // Only the instance that actually renders the login link may mint PKCE
    // secrets: they live in localStorage, so a second (logoutOnly) instance
    // generating its own would overwrite the verifier the link depends on.
    if (!loggedInCheck && !logoutOnly) {
      generateUrlParams().then((params) =>
        setUrl(
          `https://www.pathofexile.com/oauth/authorize?${params.toString()}`,
        ),
      );
    }
  }, [username]);

  if (loggedIn)
    return (
      <div className="flex items-center gap-3 rounded border-2 border-primary-800 bg-gray-950">
        <img src="/poe-logo-original.png" className="h-12" />
        <div className="flex grow justify-between">
          <a href={myProfileHref()}>
            <div className="hidden text-primary-500 md:block">{username}</div>
          </a>
          <button
            onClick={logout}
            className="mr-2 bg-transparent hover:bg-transparent hover:text-primary-300"
          >
            Logout
          </button>
        </div>
      </div>
    );

  if (logoutOnly && expired)
    return (
      <div
        className="flex items-center gap-3 rounded border-2 border-red-400 bg-gray-950"
        title="Your PoE session expired. Reconnect to use stash check and your profile."
      >
        <img src="/poe-logo-original.png" className="h-12" alt="" />
        <div className="flex grow items-center justify-between gap-2">
          <div className="hidden text-primary-800 md:block">{username}</div>
          <button
            onClick={() => void startPoEReauth()}
            className="bg-transparent text-red-400 hover:bg-transparent hover:text-primary-300"
          >
            Reconnect
          </button>
          <button
            onClick={logout}
            className="mr-2 bg-transparent hover:bg-transparent hover:text-primary-300"
          >
            Logout
          </button>
        </div>
      </div>
    );

  if (logoutOnly) return <></>;
  return (
    <>
      <a
        href={url}
        className="flex items-center gap-3 rounded border-2 border-primary-800 hover:border-primary-300 "
      >
        <img src="/poe-logo-original.png" className="h-12" />
        <div className="mr-2 grow text-end text-primary-500">Login</div>
      </a>
    </>
  );
};

export default PoEAuth;
