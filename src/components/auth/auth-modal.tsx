import { IconCheck } from '@tabler/icons-react';
import { useEffect, useState, type ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';
import GraphQLAppWrapper from '../../_utils/GraphQLAppWrapper';
import { LeagueMembershipStatus } from '../react/graphql-provided/LeagueMembershipNotice';
import { Button } from '../react/ui/Button';
import { Dialog, DialogContent, DialogHeading } from '../react/ui/Dialog';
import { getStoredDiscordUser, prepareDiscordLink } from './discord-auth/DiscordAuth';
import { clearPoESession, startPoEReauth } from './poe-auth/PoEAuth';

type StepState = 'done' | 'current' | 'locked';

// One numbered row of the sign-in checklist: badge (number, or a tick once
// done), what the step is and why it's needed, and its action on the right.
const Step = ({
  number,
  state,
  title,
  reason,
  children,
}: {
  number: number;
  state: StepState;
  title: string;
  reason: string;
  children: ReactNode;
}) => (
  <li
    className={twMerge(
      'flex items-center gap-3 rounded border p-3',
      state === 'current' && 'border-primary-800 bg-gray-950',
      state === 'done' && 'border-emerald-800 bg-gray-950',
      state === 'locked' && 'border-gray-700 opacity-60',
    )}
  >
    <div
      aria-hidden
      className={twMerge(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm',
        state === 'done'
          ? 'border-emerald-500 text-emerald-400'
          : 'border-primary-800 text-primary-500',
      )}
    >
      {state === 'done' ? <IconCheck size={18} /> : number}
    </div>
    <div className="min-w-0 grow">
      <div className="text-primary-500">
        {title}
        {state === 'done' && <span className="sr-only"> (done)</span>}
      </div>
      <div className="text-sm text-primary-800">{reason}</div>
    </div>
    <div className="shrink-0">{children}</div>
  </li>
);

export const AuthModal = ({
  discordOauthUrl,
  hasuraUri,
}: {
  discordOauthUrl: string;
  hasuraUri: string;
}) => {
  const [loginState, setLoginState] = useState<{
    hasuraAccessToken: string | null;
    poeUsername: string | null;
    discordUser: ReturnType<typeof getStoredDiscordUser>;
  }>();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const handleStorage = () => {
      // a failed login round trip can leave the literal string "undefined"
      // behind; treat that as signed out so step 1 is offered again
      const storedToken = localStorage.getItem('hasura_token');
      const hasuraAccessToken =
        storedToken && storedToken !== 'undefined' ? storedToken : null;

      setLoginState({
        hasuraAccessToken,
        poeUsername: localStorage.getItem('poe_username'),
        discordUser: getStoredDiscordUser(),
      });
    };

    handleStorage();

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const poeDone = !!loginState?.hasuraAccessToken;
  // Discord is only needed once, to learn who to @mention — the app never
  // calls Discord with the member's token afterwards, so its expiry (about a
  // week) must not reopen this modal. Having the linked identity is enough.
  const discordDone = !!loginState?.discordUser;
  const loggedIn = poeDone && discordDone;

  const currentPage = () => window.location.pathname + window.location.search;

  return (
    <Dialog open={!loggedIn}>
      <DialogContent className="w-[34rem] max-w-[calc(100vw-2rem)] p-6">
        <div className="mb-5 flex items-center gap-3">
          <img src="/smol-logo.svg" alt="" className="h-9 w-auto" />
          <DialogHeading className="m-0 text-2xl text-primary-500">
            Sign in to Smol app
          </DialogHeading>
        </div>

        <ol className="m-0 flex list-none flex-col gap-3 p-0">
          <Step
            number={1}
            state={poeDone ? 'done' : 'current'}
            title="Path of Exile"
            reason={
              poeDone
                ? `Signed in as ${loginState?.poeUsername || 'your PoE account'}.`
                : 'Confirms who you are and lets you check your stash against orders.'
            }
          >
            {poeDone ? (
              <button
                type="button"
                onClick={clearPoESession}
                className="bg-transparent text-sm text-primary-800 underline hover:bg-transparent hover:text-primary-300"
              >
                Switch account
              </button>
            ) : (
              <Button
                type="button"
                disabled={redirecting}
                onClick={() => {
                  setRedirecting(true);
                  // returns to this page afterwards (see verify.astro)
                  void startPoEReauth(currentPage());
                }}
                className="whitespace-nowrap px-3 py-2 leading-5 text-primary-500"
              >
                {redirecting ? 'Opening PoE…' : 'Sign in with PoE'}
              </Button>
            )}
          </Step>

          <Step
            number={2}
            state={discordDone ? 'done' : poeDone ? 'current' : 'locked'}
            title="Discord"
            reason={
              discordDone
                ? `Connected as ${loginState?.discordUser?.global_name ?? 'your Discord account'}.`
                : 'So you get pinged when someone fulfils your order.'
            }
          >
            {discordDone ? null : poeDone ? (
              <a
                href={discordOauthUrl}
                onClick={prepareDiscordLink}
                className="flex items-center gap-2 whitespace-nowrap rounded-md bg-discord-500 px-3 py-2 leading-5 text-white no-underline hover:bg-discord-400 hover:text-white"
              >
                <img src="/discord-logo.svg" alt="" className="h-5 w-5" />
                Connect Discord
              </a>
            ) : (
              <Button
                type="button"
                disabled
                className="whitespace-nowrap px-3 py-2 leading-5"
                title="Sign in with Path of Exile first"
              >
                Connect Discord
              </Button>
            )}
          </Step>
        </ol>

        <div className="mt-5 border-t border-gray-700 pt-4">
          <div className="mb-1 text-sm text-primary-500">League access</div>
          {poeDone ? (
            <GraphQLAppWrapper uri={hasuraUri}>
              <LeagueMembershipStatus />
            </GraphQLAppWrapper>
          ) : (
            <div className="text-sm text-primary-800">
              Checked once you're signed in. Placing and fulfilling orders
              needs a character in the current league.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
