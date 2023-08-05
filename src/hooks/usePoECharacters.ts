import { useStore } from '@nanostores/react';
import { useEffect, useState } from 'react';
import { poeStore } from '../_state/poe.state';

type PoECharacter = {
  id: string;
  name: string;
  class: string;
  league?: string;
  level: number;
  equipment?: { icon: string }[];
};

export const usePoECharacters = () => {
  const { token: access_token } = useStore(poeStore);

  useEffect(() => setToken(access_token), [access_token]);

  const [token, setToken] = useState<string | undefined>(undefined);
  const [characters, setCharacters] = useState<PoECharacter[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const loadProfile = async () => {
    setCharacters([]);
    setLoading(true);

    let response = await fetch(`https://api.pathofexile.com/character`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data: { characters?: PoECharacter[]; error?: Error } =
      await response.json();

    if (data.characters) {
      setCharacters(data.characters);
    }

    if (data.error) {
      setError(data.error.message);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (token) {
      void loadProfile();
    }
  }, [token]);

  return { token, loading, characters, error };
};
