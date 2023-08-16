// This test is not mocked and calls real API
// We do this in order to validate number of items available for our application
// In case wiki is updated with new league content, we have to scrape new items

import { getItemCount, itemClassID } from '../utils/itemClass';
import { describe, it, expect } from 'vitest';

describe('getItemCount', () => {
    let totalCount = 0;
    it('returns the correct number of items for Gloves', async () => {
        const count = await getItemCount(itemClassID.Gloves);
        totalCount += count;
        expect(count).toBe(150);
    });

    it('returns the correct number of items for ManaFlask', async () => {
        const count = await getItemCount(itemClassID.ManaFlask);
        totalCount += count;
        expect(count).toBe(16);
    });

    it('returns the correct number of items for OneHandedAxe', async () => {
        const count = await getItemCount(itemClassID.OneHandedAxe);
        totalCount += count;
        expect(count).toBe(37);
    });

    it('returns the correct number of items for Claw', async () => {
        const count = await getItemCount(itemClassID.Claw);
        totalCount += count;
        expect(count).toBe(48);
    });

    it('returns the correct number of items for BodyArmour', async () => {
        const count = await getItemCount(itemClassID.BodyArmour);
        totalCount += count;
        expect(count).toBe(204);
    });

    it('returns the correct number of items for Ring', async () => {
        const count = await getItemCount(itemClassID.Ring);
        totalCount += count;
        expect(count).toBe(119);
    });

    it('returns the correct number of items for ThrustingOneHandedSword', async () => {
        const count = await getItemCount(itemClassID.ThrustingOneHandedSword);
        totalCount += count;
        expect(count).toBe(33);
    });

    it('returns the correct number of items for Staff', async () => {
        const count = await getItemCount(itemClassID.Staff);
        totalCount += count;
        expect(count).toBe(33);
    });

    it('returns the correct number of items for Quiver', async () => {
        const count = await getItemCount(itemClassID.Quiver);
        totalCount += count;
        expect(count).toBe(35);
    });

    it('returns the correct number of items for OneHandedSword', async () => {
        const count = await getItemCount(itemClassID.OneHandedSword);
        totalCount += count;
        expect(count).toBe(61);
    });

    it('returns the correct number of items for LifeFlask', async () => {
        const count = await getItemCount(itemClassID.LifeFlask);
        totalCount += count;
        expect(count).toBe(13);
    });

    it('returns the correct number of items for Bow', async () => {
        const count = await getItemCount(itemClassID.Bow);
        totalCount += count;
        expect(count).toBe(56);
    });

    it('returns the correct number of items for TwoHandedSword', async () => {
        const count = await getItemCount(itemClassID.TwoHandedSword);
        totalCount += count;
        expect(count).toBe(39);
    });

    it('returns the correct number of items for Amulet', async () => {
        const count = await getItemCount(itemClassID.Amulet);
        totalCount += count;
        expect(count).toBe(137);
    });

    it('returns the correct number of items for TwoHandedMace', async () => {
        const count = await getItemCount(itemClassID.TwoHandedMace);
        totalCount += count;
        expect(count).toBe(38);
    });

    it('returns the correct number of items for TwoHandedAxe', async () => {
        const count = await getItemCount(itemClassID.TwoHandedAxe);
        totalCount += count;
        expect(count).toBe(46);
    });

    it('returns the correct number of items for Sceptre', async () => {
        const count = await getItemCount(itemClassID.Sceptre);
        totalCount += count;
        expect(count).toBe(53);
    });

    it('returns the correct number of items for Trinket', async () => {
        const count = await getItemCount(itemClassID.Trinket);
        totalCount += count;
        expect(count).toBe(1);
    });

    it('returns the correct number of items for Jewel', async () => {
        const count = await getItemCount(itemClassID.Jewel);
        totalCount += count;
        expect(count).toBe(112);
    });

    it('returns the correct number of items for HybridFlask', async () => {
        const count = await getItemCount(itemClassID.HybridFlask);
        totalCount += count;
        expect(count).toBe(8);
    });

    it('returns the correct number of items for OneHandedMace', async () => {
        const count = await getItemCount(itemClassID.OneHandedMace);
        totalCount += count;
        expect(count).toBe(40);
    });

    it('returns the correct number of items for Dagger', async () => {
        const count = await getItemCount(itemClassID.Dagger);
        totalCount += count;
        expect(count).toBe(20);
    });

    it('returns the correct number of items for AbyssJewel', async () => {
        const count = await getItemCount(itemClassID.AbyssJewel);
        totalCount += count;
        expect(count).toBe(8);
    });

    it('returns the correct number of items for Boots', async () => {
        const count = await getItemCount(itemClassID.Boots);
        totalCount += count;
        expect(count).toBe(139);
    });

    it('returns the correct number of items for RuneDagger', async () => {
        const count = await getItemCount(itemClassID.RuneDagger);
        totalCount += count;
        expect(count).toBe(32);
    });

    it('returns the correct number of items for UtilityFlask', async () => {
        const count = await getItemCount(itemClassID.UtilityFlask);
        totalCount += count;
        expect(count).toBe(51);
    });

    it('returns the correct number of items for Shield', async () => {
        const count = await getItemCount(itemClassID.Shield);
        totalCount += count;
        expect(count).toBe(163);
    });

    it('returns the correct number of items for Helmet', async () => {
        const count = await getItemCount(itemClassID.Helmet);
        totalCount += count;
        expect(count).toBe(179);
    });

    it('returns the correct number of items for Warstaff', async () => {
        const count = await getItemCount(itemClassID.Warstaff);
        totalCount += count;
        expect(count).toBe(32);
    });

    it('returns the correct number of items for Belt', async () => {
        const count = await getItemCount(itemClassID.Belt);
        totalCount += count;
        expect(count).toBe(69);
    });

    it('returns the correct number of items for Wand', async () => {
        const count = await getItemCount(itemClassID.Wand);
        totalCount += count;
        expect(count).toBe(47);
    });

    it('returns the total number of items', () => {
        expect(totalCount).toBe(2019);
    });
});

describe('getItemCount', () => {
    it('returns the total number of items', async () => {
        const itemKeys = Object.keys(itemClassID)
            .filter(key => isNaN(Number(key))); // Filter numeric keys

        let totalCount = 0;
        for (const item of itemKeys) {
            const count = await getItemCount(itemClassID[item as keyof typeof itemClassID]);
            totalCount += count;
        }

        expect(totalCount).toBe(2019);
    });
});

