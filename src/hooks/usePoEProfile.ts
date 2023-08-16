import { useStore } from '@nanostores/react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { poeStore } from '../_state/poe.state';

type PoEProfile = {
  uuid: string;
  name: string;
  realm?: 'pc' | 'xbox' | 'sony';
  guild?: { name: string };
  twitch?: { name: string };
};

export const usePoEProfile = () => {
  const { token: access_token } = useStore(poeStore);

  useEffect(() => setToken(access_token), [access_token]);

  const [token, setToken] = useState<string | undefined>(undefined);
  const [profile, setProfile] = useState<PoEProfile>();
  const [loading, setLoading] = useState(false);

  const loadProfile = async () => {
    setProfile(undefined);
    setLoading(true);

    const response = await fetch(`https://api.pathofexile.com/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();

    setLoading(false);
    setProfile(data);
    toast.success('Profile loaded');
  };

  useEffect(() => {
    if (token) {
      void loadProfile();
    }
  }, [token]);

  return { token, loading, profile };
};
