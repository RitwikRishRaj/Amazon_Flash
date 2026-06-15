// ─── Shared Domain Types (Backend) ───────────────────────────────────────────

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
  confidence?: number;
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
  placedAt: string;
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
  orderHistory: string[]; // order IDs
  urgentModeEnabled: boolean;
}

// ─── Request / Response ───────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  requestId: string;
}

export interface VoiceRequest { audio: string }  // base64 wav/m4a
export interface SnapRequest { image: string }  // base64 jpeg

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
  generatedAt: string;
  fromCache: boolean;
}

export interface SubstitutionResult {
  original: Product;
  substitute: Product;
  similarityScore: number;
  reason: string;
}
