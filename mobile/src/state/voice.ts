/**
 * Listening for a spoken search on phones (issue #14), with expo-speech-recognition.
 * The native module only exists in a development or store build; in Expo Go it's
 * missing, so the mic button hides itself. The web version is in `voice.web.ts`.
 *
 * Recognition runs on the phone where the phone supports it, and the audio is
 * never recorded or kept: Biro only ever receives the words.
 */
import { requireOptionalNativeModule } from 'expo';
import type { ExpoSpeechRecognitionErrorCode, ExpoSpeechRecognitionModule } from 'expo-speech-recognition';

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

type Speech = typeof ExpoSpeechRecognitionModule;

/** The native module, or null in Expo Go (checked without loading the library, which would throw). */
function speech(): Speech | null {
  if (!requireOptionalNativeModule('ExpoSpeechRecognition')) return null;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return (require('expo-speech-recognition') as { ExpoSpeechRecognitionModule: Speech }).ExpoSpeechRecognitionModule;
}

export function voiceAvailable(): boolean {
  const module = speech();
  if (!module) return false;
  try {
    return module.isRecognitionAvailable();
  } catch {
    return false;
  }
}

export function toVoiceError(code: ExpoSpeechRecognitionErrorCode): VoiceError {
  if (code === 'not-allowed' || code === 'service-not-allowed') return 'denied';
  if (code === 'no-speech' || code === 'aborted' || code === 'speech-timeout') return 'no-speech';
  return 'failed';
}

export function listen(handlers: VoiceHandlers, languageTag: string): Listening | null {
  const module = speech();
  if (!module) return null;

  let finished = false;
  let gotResult = false;
  const subscriptions: { remove: () => void }[] = [];
  const finish = () => {
    if (finished) return;
    finished = true;
    for (const s of subscriptions) s.remove();
    handlers.onEnd();
  };

  subscriptions.push(
    module.addListener('result', (event) => {
      if (!event.isFinal || gotResult) return;
      gotResult = true;
      const alternatives = event.results.map((r) => r.transcript).filter(Boolean);
      if (alternatives.length) handlers.onResult(alternatives);
      else handlers.onError('no-speech');
    }),
    module.addListener('error', (event) => {
      handlers.onError(toVoiceError(event.error));
      finish();
    }),
    module.addListener('end', finish),
  );

  (async () => {
    // The first time, the phone asks the parent for the microphone (and on iPhone, speech recognition).
    const permission = await module.requestPermissionsAsync();
    if (!permission.granted) {
      handlers.onError('denied');
      finish();
      return;
    }
    if (finished) return;
    module.start({
      lang: languageTag,
      interimResults: false,
      continuous: false,
      maxAlternatives: 5,
      // Keep the audio on the phone when it can recognise speech by itself.
      requiresOnDeviceRecognition: module.supportsOnDeviceRecognition(),
      addsPunctuation: false,
    });
  })().catch(() => {
    handlers.onError('failed');
    finish();
  });

  return {
    stop: () => {
      if (finished) return;
      module.abort();
      finish();
    },
  };
}
