import type { Handler } from '@netlify/functions';

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  try {
    // Parse the request body (expected as URL-encoded string)
    const params = new URLSearchParams(event.body || '');

    // Make the request to the Path of Exile API using fetch
    const response = await fetch(
      'https://www.pathofexile.com/character-window/get-items',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'SmolApp/1.0 (NetlifyFunction)', // Add a User-Agent header
        },
        body: params.toString(),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: error.message,
        error: error.response?.data || null,
      }),
    };
  }
};

export { handler };
