import { useState, useRef, useCallback } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { processSnap } from '@services/api';
import type { AsyncState, SnapResult } from '@app-types/index';

export function useCamera() {
  const [permission, requestPermission] = useCameraPermissions();
  const [state, setState] = useState<AsyncState<SnapResult>>({
    status: 'idle',
    data:   null,
    error:  null,
  });
  const cameraRef = useRef<CameraView | null>(null);

  const captureAndScan = useCallback(async () => {
    if (!cameraRef.current) {
      setState({ status: 'error', data: null, error: 'Camera not ready.' });
      return;
    }

    setState({ status: 'loading', data: null, error: null });

    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64:  true,
        quality: 0.7,
      });

      if (!photo?.base64) throw new Error('Failed to capture image.');

      const result = await processSnap(photo.base64);
      setState({ status: 'success', data: result, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Scan failed.';
      setState({ status: 'error', data: null, error: message });
    }
  }, []);

  const reset = useCallback(() => {
    setState({ status: 'idle', data: null, error: null });
  }, []);

  return {
    permission,
    requestPermission,
    cameraRef,
    state,
    captureAndScan,
    reset,
  };
}
