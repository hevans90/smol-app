import { useMutation, useQuery, useSubscription } from '@apollo/client';
import { useStore } from '@nanostores/react';
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
import { useMyHasuraUser } from '../../../hooks/useMyHasuraId';
import Select from '../ui/Select';
import { UserListFilters, leagueMap } from './UserListFilters';

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

  const { data: userProfile, loading: userLoading } = useMyHasuraUser();

  const filters = useStore(userListFilterStore);

  const [filteredUsers, setfilteredUsers] = useState(userData?.user);

  const bumpMyUserToTop = (data: UsersSubSubscription['user']) => {
    const myUserId = userProfile?.id;
    const myData = data.find(({ id }) => id === myUserId);
    invariant(myData);
    const newData = [...data].filter(({ id }) => id !== myUserId);
    newData.unshift(myData);
    return newData;
  };

  useEffect(() => {
    if (userData && userProfile) {
      const bumpedData = bumpMyUserToTop(userData.user);
      const myUserId = userProfile?.id;
      if (filters.length) {
        let filtered = bumpedData.filter(({ id, user_league_mechanics }) =>
          filters.every(
            (filter) =>
              (isLeagueFilter(filter) &&
                user_league_mechanics
                  .map(({ mechanic }) => mechanic)
                  .includes(filter.league as League_Type_Enum)) ||
              id === myUserId
          )
        );
        setfilteredUsers(filtered);
      } else {
        setfilteredUsers(bumpedData);
      }
    }
  }, [filters, userData]);

  if (loading || leaguesLoading || userLoading) return <Spinner />;

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
        {filteredUsers?.map((user, i) => {
          const isMe = user.id === userProfile?.id;

          invariant(leagues);

          const myUnselectedLeagues = leagues.league_type
            .map(({ value }) => ({
              value,
              display: leagueMap?.[value as League_Type_Enum] ?? value,
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
                          title={leagueMap?.[mechanic] ?? mechanic}
                          src={`/league-icons/${mechanic}.webp`}
                          alt={leagueMap?.[mechanic] ?? mechanic}
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
