import { useCallback, useState } from 'react';
import type { GGGCharacterResponse, GGGItem } from '../models/ggg-responses';

const cache: {
  [key: string]: { data: GGGCharacterResponse; timestamp: number };
} = {};

const useCharacterItems = (): {
  character: GGGCharacterResponse['character'] | null;
  items: GGGItem[] | null;
  loading: boolean;
  error: string | null;
  fetchItems: (
    accountName: string,
    realm: string,
    character: string,
  ) => Promise<void>;
} => {
  const [character, setCharacter] = useState<
    GGGCharacterResponse['character'] | null
  >(null);
  const [items, setItems] = useState<GGGItem[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(
    async (accountName: string, realm: string, character: string) => {
      setItems([]);
      setCharacter(null);

      const cacheKey = `${accountName}-${realm}-${character}`;
      const cacheTTL = 120 * 1000; // 2 minutes in milliseconds
      const currentTime = Date.now();

      // Check if the data is in cache and still valid
      if (
        cache[cacheKey] &&
        currentTime - cache[cacheKey].timestamp < cacheTTL
      ) {
        // Data is in cache and still valid, use it
        const cachedData = cache[cacheKey].data;
        setItems(cachedData.items);
        setCharacter(cachedData.character);
        return;
      }

      const url = '/api/get-character-items';
      const params = new URLSearchParams({
        accountName,
        realm,
        character,
      });

      setLoading(true);
      setError(null);

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

        const data: GGGCharacterResponse = await response.json();

        // Cache the response data
        cache[cacheKey] = {
          data,
          timestamp: currentTime,
        };

        setItems(data?.items);
        setCharacter(data?.character);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch character items.');
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { character, items, loading, error, fetchItems };
};

export default useCharacterItems;
