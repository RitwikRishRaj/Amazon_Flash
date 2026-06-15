import axios, { type AxiosError, type AxiosInstance } from 'axios';
import { Config } from '@constants/config';
import type {
  ApiResponse,
  VoiceResult,
  SnapResult,
  PredictCartResult,
  SubstitutionResult,
  CartItem,
  Order,
  User,
} from '@app-types/index';

// ─── Axios Instance ───────────────────────────────────────────────────────────

const http: AxiosInstance = axios.create({
  baseURL: Config.API_BASE_URL,
  timeout: Config.REQUEST_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    'X-App-Client': 'flashcart-mobile',
  },
});

// Attach session token on every request
http.interceptors.request.use((config) => {
  // Token is injected by sessionStore at runtime
  const token = (globalThis as Record<string, unknown>).__flashcart_token as string | undefined;
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

// Normalise error shape
http.interceptors.response.use(
  (res) => res,
  (err: AxiosError<{ message?: string }>) => {
    const message =
      err.response?.data?.message ??
      err.message ??
      'Unknown error';
    return Promise.reject(new Error(message));
  },
);

// ─── API Methods ──────────────────────────────────────────────────────────────

export async function processVoice(transcript: string): Promise<VoiceResult> {
  const res = await http.post<ApiResponse<VoiceResult>>('/voice/process', {
    transcript,
  });
  return res.data.data;
}

export async function processSnap(imageBase64: string): Promise<SnapResult> {
  const res = await http.post<ApiResponse<SnapResult>>('/snap/process', {
    image: imageBase64,
  });
  return res.data.data;
}

export async function fetchPredictCart(): Promise<PredictCartResult> {
  const res = await http.get<ApiResponse<PredictCartResult>>('/predict/cart');
  return res.data.data;
}

export async function fetchSubstitution(
  originalAsin: string,
): Promise<SubstitutionResult> {
  const res = await http.get<ApiResponse<SubstitutionResult>>(
    `/products/${originalAsin}/substitute`,
  );
  return res.data.data;
}

export async function placeOrder(items: CartItem[]): Promise<Order> {
  const res = await http.post<ApiResponse<Order>>('/orders', { items });
  return res.data.data;
}

export async function signInWithPhone(phoneNumber: string): Promise<string> {
  const res = await http.post<ApiResponse<{ sessionId: string }>>('/auth/signin/phone', {
    phoneNumber,
  });
  return res.data.data.sessionId;
}

export async function verifyPhoneOtp(
  phoneNumber: string,
  sessionId: string,
  code: string,
): Promise<{ user: User; token: string }> {
  const res = await http.post<ApiResponse<{ user: User; token: string }>>('/auth/verify/otp', {
    phoneNumber,
    sessionId,
    code,
  });
  return res.data.data;
}
