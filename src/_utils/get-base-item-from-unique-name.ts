export const getBaseItemFromUniqueName = async (uniqueItemName: string) => {
  const apiUrl = `https://pathofexile.gamepedia.com/api.php?action=query&format=json&titles=${encodeURIComponent(
    uniqueItemName
  )}&prop=revisions&rvprop=content`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    // Extract page content
    const pages = data.query.pages;
    const page: any = Object.values(pages)[0]; // Assuming single page response
    const content: string = page.revisions[0]['*']; // Accessing the wiki text content

    // Regex to find the base item
    const regex = /\|\s*base_item\s*=\s*([^\n]+)/i;
    const match = content.match(regex);

    if (match && match[1]) {
      const baseItem = match[1].trim();
      console.log(`Base item for ${uniqueItemName}: ${baseItem}`);
    } else {
      console.log(`Base item not found for ${uniqueItemName}`);
    }
  } catch (error) {
    console.error('Error fetching data from PoE Wiki API:', error);
  }
};
