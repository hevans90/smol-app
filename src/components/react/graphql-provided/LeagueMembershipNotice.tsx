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
      No character on the league ladder yet. You can browse, but placing and
      fulfilling orders needs one (the ladder syncs every 5 minutes).
    </div>
  );
};

// Explains to a logged-in non-member why order actions are being refused.
// Fixed + out-of-flow so it never disturbs the order books' own layout math.
export const LeagueMembershipNotice = () => {
  const { isMember } = useLeagueMembership();
  const { data: leagueData } = useQuery<LeagueQuery>(LeagueDocument);

  if (isMember !== false) return null;

  const league = leagueData?.app_config_by_pk?.league_name;
  const poeName = localStorage.getItem('poe_username');

  return (
    <div
      role="status"
      className="fixed bottom-4 left-4 z-20 max-w-sm rounded-md border border-red-400 bg-gray-900 p-3 text-sm shadow-lg"
    >
      <div className="mb-1 font-bold text-red-400">
        No character in the league yet
      </div>
      <div>
        {poeName ? (
          <>
            <span className="text-primary-500">{poeName}</span> has
          </>
        ) : (
          'Your PoE account has'
        )}{' '}
        no character on the {league ? `${league} ` : 'league '}ladder. You can
        browse orders, but creating, fulfilling and contributing are disabled
        until you make one. The ladder syncs every 5 minutes.
      </div>
    </div>
  );
};
