import { useEffect, useState } from 'react';
import { useSessionStore } from '@store/sessionStore';

type ContextMode = 'normal' | 'urgent';

// ─── Heuristics for auto-enabling urgent mode ─────────────────────────────────
function isRushHour(): boolean {
  const hour = new Date().getHours();
  // Morning rush: 7-9am, Evening rush: 5-8pm
  return (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 20);
}

/**
 * useContextMode
 * Determines the current UI mode (normal vs urgent) based on:
 *  1. The user's manual urgentMode toggle in sessionStore
 *  2. Time-of-day rush-hour heuristics
 */
export function useContextMode(): { mode: ContextMode; setUrgent: (on: boolean) => void } {
  const { urgentMode, setUrgentMode } = useSessionStore();
  const [autoUrgent, setAutoUrgent] = useState(false);

  useEffect(() => {
    setAutoUrgent(isRushHour());

    // Re-evaluate every 5 minutes
    const interval = setInterval(() => setAutoUrgent(isRushHour()), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const mode: ContextMode = urgentMode || autoUrgent ? 'urgent' : 'normal';

  return { mode, setUrgent: setUrgentMode };
}
