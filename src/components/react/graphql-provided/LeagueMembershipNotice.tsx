import { useQuery } from '@apollo/client';
import { LeagueDocument, type LeagueQuery } from '../../../graphql-api';
import { useLeagueMembership } from '../../../hooks/useLeagueMembership';

// Inline one-liner for the login modal and profile page. This is what the
// old "Save your Guild" control used to occupy — GGG's API no longer exposes
// guilds, so membership is now "has a character on the league ladder".
// Renders nothing until the first result arrives.
export const LeagueMembershipStatus = () => {
  const { isMember } = useLeagueMembership();

  if (isMember === undefined) return null;

  return isMember ? (
    <div className="text-sm text-primary-500">
      Character found on the league ladder.
    </div>
  ) : (
    <div className="text-sm text-primary-800">
      No character on the league ladder yet. You can place orders, but
      fulfilling and contributing need one (the ladder syncs every 5 minutes).
    </div>
  );
};

/** Why fulfil / contribute is refused for a non-member, on those buttons and dialogs. */
export const NOT_A_MEMBER_REASON =
  'Fulfilling and contributing need a character on the league ladder (synced every 5 minutes).';

// Explains to a logged-in non-member why order actions are being refused.
// In the page flow above the order book, so it never covers the table.
export const LeagueMembershipNotice = () => {
  const { isMember } = useLeagueMembership();
  const { data: leagueData } = useQuery<LeagueQuery>(LeagueDocument);

  if (isMember !== false) return null;

  const league = leagueData?.app_config_by_pk?.league_name;
  const poeName = localStorage.getItem('poe_username');

  return (
    <div
      role="status"
      className="mx-4 mt-3 rounded-md border border-red-400/60 bg-gray-900 px-3 py-2 text-sm"
    >
      <span className="mr-2 font-bold text-red-400">
        No character in the league yet.
      </span>
      <span>
        {poeName ? (
          <>
            <span className="text-primary-500">{poeName}</span> has
          </>
        ) : (
          'Your PoE account has'
        )}{' '}
        no character on the {league ? `${league} ` : 'league '}ladder. You can
        place orders, but fulfilling and contributing are disabled until you
        make one. The ladder syncs every 5 minutes.
      </span>
    </div>
  );
};
