import { useMyHasuraUser } from '../../hooks/useMyHasuraId';
import { usePoEProfile } from '../../hooks/usePoEProfile';
import { SetMyGuild } from './SetMyGuild';
import { Spinner } from './ui/Spinner';

const Profile = () => {
  const { token, loading, profile } = usePoEProfile();

  const { data: hasuraUser, loading: userLoading } = useMyHasuraUser();

  if (userLoading || !hasuraUser) return <Spinner />;

  return (
    <>
      <h2 className="text-primary-500">
        {token ? 'Profile' : 'Log in via PoE to load your profile'}
      </h2>
      <div className="my-4">
        {loading && <Spinner width={30} />}{' '}
        {profile && (
          <div className="flex flex-col gap-4">
            <div>
              {Object.entries(profile).map(([key, value], i) => (
                <div key={i} className="flex">
                  <label className="mr-4 w-12">{key}</label>
                  <span>{typeof value === 'string' ? value : value?.name}</span>
                </div>
              ))}
            </div>
            <SetMyGuild automatic={false} />
          </div>
        )}
      </div>
    </>
  );
};

export default Profile;
