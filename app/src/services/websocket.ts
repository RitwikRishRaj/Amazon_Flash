import { Config } from '@constants/config';

type MessageHandler = (data: unknown) => void;

// ─── WebSocket Service ────────────────────────────────────────────────────────
// Used for real-time order status updates pushed from the backend.

let socket: WebSocket | null = null;
const handlers = new Map<string, Set<MessageHandler>>();

export function connectWebSocket(sessionToken: string): void {
  if (socket?.readyState === WebSocket.OPEN) return;

  socket = new WebSocket(`${Config.WS_URL}?token=${sessionToken}`);

  socket.onopen = () => {
    console.log('[WS] Connected');
  };

  socket.onmessage = (event) => {
    try {
      const parsed = JSON.parse(event.data) as { type: string; payload: unknown };
      const typeHandlers = handlers.get(parsed.type);
      typeHandlers?.forEach((fn) => fn(parsed.payload));
    } catch {
      console.warn('[WS] Failed to parse message', event.data);
    }
  };

  socket.onerror = (err) => {
    console.error('[WS] Error', err);
  };

  socket.onclose = () => {
    console.log('[WS] Disconnected');
    socket = null;
  };
}

export function disconnectWebSocket(): void {
  socket?.close();
  socket = null;
  handlers.clear();
}

export function subscribeToEvent(type: string, handler: MessageHandler): () => void {
  if (!handlers.has(type)) {
    handlers.set(type, new Set());
  }
  handlers.get(type)!.add(handler);

  // Return an unsubscribe function
  return () => {
    handlers.get(type)?.delete(handler);
  };
}

export function sendMessage(type: string, payload: unknown): void {
  if (socket?.readyState !== WebSocket.OPEN) {
    console.warn('[WS] Cannot send — socket not open');
    return;
  }
  socket.send(JSON.stringify({ type, payload }));
}
