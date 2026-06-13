/**
 * polyfills.ts
 * Must be imported FIRST in index.ts before anything else.
 * Some packages (react-native-reanimated 3.16+, react-navigation v7) reference
 * browser-only APIs like DOMRect during module initialisation.
 * This provides a minimal stub so Hermes doesn't crash on startup.
 */

type DOMRectInitLocal = { x?: number; y?: number; width?: number; height?: number };

class DOMRectPolyfill {
  x: number;
  y: number;
  width: number;
  height: number;

  constructor(x = 0, y = 0, width = 0, height = 0) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  get top()    { return this.y; }
  get left()   { return this.x; }
  get right()  { return this.x + this.width; }
  get bottom() { return this.y + this.height; }

  static fromRect(rect?: DOMRectInitLocal): DOMRectPolyfill {
    return new DOMRectPolyfill(rect?.x, rect?.y, rect?.width, rect?.height);
  }

  toJSON() {
    return {
      x: this.x, y: this.y, width: this.width, height: this.height,
      top: this.top, left: this.left, right: this.right, bottom: this.bottom,
    };
  }
}

// Define DOMRect as non-configurable so React Native's lazy environment setup doesn't overwrite it
Object.defineProperty(global, 'DOMRect', {
  value: DOMRectPolyfill,
  writable: true,
  configurable: false,
  enumerable: true,
});

// Define DOMRectReadOnly as non-configurable
Object.defineProperty(global, 'DOMRectReadOnly', {
  value: DOMRectPolyfill,
  writable: true,
  configurable: false,
  enumerable: true,
});

// Stub DOMPoint as non-configurable
Object.defineProperty(global, 'DOMPoint', {
  value: class DOMPoint {
    x: number; y: number; z: number; w: number;
    constructor(x = 0, y = 0, z = 0, w = 1) {
      this.x = x; this.y = y; this.z = z; this.w = w;
    }
  },
  writable: true,
  configurable: false,
  enumerable: true,
});

