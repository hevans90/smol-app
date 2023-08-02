import { useEffect, useState } from 'react';
import { Spinner } from './Spinner';

const Joke = ({ baseHref }: { baseHref: string }) => {
  const [joke, setJoke] = useState<string>();
  const [loading, setLoading] = useState(false);

  const loadJoke = async () => {
    setJoke(undefined);
    setLoading(true);

    const data = await fetch(`${baseHref}/api/joke`);
    const text = await data.text();

    setLoading(false);
    setJoke(text);
  };

  useEffect(() => void loadJoke(), []);

  return (
    <>
      <button
        disabled={loading}
        onClick={() => loadJoke()}
        className="jokes-link rounded border-primary-800 hover:border-primary-300 border-2 p-2 hover:text-primary-300"
      >
        Click here to load a joke from our netlify function!
      </button>

      <div className="text-primary-500 mt-4">
        {loading && <Spinner width={30} />} {joke && joke}
      </div>
    </>
  );
};

export default Joke;
