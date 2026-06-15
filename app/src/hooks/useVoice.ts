import { useState, useCallback } from 'react';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { processVoice } from '@services/api';
import type { AsyncState, VoiceResult } from '@app-types/index';

// On-device speech recognition (Android/iOS). The recognized transcript is sent
// to the backend, which resolves it to a catalog product via the keyword matcher
// (with a Bedrock fallback). Requires a dev build — not available in Expo Go.

export function useVoice() {
  const [state, setState] = useState<AsyncState<VoiceResult>>({
    status: 'idle',
    data: null,
    error: null,
  });
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');

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

  useSpeechRecognitionEvent('start', () => setIsRecording(true));

  useSpeechRecognitionEvent('end', () => setIsRecording(false));

  useSpeechRecognitionEvent('result', (event) => {
    const text = event.results?.[0]?.transcript ?? '';
    setTranscript(text);
    if (event.isFinal && text) {
      void submitTranscript(text);
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    setIsRecording(false);
    setState({
      status: 'error',
      data: null,
      error: event.message || 'Speech recognition failed.',
    });
  });

  const startRecording = useCallback(async () => {
    try {
      const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!perm.granted) {
        setState({ status: 'error', data: null, error: 'Microphone / speech permission denied.' });
        return;
      }

      setTranscript('');
      setState({ status: 'loading', data: null, error: null });

      ExpoSpeechRecognitionModule.start({
        lang: 'en-IN',
        interimResults: true,
        continuous: false,
        // Prefer on-device recognition when available
        requiresOnDeviceRecognition: false,
        addsPunctuation: false,
      });
    } catch {
      setState({ status: 'error', data: null, error: 'Failed to start listening.' });
      setIsRecording(false);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    try {
      ExpoSpeechRecognitionModule.stop();
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
