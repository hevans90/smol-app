import { atom } from 'nanostores';
import type { SortedBaseTypes } from '../models/base-types';

export const sortedBaseItemsStore = atom<SortedBaseTypes | null>(null);
