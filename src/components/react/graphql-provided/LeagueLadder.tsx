import { useQuery, useSubscription } from '@apollo/client';
import React, { useEffect, useState } from 'react';

import { twMerge } from 'tailwind-merge';
import { playerLevelExperienceMap } from '../../../_utils/constants';
import {
  LeagueCharactersDocument,
  LeagueDocument,
  type Character,
  type LeagueCharactersSubscription,
  type LeagueQuery,
} from '../../../graphql-api';
import useCharacterItems from '../../../hooks/useCharacterItems';
import { CharacterSheet } from '../character-sheet/CharacterSheet';
import { ModalDrawer } from '../ui/ModalDrawer';
import { Spinner } from '../ui/Spinner';

export const LeagueLadder = () => {
  const { data: leagueInfo, loading: leagueInfoLoading } =
    useQuery<LeagueQuery>(LeagueDocument);

  const { data: charactersResponse, loading: charactersLoading } =
    useSubscription<LeagueCharactersSubscription>(LeagueCharactersDocument);

  const league = leagueInfo?.league?.[0];
  const leagueName = league?.id;

  return (
    <div className="mt-44 flex h-full w-full flex-col overflow-hidden md:mt-32 lg:mt-24">
      <div className="my-3 flex items-center md:my-6 md:mt-12 md:items-baseline">
        {league && league?.url ? (
          <>
            <h1 className="m-0 text-2xl xl:text-3xl 2xl:text-4xl">
              <a href={league.url} target="_blank">
                {leagueName}
              </a>
            </h1>
            <span className="hidden truncate text-lg md:inline">
              {league.description}
            </span>
          </>
        ) : (
          <Spinner />
        )}
      </div>

      <CharacterTable characters={charactersResponse?.character ?? []} />
    </div>
  );
};

