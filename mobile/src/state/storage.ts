/**
 * Saves the current list on the device. When the backend arrives this becomes
 * the offline cache, so families can still circle on a plane.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import { parseSnapshot, serialize } from '@/domain/snapshot';
import type { ListState } from '@/domain/types';

const KEY = 'biro.currentList';

export async function loadList(): Promise<ListState | null> {
  try {
    return parseSnapshot(await AsyncStorage.getItem(KEY));
  } catch (e) {
    console.warn('Could not load the saved list; starting fresh', e);
    return null;
  }
}

export async function saveList(list: ListState): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, serialize(list));
  } catch (e) {
    console.warn('Could not save the list', e);
  }
}
