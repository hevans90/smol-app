import { useEffect } from 'react';
import { Buffer } from 'buffer';
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

const redirectToPoeAuth = async () => {
  const { poeState, codeChallenge } = await generateAuthSecrets();

  const params = new URLSearchParams({
    client_id: 'smolapp',
    response_type: 'code',
    scope: 'account:profile',
    state: poeState,
    redirect_uri: 'https://smol-app.netlify.app/api/auth',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  window.location.href = `https://www.pathofexile.com/oauth/authorize?${params.toString()}`;
};

const PoEAuth = ({ baseHref }: { baseHref: string }) => {
  const loadResponse = async () => {};

  useEffect(() => void loadResponse(), []);

  return (
    <>
      <button
        onClick={() => redirectToPoeAuth()}
        className="mt-4 rounded border-primary-800 hover:border-primary-300 border-2 p-2 hover:text-primary-300"
      >
        Click here to test the auth route
      </button>
    </>
  );
};

export default PoEAuth;
