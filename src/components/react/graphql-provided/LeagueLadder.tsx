import { useQuery, useSubscription } from '@apollo/client';
import React, { useEffect, useState } from 'react';

import { twMerge } from 'tailwind-merge';
import { playerLevelExperienceMap } from '../../../_utils/constants';
import {
  LeagueCharactersDocument,
  LeagueDocument,
  type LeagueCharactersSubscription,
  type LeagueCharactersSubscriptionVariables,
  type LeagueQuery,
} from '../../../graphql-api';
import useCharacterItems from '../../../hooks/useCharacterItems';
import { CharacterSheet } from '../character-sheet/CharacterSheet';
import { CharacterStatSheet } from '../character-sheet/CharacterStatSheet';
import { RegisteredUserCount } from '../RegisteredUserCount';
import { ModalDrawer } from '../ui/ModalDrawer';
import { Spinner } from '../ui/Spinner';

export const LeagueLadder = () => {
  const { data: leagueInfo, loading: leagueInfoLoading } =
    useQuery<LeagueQuery>(LeagueDocument);

  const league = leagueInfo?.league?.[0];

  const { data: charactersResponse, loading: charactersLoading } =
    useSubscription<
      LeagueCharactersSubscription,
      LeagueCharactersSubscriptionVariables
    >(LeagueCharactersDocument, {
      variables: { leagueName: league?.id },
      skip: !league,
    });

  const leagueName = league?.id;

  return (
    <div className="mt-44 flex h-full w-full flex-col overflow-hidden md:mt-32 lg:mt-24">
      <div className="relative my-3 flex items-center gap-6 md:my-6 md:mt-12 md:items-baseline">
        <RegisteredUserCount className="absolute -top-6" />
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

type LadderCharacter = LeagueCharactersSubscription['character'][number];

// PoB stats are computed periodically by the go-server, so some characters
// (private profiles, freshly started) have none yet.
const compactNumber = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const sortAccessors: Record<
  string,
  (character: LadderCharacter) => string | number
> = {
  rank: (character) => character.rank,
  account: (character) => character.poe_account_name.toLowerCase(),
  name: (character) => character.name.toLowerCase(),
  class: (character) => character.class,
  // experience is level plus progress towards the next one
  level: (character) => Number(character.experience),
  main_skill: (character) => character.stats?.main_skill?.toLowerCase() ?? '',
  combined_dps: (character) => character.stats?.combined_dps ?? -1,
  life_es: (character) =>
    character.stats ? character.stats.life + character.stats.energy_shield : -1,
  total_ehp: (character) => character.stats?.total_ehp ?? -1,
};

const CharacterTable: React.FC<{ characters: LadderCharacter[] }> = ({
  characters,
}) => {
  const initialRowsPerPage = parseInt(
    localStorage.getItem('rowsPerPage') || '25',
    10,
  );

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCharacter, setSelectedCharacter] =
    useState<LadderCharacter | null>(null);

  const {
    items,
    character,
    passiveTree,
    loading: characterDetailsLoading,
    error,
    fetchItems,
  } = useCharacterItems();

  console.log({ passiveTree, character });

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

  const sortAccessor = sortConfig.key ? sortAccessors[sortConfig.key] : null;
  const sortedCharacters = sortAccessor
    ? [...characters].sort((a, b) => {
        if (sortAccessor(a) < sortAccessor(b)) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (sortAccessor(a) > sortAccessor(b)) {
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
    if (sortConfig.key !== column || !sortConfig.direction) {
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

  const SortableHeader: React.FC<{
    column: string;
    label: string;
    className?: string;
  }> = ({ column, label, className }) => (
    <th
      className={twMerge(
        'cursor-pointer select-none px-4 py-3 font-medium',
        className,
      )}
      onClick={() => handleSort(column)}
    >
      <button className="flex w-full items-center gap-2 whitespace-nowrap bg-transparent hover:bg-transparent">
        <span>{label}</span>

        {sortConfig.key === null && (
          <span className="text-primary-800 opacity-50">↑ ↓</span>
        )}

        {sortConfig.key === column ? (
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
  );

  return (
    <>
      <div className="flex h-[85%] w-full flex-col lg:h-[90%]">
        {/* Table Wrapper */}
        <div className="grow overflow-auto">
          {/* table-fixed only takes effect with an explicit width (min-width
              alone falls back to auto layout, letting column widths jump as
              row content changes on sort) */}
          <table className="w-full min-w-[68rem] table-fixed text-left text-sm xl:text-base 2xl:text-xl">
            <thead className="sticky top-0 z-30 bg-gray-900 text-primary-500">
              <tr>
                <SortableHeader column="rank" label="Rank" className="w-24" />
                <SortableHeader
                  column="account"
                  label="Account"
                  className="w-32"
                />
                <SortableHeader
                  column="name"
                  label="Character"
                  className="w-44"
                />
                <SortableHeader column="class" label="Class" className="w-32" />
                <SortableHeader column="level" label="Level" className="w-24" />
                <SortableHeader
                  column="main_skill"
                  label="Main Skill"
                  className="w-36"
                />
                <SortableHeader
                  column="combined_dps"
                  label="DPS"
                  className="w-24"
                />
                <SortableHeader
                  column="life_es"
                  label="Life / ES"
                  className="w-32"
                />
                <SortableHeader
                  column="total_ehp"
                  label="EHP"
                  className="w-24"
                />
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
                    <td
                      className="truncate px-4 py-2"
                      title={character.poe_account_name}
                    >
                      {character.poe_account_name}
                    </td>
                    <td className="truncate px-4 py-2" title={character.name}>
                      {character.name}

                      {character.retired && (
                        <span className="text-red-700"> (Retired)</span>
                      )}
                    </td>
                    <td className="px-4 py-2">{character.class}</td>
                    <td
                      className="px-4 py-2"
                      title={`${Number(character.experience).toLocaleString()} XP`}
                    >
                      <div>{character.level}</div>
                      <div className="relative mt-1 h-1.5 w-16">
                        <div
                          className={twMerge(
                            'absolute z-10 h-full',
                            isLevel100 ? 'bg-primary-400' : 'bg-primary-800',
                          )}
                          style={{
                            width: `${progress}%`,
                          }}
                        />
                        <div className="absolute h-full w-full bg-gray-700"></div>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div
                        className="w-full truncate text-xs xl:text-sm"
                        title={character.stats?.main_skill ?? undefined}
                      >
                        {character.stats?.main_skill ?? (
                          <span className="opacity-30">–</span>
                        )}
                      </div>
                    </td>
                    <td
                      className="px-4 py-2"
                      title={
                        character.stats
                          ? `${Math.round(character.stats.combined_dps).toLocaleString()} combined DPS`
                          : 'No PoB stats yet (private profile?)'
                      }
                    >
                      {character.stats ? (
                        compactNumber.format(character.stats.combined_dps)
                      ) : (
                        <span className="opacity-30">–</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2">
                      {character.stats ? (
                        <>
                          <span className="text-red-400">
                            {Math.round(character.stats.life).toLocaleString()}
                          </span>
                          {character.stats.energy_shield >= 1 && (
                            <span className="text-sky-300">
                              {' / '}
                              {Math.round(
                                character.stats.energy_shield,
                              ).toLocaleString()}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="opacity-30">–</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {character.stats ? (
                        compactNumber.format(character.stats.total_ehp)
                      ) : (
                        <span className="opacity-30">–</span>
                      )}
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
          (character && passiveTree && items?.length ? (
            <CharacterSheet
              accountName={selectedCharacter.poe_account_name}
              items={items}
              character={character}
              passiveTreeItems={passiveTree?.items}
              characterId={selectedCharacter.id}
            />
          ) : (
            // Inventory unavailable (private profile / GGG hiccup) — the PoB
            // stat sheet comes from our own DB, so still show it.
            <div className="flex h-full flex-col items-center gap-2 overflow-y-auto">
              <div className="font-fontinSmallcaps text-xl text-primary-500">
                {selectedCharacter.name}
              </div>
              <div>
                Level {selectedCharacter.level} {selectedCharacter.class}
              </div>
              <div className="mb-2 text-sm text-primary-800 opacity-60">
                Couldn't load the inventory — the profile may be private.
              </div>
              <CharacterStatSheet characterId={selectedCharacter.id} />
            </div>
          ))}
      </ModalDrawer>
    </>
  );
};

export default CharacterTable;
