import { Buffer } from 'buffer';

import { isAfter } from 'date-fns';
import { useEffect, useState } from 'react';
import { poeStore } from '../../../_state/poe.state';

const generateAuthSecrets = async () => {
  localStorage.removeItem('poe_verifier');
  localStorage.removeItem('poe_state');

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

  localStorage.setItem('poe_verifier', codeVerifier);
  localStorage.setItem('poe_state', poeState);

  return { poeState, codeChallenge };
};

const generateUrlParams = async () => {
  const { poeState, codeChallenge } = await generateAuthSecrets();

  return new URLSearchParams({
    client_id: 'smolapp',
    response_type: 'code',
    scope:
      'account:profile account:characters account:stashes account:league_accounts',
    state: poeState,
    redirect_uri: 'https://smol-app.netlify.app/api/auth',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });
};

const PoEAuth = () => {
  const [url, setUrl] = useState<string>();
  const [loggedIn, setloggedIn] = useState<boolean>(false);
  const [username, setUsername] = useState<string | null>(
    localStorage.getItem('poe_username')
  );

  const logout = () => {
    localStorage.removeItem('poe_token');
    localStorage.removeItem('poe_expiry');
    localStorage.removeItem('poe_username');
    poeStore.set({ expiry: '', token: '', username: '', id: '' });
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

    if (loggedInCheck) {
      poeStore.set({
        expiry: existingExpiry,
        token: existingToken,
        username: existingUsername,
        id: '',
      });
    }

    if (!loggedInCheck) {
      generateUrlParams().then((params) =>
        setUrl(
          `https://www.pathofexile.com/oauth/authorize?${params.toString()}`
        )
      );
    }
  }, [username]);

  if (loggedIn)
    return (
      <div className="flex items-center gap-3 rounded border-primary-800 border-2 ">
        <img src="/poe-logo-original.png" className="h-12" />
        <div className="text-primary-500 hidden md:block">{username}</div>
        <button
          onClick={logout}
          className="bg-gray-950 hover:bg-gray-950 text-end mr-2 grow hover:text-primary-300"
        >
          Logout
        </button>
      </div>
    );

  return (
    <>
      <a
        href={url}
        className="flex items-center gap-3 rounded border-primary-800 hover:border-primary-300 border-2 "
      >
        <img src="/poe-logo-original.png" className="h-12" />
        <div className="text-end mr-2 grow text-primary-500">Login</div>
      </a>
    </>
  );
};

export default PoEAuth;
