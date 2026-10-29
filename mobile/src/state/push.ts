/**
 * Push notifications to the parent's phone (issue #16): "Grandpa has bought something
 * from the list." The server decides what to say, following surprise mode; this file
 * only asks the parent's permission and tells the server where to send.
 *
 * Pushes need a development or store build and an EAS project id (set by `eas init`).
 * In Expo Go, on the web, or on a simulator, `pushAvailable()` is false and the
 * option doesn't appear.
 */
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { ensureSignedIn, remote } from './remote';

type Notifications = typeof import('expo-notifications');

export type PushResult = 'on' | 'denied' | 'failed';

function projectId(): string | null {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? null;
}

export function pushAvailable(): boolean {
  return (
    Platform.OS !== 'web' &&
    Device.isDevice &&
    Constants.executionEnvironment !== ExecutionEnvironment.StoreClient &&
    projectId() !== null &&
    remote() !== null
  );
}

/** Loaded only when pushes are possible, so Expo Go never sees the module (it warns). */
function notifications(): Notifications {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('expo-notifications') as Notifications;
}

/** Show pushes even while Biro is open, e.g. when the parent is looking at the list. */
export function showPushesInApp(): void {
  if (!pushAvailable()) return;
  notifications().setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
}

/** Whether this phone already allows Biro's pushes (without asking). */
export async function pushAllowed(): Promise<boolean> {
  if (!pushAvailable()) return false;
  return (await notifications().getPermissionsAsync()).granted;
}

/** Asks permission (the first time), then registers this phone with the server. */
export async function turnOnPushes(): Promise<PushResult> {
  if (!pushAvailable()) return 'failed';
  const n = notifications();
  try {
    if (Platform.OS === 'android') {
      await n.setNotificationChannelAsync('default', { name: 'Gifts', importance: n.AndroidImportance.DEFAULT });
    }
    let permission = await n.getPermissionsAsync();
    if (!permission.granted && permission.canAskAgain) permission = await n.requestPermissionsAsync();
    if (!permission.granted) return 'denied';

    const id = projectId();
    const db = remote();
    if (!id || !db || !(await ensureSignedIn(db))) return 'failed';
    const { data: token } = await n.getExpoPushTokenAsync({ projectId: id });
    const { error } = await db.from('push_tokens').upsert({ token, updated_at: new Date().toISOString() });
    return error ? 'failed' : 'on';
  } catch {
    return 'failed';
  }
}
