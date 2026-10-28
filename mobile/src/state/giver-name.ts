/**
 * Remembers who's using this device on the Giver side ("Nan"), so their claims
 * and pledges carry their name. No account needed.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'biro.giverName';

export async function loadGiverName(): Promise<string> {
  try {
    return (await AsyncStorage.getItem(KEY)) ?? '';
  } catch {
    return '';
  }
}

export async function saveGiverName(name: string): Promise<void> {
  await AsyncStorage.setItem(KEY, name.trim());
}
