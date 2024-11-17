import { useCallback, useState } from 'react';

const useCharacterItems = (): {
  items: any | null;
  loading: boolean;
  error: string | null;
  fetchItems: (
    accountName: string,
    realm: string,
    character: string,
  ) => Promise<void>;
} => {
  const [items, setItems] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(
    async (accountName: string, realm: string, character: string) => {
      const url = 'https://www.pathofexile.com/character-window/get-items';

      const params = new URLSearchParams({
        accountName,
        realm,
        character,
      });

      setLoading(true);
      setError(null); // Reset error on new fetch attempt

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        setItems(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch character items.');
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { items, loading, error, fetchItems };
};

export default useCharacterItems;
