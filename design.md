# FlashCart Design Specification

## Brand Philosophy
FlashCart is for the urgent shopper. Every design decision must answer: **does this get the user to checkout faster?**
Dark, focused, high-contrast. Amazon Orange on near-black. No clutter.

---

## Color System

| Token | Value | Usage |
|---|---|---|
| `bgBase` | `#0D0D0D` | App background, deepest layer |
| `bgSurface` | `#1A1A1A` | Cards, sheets |
| `bgElevated` | `#242424` | Modals, popovers, elevated cards |
| `bgBorder` | `#2A2A2A` | Dividers, input borders |
| `accentPrimary` | `#FF9900` | CTAs, active states, brand |
| `accentDim` | `#CC7A00` | Pressed states, secondary accent |
| `textPrimary` | `#FFFFFF` | Headings, primary text |
| `textMuted` | `#8A8A8A` | Secondary labels, captions |
| `textMicro` | `#5A5A5A` | Timestamps, metadata |
| `success` | `#1DB954` | Order confirmed, in-stock |
| `danger` | `#E53935` | OOS, errors, destructive |

---

## Typography

- **Display** — 28px, Bold, `textPrimary`
- **Heading** — 22px, SemiBold, `textPrimary`
- **Body** — 15px, Regular, `textPrimary`
- **Caption** — 12px, Regular, `textMuted`
- **Micro** — 10px, Regular, `textMicro`
- Font family: `System` (SF Pro on iOS, Roboto on Android)

---

## Spacing

4px base grid. Multiples: 4, 8, 12, 16, 24, 32, 48.

---

## Screen Designs

### SplashScreen
- Full bleed `bgBase`
- Center: FlashCart wordmark in `accentPrimary`, bolt icon animation
- Auto-navigates after 2s once auth check resolves

### HomeScreen
Two modes — **Normal** and **Urgent**.

**Normal Mode:**
- Header: "Good morning, [name]" in Display
- PredictCard carousel (horizontal scroll)
- Three entry point buttons: FlashAsk, SnapReorder, Browse

**Urgent Mode** (triggered by rush hour context or manual toggle):
- Background pulses subtly with `accentPrimary` glow
- UrgencyBadge: "URGENT MODE — 10 min delivery"
- PredictCart items surface immediately as tappable chips

### FlashAskScreen
- Full-screen dark modal
- Giant MicButton center — animates ring pulses while recording
- Live transcript text fades in below mic
- After processing: ProductResultCard slides up from bottom

### SnapReorderScreen
- Full-screen camera with ScanReticle overlay
- Corner brackets animate to indicate scanning
- Bottom sheet slides up with ProductResultCard on match

### CheckoutScreen
- Pre-filled address + payment (InstaBuy)
- OrderSummary card
- SwipeToConfirm at bottom — `accentPrimary` gradient fill on swipe
- DeliveryETA prominently displayed

### ConfirmedScreen
- Full-screen `success` checkmark animation (Lottie)
- Order ID, ETA in large text
- "Track Order" CTA

### SwapAIScreen
- Triggered when original item is OOS
- AI-chosen substitute with similarity score
- Side-by-side diff: original vs substitute
- Accept / Try Again actions

---

## Components

### EntryPointButton
- 80×80 pill, `bgSurface` fill, `accentPrimary` icon
- Label below in Caption
- Press: scale down to 0.95, haptic impact

### MicButton
- 88×88 circle, `accentPrimary` background
- Concentric ring animation while recording (scale + opacity pulsing)
- Idle: static mic icon

### ScanReticle
- Transparent overlay with 4 corner bracket SVGs in `accentPrimary`
- Bracket corners animate inward while scanning

### ProductResultCard
- `bgSurface` card, 16px radius
- Product image left, name + price right
- UrgencyBadge top-right if in urgent mode
- DeliveryETA row at bottom

### SwipeToConfirm
- Full-width track, `bgBorder` fill
- Thumb: `accentPrimary` circle with chevron icon
- Track fills with `accentPrimary` gradient on drag
- Haptic success on complete

### UrgencyBadge
- Pill shape, `danger` background, white text "URGENT" + bolt icon
- Subtle pulse animation

### DeliveryETA
- Row: bolt icon + "Arrives in X min" in `success`
- Bold X value

### PredictCard
- `bgSurface` card, horizontal in carousel
- Product thumbnail, name (1 line truncated), predicted confidence bar

---

## Motion

- Screen transitions: slide from right (standard), slide up (modals)
- All interactive elements: spring animation on press (scale 0.95)
- Loading: skeleton shimmer on `bgElevated` → `bgSurface`
- Mic recording: `useAnimatedStyle` with `withRepeat` + `withTiming`
- SwipeToConfirm: `react-native-gesture-handler` + Reanimated 3

---

## Error States

Every screen must show:
- Network error: inline banner, `danger` background, retry CTA
- Empty result: centered illustration + helpful copy
- Timeout: same as network error + fallback to Browse
