import { useQuery, useSubscription } from '@apollo/client';
import { useState } from 'react';
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
    <>
      <div className="flex items-baseline">
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
    </>
  );
};

const CharacterTable: React.FC<{ characters: Character[] }> = ({
  characters,
}) => {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Calculate total pages
  const totalPages = Math.ceil(characters.length / rowsPerPage);

  // Get the current page's data slice
  const indexOfLastCharacter = currentPage * rowsPerPage;
  const indexOfFirstCharacter = indexOfLastCharacter - rowsPerPage;
  const currentCharacters = characters.slice(
    indexOfFirstCharacter,
    indexOfLastCharacter,
  );

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Handle rows per page change
  const handleRowsPerPageChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setRowsPerPage(Number(event.target.value));
    setCurrentPage(1); // Reset to first page
  };

  return (
    <div className="mb-8 w-full overflow-x-auto">
      <table className="min-w-full table-fixed text-left text-sm text-gray-400">
        <thead className="bg-gray-900 text-primary-500">
          <tr>
            <th className="w-16 px-4 py-2 font-medium">Rank</th>
            <th className="w-32 px-4 py-2 font-medium">Account</th>
            <th className="w-48 px-4 py-2 font-medium">Character</th>
            <th className="w-auto px-4 py-2 font-medium">Class</th>
            <th className="w-32 px-4 py-2 font-medium">Level</th>
            <th className="w-32 py-2 font-medium">Experience</th>
          </tr>
        </thead>
        <tbody className="bg-gray-950 text-primary-800">
          {currentCharacters.map((character) => (
            <tr
              key={character.id}
              className="border-b border-primary-800 text-xs hover:bg-gray-800"
            >
              <td className="px-4 py-2">{character.rank}</td>
              <td className="px-4 py-2">{character.poe_account_name}</td>
              <td className="px-4 py-2">
                <div>
                  <a
                    href={`https://www.pathofexile.com/account/view-profile/${character.poe_account_name}/characters?characterName=${character.name}`}
                    target="_blank"
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

      {/* Pagination Controls */}
      <div className="mt-4 flex items-center justify-between text-primary-600">
        <div>
          <label>Rows per page:</label>
          <select
            className="ml-2 rounded bg-gray-800 p-1"
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
            className="rounded-l bg-gray-900 px-4 py-2  hover:bg-gray-800"
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
