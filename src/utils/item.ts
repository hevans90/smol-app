import { itemClassID } from "./itemClass";
import { itemRarityID } from "./itemRarity";

export interface Item {
    name: string;
    rarity: keyof typeof itemRarityID;
    itemClass: keyof typeof itemClassID;
    wikiUrl: string
}

export class BuildItem {
    itemClass: keyof typeof itemClassID;
    name: string;
    rarity: keyof typeof itemRarityID;
    wikiUrl: string;
    
    constructor(item: Item) {
        this.itemClass = item.itemClass;
        this.name = item.name;
        this.rarity = item.rarity;
        this.wikiUrl = item.wikiUrl;
    }
    // TODO: Add graphic path to be tied to object
    // TODO list
    // Store each ITEM in DB?
    // read on demand while parsing?
}

export async function parseItem(itemString: string): Promise<BuildItem> {
    const lines = itemString!.trim().split('\n').filter(line => line.trim() !== '');

    let name = '';
    let rarity: itemRarityID = itemRarityID.Normal;
    let itemClass: Item;

    if (lines[0].startsWith('Rarity:')) {
        const possibleRarity = lines[0].split(':')[1].trim().toLowerCase();
        rarity = Object.values(itemRarityID).includes(possibleRarity as itemRarityID)
            ? possibleRarity as itemRarityID
            : (() => { throw new Error(`Unknown rarity detected: ${possibleRarity}`); })();
    }

    // assuming the PoB stays this way, we need to select unique items or rare bases
    if (rarity === itemRarityID.Unique) {
        name = lines[1].trim();
    }
    else {
        name = lines[2].trim();
    }
    itemClass = await searchForItemByName(name);

    return new BuildItem(itemClass!);
}

async function searchForItemByName(name: string): Promise<Item> {
    for (let filename of Object.keys(itemClassID)) {
        // Import the file dynamically
        // TODO: fix hardcoded paths
        const module = await import(`../utils/items/${filename}.ts`);
        console.log(`Imported ${filename}`);

        // Search for the item in the module's items
        const found = module.items.find((item: Item) => item.name.includes(name));

        if (found) {
            return found;
        }
    }

    throw new Error(`Item "${name}" not found`);
}