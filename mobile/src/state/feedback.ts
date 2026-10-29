/**
 * "Something not right? Tell Luke": opens an email to the beta's organiser with the
 * details that help fix a problem (app version, phone, system) already filled in.
 * Nothing about the list itself is included.
 */
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Linking, Platform } from 'react-native';

export const FEEDBACK_EMAIL = 'zoneflossy@gmail.com';

export function feedbackDetails(): string {
  const app = Constants.expoConfig?.version ?? '?';
  const system = Platform.OS === 'web' ? 'web' : `${Platform.OS} ${Platform.Version}`;
  const device = Platform.OS === 'web' ? (typeof navigator === 'undefined' ? '' : navigator.userAgent) : (Device.modelName ?? '');
  return `Biro ${app} · ${system}${device ? ` · ${device}` : ''}`;
}

export function feedbackUrl(subject: string, prompt: string, where: string): string {
  const body = `${prompt}\n\n\n\n---\n${where} · ${feedbackDetails()}`;
  return `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function sendFeedback(subject: string, prompt: string, where: string): void {
  Linking.openURL(feedbackUrl(subject, prompt, where)).catch(() => undefined);
}
