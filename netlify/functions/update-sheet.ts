import type { Handler, HandlerEvent } from '@netlify/functions';
import { JWT } from 'google-auth-library';
import { google } from 'googleapis';

import { Item_Order_Type_Enum } from '../../src/graphql-api';

const getCurrentDistinctBaseTypes = async () => {
  const hasuraURL = `http${process.env.HASURA_GRAPHQL_URI?.includes('localhost') ? '' : 's'}://${process.env.HASURA_GRAPHQL_URI}`;
  const headers = {
    'Content-Type': 'application/json',
    'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET as string,
  };

  const hasuraResponse = await fetch(hasuraURL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query: `
      query BaseTypes {
          user_item_order(distinct_on: item_base_type, where: {item_base_type: {_neq: "null"}}) {
            item_base_type
            type
        }
      }`,
    }),
  });

  const jsonData = (await hasuraResponse.json()) as {
    data: {
      user_item_order: { item_base_type: string; type: Item_Order_Type_Enum }[];
    };
  };

  // filter for unique orders here

  const uniqueBaseTypes = jsonData.data.user_item_order
    .filter((x) => x.type === Item_Order_Type_Enum.Unique)
    .map((obj) => obj.item_base_type);

  const regularBaseTypes = jsonData.data.user_item_order
    .filter((x) => x.type === Item_Order_Type_Enum.Base)
    .map((obj) => obj.item_base_type);

  return { uniqueBaseTypes, regularBaseTypes };
};

export const handler: Handler = async (event: HandlerEvent) => {
  const baseTypes = await getCurrentDistinctBaseTypes();

  const spreadsheetId = '1z5SNHzAVErTiZ1NAWpEpcuDPzKY3gco_epEqZvmA6Ns';
  const subSheetName = 'smol-app import';

  if (!process.env.GOOGLE_SHEETS_CREDENTIALS) {
    throw new Error('Google credentials not present in the environment.');
  }

  const decodedServiceAccount = Buffer.from(
    process.env.GOOGLE_SHEETS_CREDENTIALS,
    'base64',
  ).toString('utf-8');
  const credentials = JSON.parse(decodedServiceAccount);

  const jwtClient = new JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth: jwtClient });

  const clearRange = async (range: string) => {
    const request = {
      spreadsheetId,
      range,
      resource: {},
    };

    try {
      await sheets.spreadsheets.values.clear(request);
      console.log(`Cleared range: ${range}`);
    } catch (err) {
      console.error('Error clearing sheet:', err);
    }
  };

  // clear columns first
  await clearRange(`${subSheetName}!A2:A`);
  await clearRange(`${subSheetName}!B2:B`);

  // regular baseTypes
  const regularResponse = await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${subSheetName}!A3:A${3 + baseTypes.regularBaseTypes.length}`,
    valueInputOption: 'RAW',
    requestBody: {
      values: baseTypes.regularBaseTypes.map((value) => [value]),
    },
  });

  // unique baseTypes
  const uniqueResponse = await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${subSheetName}!B3:B${3 + baseTypes.uniqueBaseTypes.length}`,
    valueInputOption: 'RAW',
    requestBody: {
      values: baseTypes.uniqueBaseTypes.map((value) => [value]),
    },
  });
  return {
    statusCode: 200,
    body: JSON.stringify({ regularResponse, uniqueResponse }),
  };
};
