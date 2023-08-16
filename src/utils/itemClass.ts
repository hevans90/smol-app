import { writeFile, stat } from 'fs/promises';
import { existsSync, createWriteStream } from 'fs';
import { itemRarityID } from './itemRarity';
import { get } from 'https';
import { join } from 'path';
import { JSDOM } from 'jsdom';

import type { Item } from './item';



type Title = {
    name: string;
    'rarity id': string;
    'class id': string;
};

type CargoQueryItem = {
    title: Title;
};

type ResponseData = {
    cargoquery: CargoQueryItem[];
};

// to prevent typescript screaming in case of Enum assignement
function validateEnumValue<E extends Record<string, any>>(value: string, enumObject: E): value is E[keyof E] {
    return Object.values(enumObject).includes(value);
}

function getEnumKeyByEnumValue<T extends { [index: string]: string }>(myEnum: T, enumValue: string): keyof T {
    const keys = Object.keys(myEnum).filter(x => myEnum[x] === enumValue);
    if (keys.length === 0) {
        throw new Error(`Invalid enum value: ${enumValue}`);
    }
    return keys[0] as keyof T;
}

export async function fetchAndSaveItems(itemClass: itemClassID): Promise<void> {
    const url = `https://www.poewiki.net/w/api.php?action=cargoquery&tables=items&fields=name,rarity_id,class_id&format=json&limit=500&drop_enabled=true&where=class_id=%22${itemClass}%22%20AND%20is_in_game=true%20AND%20drop_enabled=true`;
    const response = await fetch(url);
    const data: ResponseData = await response.json();

    const itemsPromises: Promise<Item>[] = data.cargoquery.map(async entry => {
        const potentialRarity = entry.title['rarity id'].trim();
        const rarity = getEnumKeyByEnumValue(itemRarityID, potentialRarity);

        const potentialClassId = entry.title['class id'].trim();
        const classId = getEnumKeyByEnumValue(itemClassID, potentialClassId);

        const wikiUrl = await fetchAndSaveItemsImage(entry.title.name.trim())

        return {
            name: entry.title.name,
            rarity: rarity,
            itemClass: classId,
            wikiUrl: wikiUrl!
        };
    });

    const items: Item[] = await Promise.all(itemsPromises);

    // Write the items to a TypeScript file
    // TODO: add the import of Typescript types for this, fix hardcoded path
    const content = `import type { Item } from "../item";\nexport const items: Item[] = ${JSON.stringify(items, null, 2)};`;

    const filenameKey = Object.keys(itemClassID).find(key => itemClassID[key as keyof typeof itemClassID] === itemClass);
    if (!filenameKey) {
        throw new Error(`Could not derive filename from enum value: ${itemClass}`);
    }

    const OUTPUT_DIRECTORY = join(__dirname, '../utils/items/');
    console.log('file exists?', existsSync(OUTPUT_DIRECTORY));
    await writeFile(join(OUTPUT_DIRECTORY, `${filenameKey}.ts`), content);
}


export async function fetchAndSaveItemsImage(itemBase: string) {
    let urlArr = ['https://www.poewiki.net/wiki/File:', '_inventory_icon.png'];
    let wikiUrl = urlArr.join(itemBase.split(' ').join('_'));

    console.log(wikiUrl);

    try {
        const res = await fetchHTML(wikiUrl);
        const imageUrl = getImageUrl(res, itemBase);
        return 'https://www.poewiki.net' + imageUrl;
    } catch (err) {
        console.error(err);
        return 'image_not_found'
    }
}

// export async function fetchAndSaveItemsImage(itemBase: string, dirPath: string): Promise<void> {
//     const wikiUrl = `https://www.poewiki.net/wiki/File:${itemBase.split(' ').join('_')}_inventory_icon.png`;
//     console.log(wikiUrl);

//     try {
//         const html = await fetchHTML(wikiUrl);
//         const imageUrl = getImageUrl(html, itemBase);
//         await downloadImage(`https://www.poewiki.net${imageUrl}`, itemBase, dirPath);
//     } catch (error) {
//         console.error(error);
//     }
// }

function fetchHTML(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', (error) => reject(error));
    });
}

function getImageUrl(html: string, baseName: string): string {
    const dom = new JSDOM(html);
    const fileElement = dom.window.document.querySelector('#file a');

    if (fileElement) {
        return fileElement.getAttribute('href')!;
    } else {
        throw new Error(`${baseName}: image URL not found.`);
    }
}

// function getImageUrl(html: string, baseName: string): string {
//     const parser = new DOMParser();
//     const doc = parser.parseFromString(html, 'text/html');
//     const fileElement = doc.getElementById('file');
//     const anchorElement = fileElement?.querySelector('a');

//     if (anchorElement) {
//         return anchorElement.getAttribute('href') || '';
//     } else {
//         throw new Error(`${baseName}: image URL not found.`);
//     }
// }

// based on https://www.poewiki.net/wiki/Path_of_Exile_Wiki:Data_query_API

// Selected items for our application
// https://www.poewiki.net/wiki/Item_class
export enum itemClassID {
    Gloves = 'Gloves',
    ManaFlask = 'ManaFlask',
    OneHandedAxe = 'One Hand Axe',
    Claw = 'Claw',
    BodyArmour = 'Body Armour',
    Ring = 'Ring',
    ThrustingOneHandedSword = 'Thrusting One Hand Sword',
    Staff = 'Staff',
    Quiver = 'Quiver',
    OneHandedSword = 'One Hand Sword',
    LifeFlask = 'LifeFlask',
    Bow = 'Bow',
    TwoHandedSword = 'Two Hand Sword',
    Amulet = 'Amulet',
    TwoHandedMace = 'Two Hand Mace',
    TwoHandedAxe = 'Two Hand Axe',
    Sceptre = 'Sceptre',
    Trinket = 'Trinket',
    Jewel = 'Jewel',
    HybridFlask = 'HybridFlask',
    OneHandedMace = 'One Hand Mace',
    Dagger = 'Dagger',
    AbyssJewel = 'AbyssJewel',
    Boots = 'Boots',
    RuneDagger = 'Rune Dagger',
    UtilityFlask = 'UtilityFlask',
    Shield = 'Shield',
    Helmet = 'Helmet',
    Warstaff = 'Warstaff',
    Belt = 'Belt',
    Wand = 'Wand'
}


export async function getItemCount(itemClass: itemClassID): Promise<number> {
    const url = `https://www.poewiki.net/w/api.php?action=cargoquery&tables=items&fields=name,rarity_id,class_id&format=json&limit=500&drop_enabled=true&where=class_id=%22${itemClass}%22%20AND%20is_in_game=true%20AND%20drop_enabled=true`;
    const response = await fetch(url);
    const data: ResponseData = await response.json();

    const count = data.cargoquery.reduce((acc, item) => {
        return item.title['class id'] === itemClass ? acc + 1 : acc;
    }, 0);

    // if more than 500, raise error, we are limited
    if (count >= 500) {
        throw Error(`We got limited items for ${itemClass}`);
    }

    return count;
}

// available tables https://www.poewiki.net/wiki/Special:CargoTables
