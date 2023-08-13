import { useSubscription } from '@apollo/client';
import { useStore } from '@nanostores/react';
import { discordStore } from '../../../_state/discord.state';
import { UsersSubDocument, UsersSubSubscription } from '../../../graphql-api';
import { Spinner } from '../Spinner';

const UserList = () => {
  const { data, loading } =
    useSubscription<UsersSubSubscription>(UsersSubDocument);

  const { id: myDiscordId } = useStore(discordStore);

  if (loading) return <Spinner />;

  return (
    <>
      <h2 className="text-xl text-primary-500">Smol App Enjoyers</h2>
      <table className="my-4 table-auto w-full">
        <thead>
          <tr className="border-b-primary-800 border-b-[1px]">
            <th>
              <div className="flex items-center gap-2 mb-2">
                <img src="/discord-logo.svg" className="h-7" />
                Discord Account
              </div>
            </th>
            <th>
              <div className="flex items-center gap-2 mb-2">
                <img src="/poe-logo-original.png" className="h-7" />
                PoE Account
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {data?.user.map((user, i) => (
            <tr key={i}>
              <td>
                <div
                  className={`flex items-center gap-2 my-1 ${
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
                      {user.discord_user_id === myDiscordId && (
                        <div className="text-primary-500">(you)</div>
                      )}
                    </>
                  ) : (
                    'no discord linked'
                  )}
                </div>
              </td>
              <td>
                <div
                  className={`flex items-center gap-2 my-1 ${
                    i === 0 && 'mt-4'
                  }`}
                >
                  <a
                    className="hover:text-primary-500 flex items-center my-1"
                    href={`https://www.pathofexile.com/account/view-profile/${user.poe_name}`}
                    target="_blank"
                  >
                    {user?.poe_name}
                  </a>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};

export default UserList;
