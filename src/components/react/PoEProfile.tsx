import { useMutation } from '@apollo/client';
import toast from 'react-hot-toast';
import invariant from 'tiny-invariant';
import {
  SetMyGuildDocument,
  SetMyGuildMutation,
  SetMyGuildMutationVariables,
} from '../../graphql-api';
import { useMyHasuraUser } from '../../hooks/useMyHasuraId';
import { usePoEProfile } from '../../hooks/usePoEProfile';
import { Button } from './ui/Button';
import { Spinner } from './ui/Spinner';

const PoEProfile = () => {
  const { token, loading, profile } = usePoEProfile();

  const { data: hasuraUser, loading: userLoading } = useMyHasuraUser();

  const [setMyGuild, { loading: setMyGuildLoading }] = useMutation<
    SetMyGuildMutation,
    SetMyGuildMutationVariables
  >(SetMyGuildDocument);

  if (userLoading || !hasuraUser) return <Spinner />;

  return (
    <>
      <h2 className="text-primary-500">
        {token ? 'PoE Profile' : 'Login via PoE to load your profile'}
      </h2>
      <div className="my-4">
        {loading && <Spinner width={30} />}{' '}
        {profile && (
          <div className="flex flex-col gap-4">
            <div>
              {Object.entries(profile).map(([key, value], i) => (
                <div key={i} className="flex">
                  <label className="w-12 mr-4">{key}</label>
                  <span>{typeof value === 'string' ? value : value?.name}</span>
                </div>
              ))}
            </div>
            {profile?.guild?.name ? (
              <Button
                disabled={setMyGuildLoading || !!hasuraUser.guild}
                onClick={() => {
                  invariant(profile.guild);
                  invariant(profile.guild.name);
                  setMyGuild({
                    variables: {
                      userId: hasuraUser?.id as string,
                      guild: profile.guild.name,
                    },
                  })
                    .then(() => toast.success('Guild successfully saved!'))
                    .catch((e) => {
                      toast.error(
                        'Something went wrong while trying to save your guild :('
                      );
                      toast.error(e);
                      console.error(e);
                    });
                }}
              >
                {!!hasuraUser.guild ? (
                  <>
                    Guild saved:{' '}
                    <span className="text-primary-800">{hasuraUser.guild}</span>
                  </>
                ) : (
                  'Save your Guild'
                )}
              </Button>
            ) : (
              <div className="text-red-400 ">
                You are not in a guild, go join one you loner.
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default PoEProfile;