const CharacterTable: React.FC<{ characters: Character[] }> = ({
  characters,
}) => {
  const initialRowsPerPage = parseInt(
    localStorage.getItem('rowsPerPage') || '25',
    10,
  );

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(
    null,
  );

  const {
    items,
    character,
    loading: characterDetailsLoading,
    error,
    fetchItems,
  } = useCharacterItems();

  useEffect(() => {
    if (selectedCharacter) {
      fetchItems(
        selectedCharacter.poe_account_name,
        'pc',
        selectedCharacter.name,
      ).then(() => setDrawerOpen(true));
    }
  }, [selectedCharacter]);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);
  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: 'asc' | 'desc' | null;
  }>({
    key: null,
    direction: null,
  });

  // Load `currentPage` from query string and `rowsPerPage` from localStorage on initial load
  useEffect(() => {
    if (characters.length) {
      const params = new URLSearchParams(window.location.search);

      // 1. Load currentPage from query string
      const pageFromQuery = parseInt(params.get('page') || '1', 10);
      const totalPages = Math.ceil(characters.length / rowsPerPage);

      if (pageFromQuery > 0 && pageFromQuery <= totalPages) {
        setCurrentPage(pageFromQuery);
      } else {
        // Invalid page, remove page from query string
        params.delete('page');
        window.history.replaceState(
          null,
          '',
          `${window.location.pathname}?${params.toString()}`,
        );
      }
    }
  }, [characters.length]);

  const sortedCharacters = sortConfig.key
    ? [...characters].sort((a, b) => {
        //@ts-ignore
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        //@ts-ignore
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      })
    : characters;

  const totalPages = Math.ceil(sortedCharacters.length / rowsPerPage);

  const indexOfLastCharacter = currentPage * rowsPerPage;
  const indexOfFirstCharacter = indexOfLastCharacter - rowsPerPage;
  const currentCharacters = sortedCharacters.slice(
    indexOfFirstCharacter,
    indexOfLastCharacter,
  );

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
      const params = new URLSearchParams(window.location.search);
      params.set('page', page.toString());
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}?${params.toString()}`,
      );
    }
  };

  const handleRowsPerPageChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const newValue = Number(event.target.value);
    setRowsPerPage(newValue);
    localStorage.setItem('rowsPerPage', newValue.toString());
    setCurrentPage(1);
  };

  const handleSort = (column: string) => {
    setCurrentPage(1);
    if (!sortConfig.direction) {
      setSortConfig({
        key: column,
        direction: 'asc',
      });
    } else if (sortConfig.direction === 'asc') {
      setSortConfig({
        key: column,
        direction: 'desc',
      });
    } else {
      setSortConfig({ key: null, direction: null });
    }
  };

  const calculateProgress = (level: number, experience: number) => {
    const currentLevelExperience = playerLevelExperienceMap[level];
    const nextLevelExperience = playerLevelExperienceMap[level + 1];
    if (!nextLevelExperience || !currentLevelExperience) return 100;

    const progress =
      ((experience - currentLevelExperience) /
        (nextLevelExperience - currentLevelExperience)) *
      100;
    return Math.min(progress, 100);
  };

  return (
    <>
      <div className="flex h-[85%] w-full flex-col lg:h-[90%]">
        {/* Table Wrapper */}
        <div className="grow overflow-auto">
          <table className="min-w-full table-fixed text-left text-sm xl:text-base 2xl:text-xl">
            <thead className="sticky top-0 z-30 bg-gray-900 text-primary-500">
              <tr>
                <th className="w-16 px-4 py-2 font-medium">Rank</th>
                <th className="w-32 px-4 py-2 font-medium">Account</th>
                <th className="w-48 px-4 py-2 font-medium">Character</th>
                <th
                  className="text w-32 cursor-pointer select-none px-4 py-3 font-medium"
                  onClick={() => handleSort('class')}
                >
                  <button className="flex w-full whitespace-nowrap bg-transparent hover:bg-transparent">
                    <span>Class &nbsp;&nbsp;&nbsp;</span>

                    {sortConfig.key === null && (
                      <span className="text-primary-800 opacity-50">↑ ↓</span>
                    )}

                    {sortConfig.key === 'class' ? (
                      sortConfig.direction === 'asc' ? (
                        <span>↑</span>
                      ) : (
                        <span>↓</span>
                      )
                    ) : (
                      ''
                    )}
                  </button>
                </th>
                <th className="w-32 px-4 py-2 font-medium">Level</th>
                <th className="w-32 px-4 py-2 font-medium">Experience</th>
                <th className="w-32 px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody className="bg-gray-950 text-primary-800">
              {currentCharacters.map((character) => {
                const progress = calculateProgress(
                  character.level,
                  character.experience,
                );
                const isLevel100 = character.level === 100;

                return (
                  <tr
                    onClick={() => {
                      setSelectedCharacter(character);
                    }}
                    key={character.id}
                    className={twMerge(
                      'cursor-pointer border-b border-primary-900 border-opacity-30 hover:bg-gray-900',
                      character.retired && 'opacity-50',
                    )}
                  >
                    <td className="px-4 py-2">{character.rank}</td>
                    <td className="px-4 py-2">{character.poe_account_name}</td>
                    <td className="px-4 py-2">
                      {character.name}

                      {character.retired && (
                        <span className="text-red-700"> (Retired)</span>
                      )}
                    </td>
                    <td className="px-4 py-2">{character.class}</td>
                    <td className="px-4 py-2">{character.level}</td>
                    <td className="px-4 py-2">{character.experience}</td>
                    <td className="px-4 py-2">
                      <div className="relative h-2">
                        <div
                          className={twMerge(
                            'absolute z-10 h-full bg-gray-600',
                            isLevel100 ? 'bg-primary-400' : 'bg-primary-800',
                          )}
                          style={{
                            width: `${progress}%`,
                          }}
                        />
                        <div className="absolute h-full w-full bg-gray-700"></div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls - Always at the Bottom */}
        <div className="flex grow-0 items-center justify-between px-4 py-2 text-primary-600 sm:px-0 md:mt-4">
          <div>
            <label className="hidden md:inline">Rows per page:</label>
            <select
              className="rounded bg-gray-800 px-2 py-1 text-center md:ml-2"
              value={rowsPerPage}
              onChange={handleRowsPerPageChange}
            >
              {[10, 25, 50, 100].map((rows) => (
                <option key={rows} value={rows}>
                  {rows}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center">
            <button
              className="rounded-l bg-gray-900 px-4 py-2 hover:bg-gray-800"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Prev
            </button>
            <span className="whitespace-nowrap px-4 py-2 text-primary-500 md:hidden">{`${currentPage} / ${totalPages}`}</span>
            <span className="hidden px-4 py-2 text-primary-500 md:inline">{`Page ${currentPage} of ${totalPages}`}</span>
            <button
              className="rounded-r bg-gray-900 px-4 py-2 hover:bg-gray-800"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <ModalDrawer
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedCharacter(null);
        }}
      >
        {!characterDetailsLoading &&
          selectedCharacter &&
          character &&
          items?.length && (
            <CharacterSheet
              accountName={selectedCharacter.poe_account_name}
              items={items}
              character={character}
            />
          )}
      </ModalDrawer>
    </>
  );
};

export default CharacterTable;
