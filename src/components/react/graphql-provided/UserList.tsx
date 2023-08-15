import { useMutation, useQuery, useSubscription } from '@apollo/client';
import { useStore } from '@nanostores/react';
import { discordStore } from '../../../_state/discord.state';
import {
  DeleteUserLeagueMechanicDocument,
  DeleteUserLeagueMechanicMutation,
  DeleteUserLeagueMechanicMutationVariables,
  InsertUserLeagueMechanicDocument,
  InsertUserLeagueMechanicMutation,
  InsertUserLeagueMechanicMutationVariables,
  League_Type_Enum,
  LeaguesDocument,
  LeaguesQuery,
  UsersSubDocument,
  UsersSubSubscription,
} from '../../../graphql-api';
import { Spinner } from '../ui/Spinner';

import { IconTrash } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import invariant from 'tiny-invariant';
import { isLeagueFilter, userListFilterStore } from '../../../_state/user-list';
import Select from '../ui/Select';
import { UserListFilters } from './UserListFilters';

const UserList = () => {
  const { data: userData, loading } =
    useSubscription<UsersSubSubscription>(UsersSubDocument);

  const { data: leagues, loading: leaguesLoading } =
    useQuery<LeaguesQuery>(LeaguesDocument);

  const [deleteLeagueMechanic] = useMutation<
    DeleteUserLeagueMechanicMutation,
    DeleteUserLeagueMechanicMutationVariables
  >(DeleteUserLeagueMechanicDocument);

  const [insertLeagueMechanic] = useMutation<
    InsertUserLeagueMechanicMutation,
    InsertUserLeagueMechanicMutationVariables
  >(InsertUserLeagueMechanicDocument);

  const { id: myDiscordId } = useStore(discordStore);

  const filters = useStore(userListFilterStore);

  const [filteredUsers, setfilteredUsers] = useState(userData);

  useEffect(() => {
    if (userData) {
      if (filters.length) {
        const filtered = userData.user.filter(({ user_league_mechanics }) =>
          filters.every(
            (filter) =>
              isLeagueFilter(filter) &&
              user_league_mechanics
                .map(({ mechanic }) => mechanic)
                .includes(filter.league as League_Type_Enum)
          )
        );
        setfilteredUsers({ user: filtered });
      } else {
        setfilteredUsers(userData);
      }
    }
  }, [filters, userData]);

  if (loading || leaguesLoading) return <Spinner />;

  return (
    <table className="my-4 table-auto w-full">
      <thead>
        <tr className="border-b-primary-800 border-b-[1px]">
          <th className="w-44">
            <div className="flex items-center gap-2 mb-2">
              <img src="/discord-logo.svg" className="h-8" />
            </div>
          </th>
          <th className="w-44 hidden md:table-cell">
            <div className="flex items-center gap-2 mb-2">
              <img src="/poe-logo-original.png" className="h-12" />
            </div>
          </th>
          <th>
            {leagues && (
              <div className="flex items-center gap-2 mb-2 w-full">
                <UserListFilters leagueQuery={leagues} />
              </div>
            )}
          </th>
        </tr>
      </thead>
      <tbody>
        {filteredUsers?.user.map((user, i) => {
          const isMe = user.discord_user_id === myDiscordId;

          invariant(leagues);

          const myUnselectedLeagues = leagues.league_type
            .map(({ value }) => ({
              value,
              imgSrc: `/league-icons/${value}.webp`,
            }))
            .filter(
              (league) =>
                !user.user_league_mechanics.find(
                  ({ mechanic }) => mechanic === league.value
                )
            )
            .sort((a, b) => a.value.localeCompare(b.value));

          return (
            <tr key={i}>
              <td>
                <div
                  className={`flex items-center gap-2 my-2 ${
                    i === 0 && 'mt-4'
                  }`}
                >
                  {user?.discord_user_id ? (
                    <>
                      {user.discord_avatar ? (
                        <img
                          className="rounded-full h-8 w-8"
                          src={`https://cdn.discordapp.com/avatars/${user?.discord_user_id}/${user?.discord_avatar}.png`}
                        />
                      ) : (
                        <div className="rounded-full bg-discord-500 h-8 w-8 flex items-center justify-center">
                          <img src="/discord-logo.svg" className="h-4" />
                        </div>
                      )}

                      {user?.discord_name}
                      {isMe && <div className="text-primary-500">(you)</div>}
                    </>
                  ) : (
                    'no discord linked'
                  )}
                </div>
              </td>
              <td className="hidden md:table-cell">
                <div
                  className={`flex items-center gap-2 my-2 ${
                    i === 0 && 'mt-4'
                  }`}
                >
                  <a
                    className="flex items-center my-1"
                    href={`https://www.pathofexile.com/account/view-profile/${user.poe_name}`}
                    target="_blank"
                  >
                    {user?.poe_name}
                  </a>
                </div>
              </td>
              <td>
                <div className="flex gap-3">
                  {user.user_league_mechanics
                    .sort((a, b) => a.mechanic.localeCompare(b.mechanic))
                    .map(({ mechanic, id: mechanicId }, i) => (
                      <div className="relative h-8 md:h-10 w-8 md:w-10" key={i}>
                        <img
                          title={mechanic}
                          src={`/league-icons/${mechanic}.webp`}
                          alt={mechanic}
                        />
                        {isMe && (
                          <button
                            className="p-1 opacity-50 rounded-full bg-primary-900 absolute -top-2 -right-2 text-primary-500 hover:text-primary-300 hover:opacity-75"
                            onClick={() =>
                              deleteLeagueMechanic({
                                variables: { mechanicId },
                              })
                            }
                          >
                            <IconTrash size={20} />
                          </button>
                        )}
                      </div>
                    ))}

                  {isMe && leagues && (
                    <Select
                      onSelectChange={(value) =>
                        insertLeagueMechanic({
                          variables: {
                            mechanic: value as League_Type_Enum,
                            userId: user.id,
                          },
                        })
                      }
                      placeholder="Add"
                      showSelected={false}
                      options={myUnselectedLeagues}
                    />
                  )}
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default UserList;