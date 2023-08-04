import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import jokes from './jokes.json';

export const handler: Handler = async (event: HandlerEvent) => {
  console.log(event.path);
  const randomIndex = Math.floor(Math.random() * jokes.length);
  const randomJoke = jokes[randomIndex];

  return {
    statusCode: 200,
    body: randomJoke,
  };
};
