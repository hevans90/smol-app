import { useQuery, useSubscription } from '@apollo/client';
import React, { useEffect, useState } from 'react';

import {
  LeagueCharactersDocument,
  LeagueDocument,
  type Character,
  type LeagueCharactersSubscription,
  type LeagueQuery,
} from '../../../graphql-api';
import { Spinner } from '../ui/Spinner';

export const LeagueLadder = () => {
  const { data: leagueInfo, loading: leagueInfoLoading } =
    useQuery<LeagueQuery>(LeagueDocument);

  const { data: charactersResponse, loading: charactersLoading } =
    useSubscription<LeagueCharactersSubscription>(LeagueCharactersDocument);

  const league = leagueInfo?.league?.[0];
  const leagueName = league?.id;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="my-4 flex items-baseline">
        {league && league?.url ? (
          <>
            <h1 className="text-2xl">
              <a href={league.url} target="_blank">
                {leagueName}
              </a>
            </h1>
            &nbsp; &nbsp; &nbsp; &nbsp;
            <span className="text-xl">{league.description}</span>
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

  return (
    <div className="flex h-[90%] w-full flex-col">
      {/* Table Wrapper */}
      <div className="grow overflow-auto">
        <table className="min-w-full table-fixed text-left text-sm text-gray-400">
          <thead className="sticky top-0 bg-gray-900 text-primary-500">
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
            </tr>
          </thead>
          <tbody className="bg-gray-950 text-primary-800">
            {currentCharacters.map((character) => (
              <tr
                key={character.id}
                className="border-b border-primary-900 border-opacity-30 text-xs hover:bg-gray-900 hover:bg-opacity-50"
              >
                <td className="px-4 py-2">{character.rank}</td>
                <td className="px-4 py-2">{character.poe_account_name}</td>
                <td className="px-4 py-2">
                  <div>
                    <a
                      href={`https://www.pathofexile.com/account/view-profile/${character.poe_account_name}/characters?characterName=${character.name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {character.name}
                    </a>
                    {character.retired && (
                      <>
                        <span className="text-primary-900"> (</span>
                        <span className="font-bold text-red-700">Retired</span>
                        <span className="text-primary-900">)</span>
                      </>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2">{character.class}</td>
                <td className="px-4 py-2">{character.level}</td>
                <td className="px-4 py-2">{character.experience}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls - Always at the Bottom */}
      <div className="mt-4 flex grow-0 items-center justify-between py-4 text-primary-600">
        <div>
          <label>Rows per page:</label>
          <select
            className="ml-2 rounded bg-gray-800 px-2 py-1 text-center"
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
          <span className="px-4 py-2 text-primary-500">{`Page ${currentPage} of ${totalPages}`}</span>
          <button
            className="rounded-r bg-gray-900 px-4 py-2  hover:bg-gray-800"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default CharacterTable;
