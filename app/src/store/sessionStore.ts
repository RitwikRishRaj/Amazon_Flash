import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '@app-types/index';
import { Config } from '@constants/config';

interface PersistedSession {
  user: User;
  token: string;
}

interface SessionState {
  user: User | null;
  token: string | null;
  urgentMode: boolean;
  hydrated: boolean;
  setUser: (user: User, token: string) => void;
  clearSession: () => void;
  setUrgentMode: (enabled: boolean) => void;
  hydrate: () => Promise<void>;
}

function persist(session: PersistedSession | null): void {
  if (session) {
    void AsyncStorage.setItem(Config.SESSION_KEY, JSON.stringify(session));
  } else {
    void AsyncStorage.removeItem(Config.SESSION_KEY);
  }
}

export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  token: null,
  urgentMode: false,
  hydrated: false,

  setUser: (user, token) => {
    // Expose token for the API axios interceptor
    (globalThis as Record<string, unknown>).__flashcart_token = token;
    persist({ user, token });
    set({ user, token });
  },

  clearSession: () => {
    (globalThis as Record<string, unknown>).__flashcart_token = undefined;
    persist(null);
    set({ user: null, token: null, urgentMode: false });
  },

  setUrgentMode: (enabled) => set({ urgentMode: enabled }),

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(Config.SESSION_KEY);
      if (raw) {
        const { user, token } = JSON.parse(raw) as PersistedSession;
        (globalThis as Record<string, unknown>).__flashcart_token = token;
        set({ user, token, hydrated: true });
        return;
      }
    } catch {
      // ignore corrupt cache
    }
    set({ hydrated: true });
  },
}));
