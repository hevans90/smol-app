import { useMutation } from '@apollo/client';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  SetMyGuildDocument,
  type SetMyGuildMutation,
  type SetMyGuildMutationVariables,
} from '../../graphql-api';
import { useMyHasuraUser } from '../../hooks/useMyHasuraId';
import { usePoEProfile } from '../../hooks/usePoEProfile';
import { Button } from './ui/Button';

export const SetMyGuild = ({ automatic }: { automatic: boolean }) => {
  const { loading, profile } = usePoEProfile();

  const { data: hasuraUser, loading: userLoading } = useMyHasuraUser();

  const [setMyGuild, { loading: setMyGuildLoading }] = useMutation<
    SetMyGuildMutation,
    SetMyGuildMutationVariables
  >(SetMyGuildDocument);

  const handleSetGuild = () => {
    if (profile?.guild) {
      setMyGuild({
        variables: {
          userId: hasuraUser?.id as string,
          guild: profile.guild.name,
        },
      })
        .then(() => toast.success('Guild successfully saved!'))
        .catch((e) => {
          toast.error(
            'Something went wrong while trying to save your guild :(',
          );
          toast.error(e);
          console.error(e);
        });
    } else {
      console.log('No guild to save for profile', profile);
    }
  };

  useEffect(() => {
    if (automatic && profile && hasuraUser && !hasuraUser.guild) {
      handleSetGuild();
    }
  }, [profile, hasuraUser]);

  if (loading || userLoading) {
    return 'loading';
  }

  return hasuraUser && profile?.guild?.name ? (
    <Button
      disabled={setMyGuildLoading || !hasuraUser.guild}
      onClick={() => {
        handleSetGuild();
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
    <div className="text-red-400 ">You are not in a POE guild.</div>
  );
};
