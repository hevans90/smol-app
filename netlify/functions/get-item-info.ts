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

export const getBaseItem = async (itemName: string) => {
  const apiUrl = `https://www.poewiki.net/w/api.php?action=query&format=json&titles=${
    itemName
  }&prop=revisions&rvprop=content`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    // Extract page content
    const pages = data.query.pages;
    const page: any = Object.values(pages)[0]; // Assuming single page response
    const content: string = page.revisions?.[0]['*']; // Accessing the wiki text content

    if (!content) {
      throw new Error(`No wiki entry found for ${itemName}`);
    }

    let baseItem = itemName;
    let category: BaseTypeCategory | undefined;

    const baseItemRegex = /{{Item[\s\S]*?\|base_item\s*=\s*([^\|\n]*)/;
    const baseItemMatch = baseItemRegex.exec(content);

    const classIdRegex = /{{Item[\s\S]*?\|class_id\s*=\s*([^\|\n]*)/;
    const classIdMatch = classIdRegex.exec(content);

    if (classIdMatch) {
      category = findCategoryContaining(classIdMatch[1].trim());
    }

    if (baseItemMatch) {
      baseItem = baseItemMatch[1].trim();
    }

    console.log(`Base item for ${itemName}: ${baseItem}`);
    console.log(`Category for ${itemName}: ${category}`);

    return { baseItem, category };
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

  const itemInfo = await getBaseItem(name);
  return {
    statusCode: 200,
    body: JSON.stringify(itemInfo),
  };
};
