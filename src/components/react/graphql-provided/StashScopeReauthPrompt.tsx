import { startPoEReauth } from '../../auth/poe-auth/PoEAuth';

// Shown whenever a "Check my stash" action fails because the member's PoE
// token predates the account:stashes scope. Shared between the bulk and
// regular order dialogs so the copy/action stays consistent.
export const StashScopeReauthPrompt = () => (
  <div className="flex items-center justify-between gap-3 rounded bg-gray-800 p-2 text-sm text-primary-800">
    <span>Checking your stash needs one more permission from PoE.</span>
    <button
      type="button"
      className="shrink-0 text-primary-500 underline hover:text-primary-300"
      onClick={() => startPoEReauth()}
    >
      Re-authorize
    </button>
  </div>
);
