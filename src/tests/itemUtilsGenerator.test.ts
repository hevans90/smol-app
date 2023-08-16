// skeleton of test to verify integrity of our parser

import { fetchAndSaveItems, itemClassID } from '../utils/itemClass';
import { describe, it, expect } from 'vitest';

describe('simpleParse', () => {
    it('we try to create files for each item base from wiki', async () => {
        const itemValues = Object.values(itemClassID)
        for (const itemCID of itemValues) {
            await fetchAndSaveItems(itemCID);
        }
    });
});


