import { XMLParser } from 'fast-xml-parser';

/**
 * Decode a base64url-deflate encoded string (e.g. Path of Building export) to raw text.
 */
export async function decodeBlob(encoded: string): Promise<string> {
  encoded = encoded.replace(/-/g, '+').replace(/_/g, '/');
  while (encoded.length % 4) encoded += '=';

  const binary = atob(encoded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));

  const ds = new DecompressionStream('deflate');
  const stream = new Response(bytes).body!.pipeThrough(ds);

  const text = await new Response(stream).text();
  return text;
}

const parser = new XMLParser({ ignoreAttributes: false });

/**
 * Decode and parse Path of Building encoded export to JSON.
 * Logs the result to console for inspection.
 */
export async function decodeAndParsePob(encoded: string): Promise<unknown> {
  const xmlString = await decodeBlob(encoded);
  const json = parser.parse(xmlString);
  console.log('[PoB] Decoded and parsed:', json);
  return json;
}

/** PoB parsed structure: PathOfBuilding.Items.Item[] with #text block. */
function getItemsArray(parsed: unknown): unknown[] {
  const root = parsed as Record<string, unknown>;
  const pob = root?.PathOfBuilding as Record<string, unknown> | undefined;
  const items = pob?.Items as Record<string, unknown> | undefined;
  const item = items?.Item;
  if (item == null) return [];
  return Array.isArray(item) ? item : [item];
}

/**
 * Extract unique item names from parsed PoB JSON.
 * Uses PathOfBuilding.Build.Items.Item[].#text: first line "Rarity: UNIQUE", second line = unique name.
 */
export function extractUniqueItemNamesFromPob(parsed: unknown): string[] {
  const seen = new Set<string>();
  const names: string[] = [];

  for (const entry of getItemsArray(parsed)) {
    const obj = entry as Record<string, unknown>;
    const text = obj?.['#text'];
    if (typeof text !== 'string' || !text.trim()) continue;

    const lines = text.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    if (lines.length < 2) continue;

    const rarityLine = lines[0];
    const itemName = lines[1];

    if (rarityLine !== 'Rarity: UNIQUE') continue;
    if (!itemName || itemName.length > 120 || seen.has(itemName)) continue;

    seen.add(itemName);
    names.push(itemName);
  }

  return names;
}
