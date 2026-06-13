// All environment-specific config.
// Values are replaced at build time via EAS environment variables.

export const Config = {
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://api.flashcart.amazon.now',
  WS_URL:       process.env.EXPO_PUBLIC_WS_URL       ?? 'wss://ws.flashcart.amazon.now',

  // Timeouts (ms)
  VOICE_TIMEOUT_MS:       8_000,
  SCAN_TIMEOUT_MS:        10_000,
  REQUEST_TIMEOUT_MS:     15_000,

  // PredictCart
  PREDICT_CACHE_KEY:      'flashcart:predictcart:cache',
  PREDICT_CACHE_TTL_MS:   30 * 60 * 1000, // 30 min

  // Delivery
  URGENT_MODE_ETA_MIN:    10,
  STANDARD_ETA_MIN:       120,

  // Session
  SESSION_KEY:            'flashcart:session',
} as const;
