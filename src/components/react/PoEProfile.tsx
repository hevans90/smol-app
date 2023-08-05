import { usePoEProfile } from '../../hooks/usePoEProfile';
import { Spinner } from './Spinner';

const PoEProfile = () => {
  const { token, loading, profile } = usePoEProfile();

  return (
    <>
      <h2 className="text-xl text-primary-500">
        {token ? 'PoE Profile' : 'Login via PoE to load your profile'}
      </h2>
      <div className="my-4 w-full">
        {loading && <Spinner width={30} />}{' '}
        {profile && (
          <div className="flex flex-col">
            {Object.entries(profile).map(([key, value], i) => (
              <div key={i} className="flex">
                <label className="w-12 mr-4">{key}</label>
                <span>{typeof value === 'string' ? value : value?.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default PoEProfile;
