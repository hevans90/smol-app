import type { Handler, HandlerEvent } from '@netlify/functions';
import invariant from 'tiny-invariant';
import {
  BASE_TYPE_CATEGORIES,
  type BaseTypeCategory,
} from '../../src/models/base-types';

const findCategoryContaining = (
  baseType: string,
): BaseTypeCategory | undefined => {
  const lowerBaseType = baseType.toLowerCase();
  const category = BASE_TYPE_CATEGORIES.find((category) =>
    category.toLowerCase().includes(lowerBaseType),
  );

  return category;
};

export const getBaseItemFromUniqueName = async (uniqueItemName: string) => {
  const apiUrl = `https://www.poewiki.net/w/api.php?action=query&format=json&titles=${
    uniqueItemName
  }&prop=revisions&rvprop=content`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    // Extract page content
    const pages = data.query.pages;
    const page: any = Object.values(pages)[0]; // Assuming single page response
    const content: string = page.revisions?.[0]['*']; // Accessing the wiki text content

    if (!content) {
      throw new Error(`No wiki entry found for ${uniqueItemName}`);
    }

    const regex =
      /{{Item[\s\S]*?\|class_id\s*=\s*([^\|\n]*)[\s\S]*?\|base_item\s*=\s*([^\|\n]*)/;

    const match = regex.exec(content);

    if (match) {
      const category = findCategoryContaining(match[1].trim());
      const baseItem = match[2].trim();
      console.log(`Base item for ${uniqueItemName}: ${baseItem}`);
      console.log(`Category for ${uniqueItemName}: ${category}`);

      return { baseItem, category };
    } else {
      throw new Error(`Base item not found for ${uniqueItemName}`);
    }
  } catch (error) {
    throw new Error(
      `Error fetching data from PoE Wiki API: ${(error as Error)?.message}`,
    );
  }
};

export const handler: Handler = async (event: HandlerEvent) => {
  invariant(event.queryStringParameters);
  const { name } = event.queryStringParameters;
  invariant(name);

  try {
    const itemInfo = await getBaseItemFromUniqueName(name);
    return {
      statusCode: 200,
      body: JSON.stringify(itemInfo),
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: (e as Error)?.message }),
    };
  }
};
