// All environment-specific config.
// Values are replaced at build time via EAS environment variables.

export const Config = {
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://api.flashcart.amazon.now',
  WS_URL: process.env.EXPO_PUBLIC_WS_URL ?? 'wss://ws.flashcart.amazon.now',

  // Auth (Cognito) — set the real values via app/.env (EXPO_PUBLIC_*)
  COGNITO_DOMAIN: process.env.EXPO_PUBLIC_COGNITO_DOMAIN ?? 'https://flashcart-example.auth.us-east-1.amazoncognito.com',
  COGNITO_CLIENT_ID: process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID ?? '',
  COGNITO_REDIRECT_URI: 'flashcart://onboarding',

  // Timeouts (ms)
  VOICE_TIMEOUT_MS: 8_000,
  SCAN_TIMEOUT_MS: 10_000,
  REQUEST_TIMEOUT_MS: 15_000,

  // PredictCart
  PREDICT_CACHE_KEY: 'flashcart:predictcart:cache',
  PREDICT_CACHE_TTL_MS: 30 * 60 * 1000, // 30 min

  // Delivery
  URGENT_MODE_ETA_MIN: 10,
  STANDARD_ETA_MIN: 120,

  // Session
  SESSION_KEY: 'flashcart:session',
} as const;
