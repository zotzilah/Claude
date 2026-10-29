/**
 * The list's backup code, kept on this phone so Settings → Account can show it again.
 * The server only keeps a hash, so this is the one place the parent can look it up
 * (besides wherever they wrote it down).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'biro.backupCode';


export async function loadBackupCode(listId: string): Promise<string | null> {
  try {
    const saved = JSON.parse((await AsyncStorage.getItem(KEY)) ?? 'null') as { listId: string; code: string } | null;
    return saved?.listId === listId ? saved.code : null;
  } catch {
    return null;
  }
}

export async function saveBackupCode(listId: string, code: string): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify({ listId, code }));
  } catch {
    // Not fatal: the parent has just been shown the code to write down.
  }
}
