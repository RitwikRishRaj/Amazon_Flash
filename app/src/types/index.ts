// ─── Domain Types ────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  asin: string;
  name: string;
  brand: string;
  imageUrl: string;
  price: number;
  currency: string;
  inStock: boolean;
  estimatedDeliveryMin: number;
  category: string;
  confidence?: number; // 0-1, used by PredictCart and SnapReorder
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  totalPrice: number;
  currency: string;
  address: Address;
  paymentMethodLast4: string;
  status: OrderStatus;
  placedAt: string;   // ISO 8601
  etaMin: number;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'picking'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  defaultAddress: Address;
  defaultPaymentLast4: string;
  orderHistory: string[];      // order IDs
  urgentModeEnabled: boolean;
}

// ─── API Response Wrappers ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  requestId: string;
}

export interface ApiError {
  code: string;
  message: string;
  requestId?: string;
}

// ─── Feature-Specific Types ───────────────────────────────────────────────────

export interface VoiceResult {
  transcript: string;
  intent: string;
  product: Product | null;
  confidence: number;
}

export interface SnapResult {
  product: Product | null;
  confidence: number;
  rawLabels: string[];
}

export interface PredictCartResult {
  items: Product[];
  generatedAt: string; // ISO 8601
  fromCache: boolean;
}

export interface SubstitutionResult {
  original: Product;
  substitute: Product;
  similarityScore: number;
  reason: string;
}

// ─── Navigation Types ─────────────────────────────────────────────────────────

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Home: undefined;
  FlashAsk: undefined;
  SnapReorder: undefined;
  Checkout: { items: CartItem[] };
  Confirmed: { order: Order };
  SwapAI: { original: Product; substitute: Product; similarityScore: number };
};

// ─── UI State Types ───────────────────────────────────────────────────────────

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  status: LoadingState;
  data: T | null;
  error: string | null;
}
