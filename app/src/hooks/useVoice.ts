import { useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import { processVoice } from '@services/api';
import type { AsyncState, VoiceResult } from '@app-types/index';
import { Config } from '@constants/config';

export function useVoice() {
  const [state, setState] = useState<AsyncState<VoiceResult>>({
    status: 'idle',
    data:   null,
    error:  null,
  });
  const [isRecording, setIsRecording] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timeoutRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        setState({ status: 'error', data: null, error: 'Microphone permission denied.' });
        return;
      }

      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      recordingRef.current = recording;
      setIsRecording(true);
      setState({ status: 'loading', data: null, error: null });

      // Auto-stop after timeout
      timeoutRef.current = setTimeout(() => {
        void stopRecording();
      }, Config.VOICE_TIMEOUT_MS);
    } catch (err) {
      setState({ status: 'error', data: null, error: 'Failed to start recording.' });
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!recordingRef.current) return;

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      setIsRecording(false);

      if (!uri) throw new Error('No audio recorded.');

      // Convert to base64 for API
      const response = await fetch(uri);
      const blob     = await response.blob();
      const reader   = new FileReader();
      const base64   = await new Promise<string>((resolve, reject) => {
        reader.onload  = () => resolve((reader.result as string).split(',')[1] ?? '');
        reader.onerror = () => reject(new Error('Failed to encode audio.'));
        reader.readAsDataURL(blob);
      });

      const result = await processVoice(base64);
      setState({ status: 'success', data: result, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Voice processing failed.';
      setState({ status: 'error', data: null, error: message });
      setIsRecording(false);
    }
  }, []);

  const reset = useCallback(() => {
    setState({ status: 'idle', data: null, error: null });
  }, []);

  return { state, isRecording, startRecording, stopRecording, reset };
}
