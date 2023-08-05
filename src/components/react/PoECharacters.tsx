import { usePoECharacters } from '../../hooks/usePoECharacters';
import { Spinner } from './Spinner';

const PoECharacters = () => {
  const { token, loading, characters, error } = usePoECharacters();

  return (
    <>
      <h2 className="text-xl text-primary-500">
        {token ? 'PoE Characters' : 'Login via PoE to load your characters'}
      </h2>
      <div className=" mt-4 w-full">
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
                ({ name, class: characterClass, league, level }) => (
                  <tr>
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
