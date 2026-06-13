import { create } from 'zustand';
import type { User } from '@app-types/index';

interface SessionState {
  user:          User | null;
  token:         string | null;
  urgentMode:    boolean;
  setUser:       (user: User, token: string) => void;
  clearSession:  () => void;
  setUrgentMode: (enabled: boolean) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  user:       null,
  token:      null,
  urgentMode: false,

  setUser: (user, token) => {
    // Expose token for the API axios interceptor
    (globalThis as Record<string, unknown>).__flashcart_token = token;
    set({ user, token });
  },

  clearSession: () => {
    (globalThis as Record<string, unknown>).__flashcart_token = undefined;
    set({ user: null, token: null, urgentMode: false });
  },

  setUrgentMode: (enabled) => set({ urgentMode: enabled }),
}));
