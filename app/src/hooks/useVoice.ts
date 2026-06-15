import { useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import { File } from 'expo-file-system';
import { processVoice } from '@services/api';
import type { AsyncState, VoiceResult } from '@app-types/index';
import { Config } from '@constants/config';

// 16 kHz mono 16-bit linear PCM in a WAV container — matches what the backend
// voiceProcessor expects (it strips the WAV header and forwards raw PCM to Lex).
const PCM_WAV_RECORDING: Audio.RecordingOptions = {
  isMeteringEnabled: false,
  android: {
    extension: '.wav',
    outputFormat: Audio.AndroidOutputFormat.DEFAULT,
    audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 256000,
  },
  ios: {
    extension: '.wav',
    outputFormat: Audio.IOSOutputFormat.LINEARPCM,
    audioQuality: Audio.IOSAudioQuality.HIGH,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 256000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/wav',
    bitsPerSecond: 256000,
  },
};

export function useVoice() {
  const [state, setState] = useState<AsyncState<VoiceResult>>({
    status: 'idle',
    data: null,
    error: null,
  });
  const [isRecording, setIsRecording] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        setState({ status: 'error', data: null, error: 'Microphone permission denied.' });
        return;
      }

      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

      const { recording } = await Audio.Recording.createAsync(PCM_WAV_RECORDING);
      recordingRef.current = recording;
      setIsRecording(true);
      setState({ status: 'loading', data: null, error: null });

      // Auto-stop after timeout
      timeoutRef.current = setTimeout(() => {
        void stopRecording();
      }, Config.VOICE_TIMEOUT_MS);
    } catch {
      setState({ status: 'error', data: null, error: 'Failed to start recording.' });
      setIsRecording(false);
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

      // Read the recorded file directly as base64 (reliable on Hermes,
      // unlike fetch().blob() + FileReader).
      const base64 = await new File(uri).base64();

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
