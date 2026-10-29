/**
 * Listening for a spoken search. This is the phone version: speech recognition
 * on iOS and Android needs a native module (expo-speech-recognition), which
 * arrives with the first development build. Until then the mic button hides
 * itself on phones. The web version is in `voice.web.ts`.
 */

export type VoiceError = 'denied' | 'no-speech' | 'failed';

export interface VoiceHandlers {
  /** The recogniser's guesses, best first. */
  onResult: (alternatives: string[]) => void;
  onError: (error: VoiceError) => void;
  /** Always called last, after a result or an error. */
  onEnd: () => void;
}

export interface Listening {
  stop: () => void;
}

export function voiceAvailable(): boolean {
  return false;
}

export function listen(_handlers: VoiceHandlers, _languageTag: string): Listening | null {
  return null;
}
