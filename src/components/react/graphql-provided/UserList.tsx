import { useSubscription } from '@apollo/client';
import { UsersSubDocument, UsersSubSubscription } from '../../../graphql-api';
import { Spinner } from '../Spinner';

const UserList = () => {
  const { data, loading } =
    useSubscription<UsersSubSubscription>(UsersSubDocument);

  if (loading) return <Spinner />;

  return (
    <>
      <h2 className="text-xl text-primary-500">Smol App Enjoyers</h2>
      <table className="my-4 table-auto w-full">
        <thead>
          <tr>
            <th>
              <div className="flex items-center gap-2">
                <img src="/discord-logo.svg" className="h-7" />
                Discord Account
              </div>
            </th>
            <th>
              <div className="flex items-center gap-2">
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
                <div className="flex items-center gap-2 my-3">
                  <img
                    src={`https://cdn.discordapp.com/avatars/${user?.discord_user_id}/${user?.discord_avatar}.png`}
                    height="30"
                    width="30"
                  />
                  {user?.discord_name}
                </div>
              </td>
              <td>{user?.poe_name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};

export default UserList;
