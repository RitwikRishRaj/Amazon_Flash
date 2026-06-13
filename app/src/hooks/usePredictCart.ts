import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchPredictCart } from '@services/api';
import { Config } from '@constants/config';
import type { AsyncState, PredictCartResult } from '@app-types/index';

function isCacheValid(generatedAt: string): boolean {
  const age = Date.now() - new Date(generatedAt).getTime();
  return age < Config.PREDICT_CACHE_TTL_MS;
}

/**
 * usePredictCart
 * Offline-first: loads cached predictions immediately, refreshes in background.
 * Cache is stored in AsyncStorage under Config.PREDICT_CACHE_KEY.
 */
export function usePredictCart() {
  const [state, setState] = useState<AsyncState<PredictCartResult>>({
    status: 'idle',
    data:   null,
    error:  null,
  });

  const loadFromCache = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(Config.PREDICT_CACHE_KEY);
      if (!raw) return false;
      const cached = JSON.parse(raw) as PredictCartResult;
      if (!isCacheValid(cached.generatedAt)) return false;
      setState({ status: 'success', data: { ...cached, fromCache: true }, error: null });
      return true;
    } catch {
      return false;
    }
  }, []);

  const refreshFromNetwork = useCallback(async () => {
    try {
      const result = await fetchPredictCart();
      await AsyncStorage.setItem(Config.PREDICT_CACHE_KEY, JSON.stringify(result));
      setState({ status: 'success', data: { ...result, fromCache: false }, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load predictions.';
      // Only surface error if we have no cached data
      setState((prev) => {
        if (prev.data) return prev; // keep showing cached
        return { status: 'error', data: null, error: message };
      });
    }
  }, []);

  useEffect(() => {
    setState((prev) => ({ ...prev, status: 'loading' }));

    void (async () => {
      const hadCache = await loadFromCache();
      if (!hadCache) {
        setState({ status: 'loading', data: null, error: null });
      }
      // Always refresh in background regardless of cache hit
      await refreshFromNetwork();
    })();
  }, [loadFromCache, refreshFromNetwork]);

  const retry = useCallback(async () => {
    setState({ status: 'loading', data: null, error: null });
    await refreshFromNetwork();
  }, [refreshFromNetwork]);

  return { state, retry };
}
