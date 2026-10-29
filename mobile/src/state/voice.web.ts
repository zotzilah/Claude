/**
 * Spoken search in the browser, using the Web Speech API (Chrome, Edge, Safari).
 * The browser handles the microphone permission. Note that Chrome sends the audio
 * to Google to turn it into text; Biro only ever receives the words.
 */
import type { Listening, VoiceError, VoiceHandlers } from './voice';

export type { Listening, VoiceError, VoiceHandlers } from './voice';

interface RecognitionResultEvent {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}

interface Recognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  abort: () => void;
}

type RecognitionConstructor = new () => Recognition;

function recognitionClass(): RecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function voiceAvailable(): boolean {
  return recognitionClass() !== null;
}

export function listen(handlers: VoiceHandlers, languageTag: string): Listening | null {
  const Recognition = recognitionClass();
  if (!Recognition) return null;
  const recognition = new Recognition();
  recognition.lang = languageTag;
  recognition.interimResults = false;
  recognition.continuous = false;
  recognition.maxAlternatives = 5;

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    handlers.onEnd();
  };
  recognition.onresult = (event) => {
    const first = event.results[0];
    const alternatives = first ? Array.from(first, (alt) => alt.transcript) : [];
    if (alternatives.length) handlers.onResult(alternatives);
    else handlers.onError('no-speech');
  };
  recognition.onerror = (event) => {
    const error: VoiceError =
      event.error === 'not-allowed' || event.error === 'service-not-allowed'
        ? 'denied'
        : event.error === 'no-speech' || event.error === 'aborted'
          ? 'no-speech'
          : 'failed';
    handlers.onError(error);
  };
  recognition.onend = finish;

  try {
    recognition.start();
  } catch {
    handlers.onError('failed');
    finish();
    return null;
  }
  return {
    stop: () => {
      recognition.abort();
      finish();
    },
  };
}
