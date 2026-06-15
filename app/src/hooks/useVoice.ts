import { useState, useRef, useCallback, useEffect } from 'react';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { processVoice } from '@services/api';
import type { AsyncState, VoiceResult } from '@app-types/index';

// On-device speech recognition (Android/iOS). The recognized transcript is sent
// to the backend, which resolves it to a catalog product via the keyword matcher.
//
// expo-speech-recognition is a NATIVE module that does NOT exist in Expo Go, so:
//  1. We detect Expo Go via expo-constants and never touch the module there.
//  2. Outside Expo Go we lazily require() it inside a try/catch.
// This guarantees the app never crashes or logs a "missing native module" error.

// Minimal local shapes so we don't statically import the native package.
interface SpeechResultEvent { results?: { transcript?: string }[]; isFinal?: boolean }
interface SpeechErrorEvent { message?: string; error?: string }
interface Subscription { remove: () => void }
interface SpeechNativeModule {
  start: (options: Record<string, unknown>) => void;
  stop: () => void;
  requestPermissionsAsync: () => Promise<{ granted: boolean }>;
  addListener: (event: string, listener: (e: never) => void) => Subscription;
}

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let cachedModule: SpeechNativeModule | null | undefined;

function loadSpeech(): SpeechNativeModule | null {
  if (cachedModule !== undefined) return cachedModule;
  if (isExpoGo) {
    cachedModule = null; // never load the native module in Expo Go
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('expo-speech-recognition') as { ExpoSpeechRecognitionModule: SpeechNativeModule };
    cachedModule = mod.ExpoSpeechRecognitionModule;
  } catch {
    cachedModule = null;
  }
  return cachedModule;
}

export function useVoice() {
  const [state, setState] = useState<AsyncState<VoiceResult>>({
    status: 'idle',
    data: null,
    error: null,
  });
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const subsRef = useRef<Subscription[]>([]);

  const clearSubs = useCallback(() => {
    subsRef.current.forEach((s) => s.remove());
    subsRef.current = [];
  }, []);

  useEffect(() => clearSubs, [clearSubs]);

  const submitTranscript = useCallback(async (text: string) => {
    const clean = text.trim();
    if (!clean) {
      setState({ status: 'error', data: null, error: "Didn't catch that. Try again." });
      return;
    }
    setState({ status: 'loading', data: null, error: null });
    try {
      const result = await processVoice(clean);
      setState({ status: 'success', data: result, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Voice processing failed.';
      setState({ status: 'error', data: null, error: message });
    }
  }, []);

  const startRecording = useCallback(async () => {
    const speech = loadSpeech();
    if (!speech) {
      setState({
        status: 'error',
        data: null,
        error: 'Voice needs a dev build (not available in Expo Go).',
      });
      return;
    }

    try {
      const perm = await speech.requestPermissionsAsync();
      if (!perm.granted) {
        setState({ status: 'error', data: null, error: 'Microphone / speech permission denied.' });
        return;
      }

      clearSubs();
      subsRef.current.push(speech.addListener('start', () => setIsRecording(true)));
      subsRef.current.push(speech.addListener('end', () => setIsRecording(false)));
      subsRef.current.push(
        speech.addListener('result', ((event: SpeechResultEvent) => {
          const text = event.results?.[0]?.transcript ?? '';
          setTranscript(text);
          if (event.isFinal && text) {
            void submitTranscript(text);
          }
        }) as (e: never) => void),
      );
      subsRef.current.push(
        speech.addListener('error', ((event: SpeechErrorEvent) => {
          setIsRecording(false);
          setState({ status: 'error', data: null, error: event.message || 'Speech recognition failed.' });
        }) as (e: never) => void),
      );

      setTranscript('');
      setState({ status: 'loading', data: null, error: null });

      speech.start({
        lang: 'en-IN',
        interimResults: true,
        continuous: false,
        requiresOnDeviceRecognition: false,
        addsPunctuation: false,
      });
    } catch {
      setState({ status: 'error', data: null, error: 'Failed to start listening.' });
      setIsRecording(false);
    }
  }, [clearSubs, submitTranscript]);

  const stopRecording = useCallback(async () => {
    const speech = loadSpeech();
    if (!speech) return;
    try {
      speech.stop();
    } catch {
      // ignore
    }
  }, []);

  const reset = useCallback(() => {
    setTranscript('');
    setState({ status: 'idle', data: null, error: null });
  }, []);

  return { state, isRecording, transcript, startRecording, stopRecording, reset };
}
