import { usePoECharacters } from '../../hooks/usePoECharacters';
import { Spinner } from './ui/Spinner';

const PoECharacters = () => {
  const lazy = true;
  const { token, loading, characters, error, loadCharacters } =
    usePoECharacters(lazy);

  return (
    <>
      <h2 className="text-primary-500">
        {token ? 'Characters' : 'Log in via PoE to load your characters'}
      </h2>
      <div className=" mt-4 w-full">
        {lazy && !characters.length && (
          <button
            onClick={loadCharacters}
            disabled={loading}
            className="border-primary-800 border-[1px] rounded p-2 hover:border-primary-500 hover:text-primary-500"
          >
            Load characters (warning - rate limited)
          </button>
        )}
        {loading && <Spinner width={30} />}{' '}
        {characters && characters.length > 0 && (
          <table className="table-auto w-full">
            <thead>
              <tr>
                <th className="text-left">Name</th>
                <th className="text-left">Class</th>
                <th className="text-left">League</th>
                <th className="text-left">Level</th>
              </tr>
            </thead>
            <tbody>
              {characters.map(
                ({ name, class: characterClass, league, level }, i) => (
                  <tr key={i}>
                    <td>{name}</td>
                    <td>{characterClass}</td>
                    <td>{league}</td>
                    <td>{level}</td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        )}
      </div>

      {error && <div className="text-red-400">{error}</div>}
    </>
  );
};

export default PoECharacters;
