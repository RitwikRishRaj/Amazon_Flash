# FlashCart — Feature Status & Workflows

> AI-powered urgent shopping for Amazon Now (India build).
> Last updated for the `us-east-1`, mock-auth, INR/₹ configuration.

This document explains **what works**, **what's partial**, **what's pending**, the **workflows** behind each feature, and the **value/advantages** of each.

---

## 1. At-a-glance status

| Area | Status | Notes |
|---|---|---|
| App boot / navigation | ✅ Working | Splash → Onboarding/Home routing with session hydration |
| Auth (login) | 🟡 Mock | Any phone + any 6-digit OTP logs you in; Google via Cognito hosted UI |
| Home + PredictCart | ✅ Working | AI predictions with catalog fallback |
| Product Comparison | ✅ Working | New feature — side-by-side compare up to 4 |
| FlashAsk (voice) | 🟡 Dev build for real STT | App no longer crashes in Expo Go; mic falls back gracefully there |
| SnapReorder (camera) | 🟡 Partial | Camera works; image→product match needs Bedrock |
| Checkout → Confirm | ✅ Working | Pre-filled address/payment, swipe to order |
| SwapAI (substitution) | ✅ Working | Out-of-stock → AI/closest substitute |
| amazon.in deep links | ✅ Working | "View on Amazon.in" per product |
| Bedrock AI (Claude) | 🟡 Pending | Needs Anthropic use-case form; **fallbacks keep app working** |
| Backend (AWS) | ✅ Deployed | API Gateway + 10 Lambdas + DynamoDB in us-east-1 (latest code live) |

Legend: ✅ working · 🟡 partial / conditional · 🔴 not working.

---

## 2. Architecture & core workflow

```
React Native (Expo SDK 54)  ──HTTPS──▶  API Gateway (us-east-1)
   app/ (TypeScript)                         │
   - Zustand stores (cart, session, compare) ▼
   - axios service layer                10 Lambda functions (Node 20, TS)
                                              │
                         ┌────────────────────┼─────────────────────┐
                         ▼                    ▼                     ▼
                   DynamoDB             Amazon Bedrock         Rekognition
              (products/users/orders)   (Claude 3.5 Haiku)    (image labels)
```

**Auth model (current):** mock — the API has **no Cognito authorizer**. Each request resolves to a seeded demo user (`user-001`) so cart/checkout/orders return real data. This was an intentional choice to keep the demo frictionless.

**Resilience principle:** every AI-dependent endpoint has a **deterministic fallback**, so the app stays functional even before Bedrock model access is approved.

---

## 3. Screen-by-screen: workflows, status & advantages

### SplashScreen — ✅ Working
- **Workflow:** Animates the wordmark, hydrates the saved session from AsyncStorage, then routes to **Home** (if a token exists) or **Onboarding** after ~2s.
- **Advantage:** Returning users skip login; session persists across app restarts.

### OnboardingScreen — 🟡 Mock auth
- **Workflow (phone):** Enter a **+91** number → "Send Verification Code" → enter **any 6-digit code** → logged in. Real Cognito calls are attempted first; on failure it falls back to a mock session.
- **Workflow (Google):** Opens the Cognito hosted-UI login in a browser tab; on redirect, exchanges the code for tokens. Works only if a Google IdP is configured on the pool.
- **What does NOT work:** Real SMS OTP (needs Cognito custom-auth Lambda triggers + SNS + India DLT registration). 
- **Advantage:** Zero-friction entry for demos; the real Cognito wiring is in place and can be switched on later.

### HomeScreen — ✅ Working
- **Workflow:** Greets the user, loads **PredictCart** (AI-predicted items, offline-first via AsyncStorage cache), shows three entry points (FlashAsk, SnapReorder, Browse) and reorder chips.
- **PredictCart:** Calls `/predict/cart`. If Bedrock is available → AI-ranked products; otherwise → in-stock catalog fallback (up to 12 items).
- **Compare toggles:** Each product card has a compare icon; selecting 2+ shows a floating **"Compare N items"** button.
- **What's cosmetic only:** The bottom-tab **Search** and **Profile** icons are placeholders (no screens yet). **Cart** opens checkout.
- **Advantage:** Surfaces what the user needs *now* without searching — the core "30-second checkout" thesis.

### Product Comparison (CompareScreen) — ✅ Working *(new)*
- **Workflow:** Tap compare on products → open Compare → side-by-side table of **price, delivery time, stock, category**, with **LOWEST** and **FASTEST** badges, plus per-product **Add to Cart** and **View on Amazon.in**.
- **Example:** Compare **Red Bull** vs **Monster** vs **Sting** (energy drinks), or **Dettol** vs **Lifebuoy** (handwash), or **Tropicana** vs **Real** (juice).
- **Advantage:** Lets urgent shoppers make a fast, informed pick across substitutes without leaving the flow.

### FlashAsk (voice) — 🟡 Works in a dev build
- **Workflow:** Tap the mic → **on-device speech recognition** (Android/iOS, `en-IN`) produces a transcript → sent to `/voice/process` → backend **keyword matcher** resolves it to a product → result slides up → swipe to order.
- **Reliability:** Matching is deterministic (e.g., "dettol", "monster", "juice", "paracetamol", "red bull" all resolve), with Bedrock as a smart fallback. Verified working server-side.
- **What does NOT work:** Voice in **Expo Go** — `expo-speech-recognition` is a native module and requires a **dev build** (`npx expo run:android`). The module is now **lazily loaded**, so Expo Go **no longer crashes**: tapping the mic there just shows a "needs dev build" message and FlashAsk falls back to a demo product. Lex audio ASR only works on iOS.
- **Advantage:** Hands-free ordering; says a product name and it's matched instantly without typing.

### SnapReorder (camera) — 🟡 Partial
- **Workflow:** Full-screen camera → "Scan Now" captures a frame → `/snap/process` → **Rekognition** detects labels → **Bedrock** maps labels to a catalog product → result card → add to cart.
- **What does NOT work yet:** The label→product step depends on **Bedrock** (no keyword fallback yet), so until the Anthropic form is approved it returns "no match". Camera itself works best in a **dev build**.
- **Advantage:** Reorder a physical product by pointing the camera at it — no searching.

### CheckoutScreen — ✅ Working
- **Workflow:** Review items, pre-filled **Indian address** + masked payment, delivery ETA (max across items), **swipe to confirm** → `/orders` → Confirmed.
- **Safety:** Empty-cart state prevents ₹0 orders.
- **Advantage:** One-swipe checkout with InstaBuy-style pre-fill.

### ConfirmedScreen — ✅ Working
- **Workflow:** Success animation, order ID, ETA, item summary, back to home.
- **Advantage:** Clear confirmation and delivery expectation.

### SwapAI (substitution) — ✅ Working
- **Workflow:** When an item is out of stock (e.g., **Advil**), `/products/{asin}/substitute` finds in-stock same-category alternatives → Bedrock ranks the best (or falls back to the closest in-stock item) → side-by-side **original vs substitute** with a similarity bar → Accept / Try Again.
- **Advantage:** Keeps the order moving instead of dead-ending on stockouts.

---

## 4. Backend endpoints

| Endpoint | Method | Status | Fallback when AI is down |
|---|---|---|---|
| `/auth/signin/phone`, `/auth/verify/otp` | POST | 🟡 Mock | App mock-login |
| `/predict/cart` | GET | ✅ | In-stock catalog (up to 12) |
| `/voice/process` | POST | ✅ | Keyword matcher (no AI needed) |
| `/snap/process` | POST | 🟡 | None yet (needs Bedrock) |
| `/context/classify` | POST | ✅ | Pure heuristics (no AI) |
| `/checkout/assemble` | POST | ✅ | — |
| `/products/{asin}/substitute` | GET | ✅ | First in-stock alternative |
| `/orders` | POST | ✅ | — |
| `/intent` | POST | ⚪ Unused | Dead route (not called by app) |

---

## 5. Infrastructure status

- **Region:** `us-east-1` (chosen because it supports Bedrock, Lex, Rekognition, Cognito, DynamoDB natively — India regions don't have Lex).
- **DynamoDB:** 13 products (incl. Dettol, Monster, Sting, Real, Lifebuoy) + 2 users seeded. ✅
- **Cognito:** User pool + public app client + hosted-UI domain created. Used only nominally (mock auth). ✅
- **Bedrock:** `Claude 3.5 Haiku` (inference profile). 🔴 Blocked until the **Anthropic use-case form** is submitted in the Bedrock console. Fallbacks keep the app working meanwhile.
- **Lambdas:** 10 functions deployed (latest code live — stack `UPDATE_COMPLETE`). ✅

> ✅ **Up to date:** the matcher additions (Monster/Sting/Lifebuoy/Real keywords) and the 12-item PredictCart fallback are **deployed and live**. Voice resolves all 13 products and PredictCart returns up to 12 items.

---

## 6. Known limitations / not working

- **Real authentication** — mock only; no JWT verification (intentional for demo).
- **Bedrock AI** — predictions/snap/substitution use fallbacks until the Anthropic form is approved.
- **Voice in Expo Go** — requires a dev build (native speech module).
- **SnapReorder matching** — needs Bedrock (no keyword fallback yet).
- **Search & Profile tabs** — placeholders, no screens.
- **Live amazon.in catalog fetch** — not possible without PA-API keys; products are real amazon.in items with deep links, but data is seeded (not live).
- **Push notifications & WebSocket order tracking** — code exists but not wired into the live flow.

---

## 7. Key advantages of the build

- **Resilient by design** — deterministic fallbacks mean no screen hard-fails when AI/credentials aren't ready.
- **Fast, deterministic voice matching** — keyword resolver guarantees common products map instantly, independent of model availability.
- **Fully India-localized** — ₹ INR pricing, +91 phone, Indian addresses, Indian brands (Amul, Crocin, Dettol, Yoga Bar, etc.).
- **Type-safe end to end** — strict TypeScript on app and backend; shared domain types kept in sync.
- **Design-token theming** — no hardcoded colors; consistent dark/urgent aesthetic.
- **Offline-first PredictCart** — cached predictions render instantly, refresh in background.
- **Real amazon.in deep links** — every product opens its actual Amazon India listing.
- **Comparison feature** — informed, fast substitution decisions for urgent shoppers.

---

## 8. How to run

```bash
# Backend (deploy to AWS us-east-1)
npm run backend:deploy
npm run backend:seed       # loads the 13 products + 2 users

# App — most features work in Expo Go:
npm run app                # then scan QR / press a

# App — full features incl. voice & camera (Android dev build):
cd app && npx expo run:android
```

**To unlock full AI:** submit the **Anthropic use-case form** in the Bedrock console (us-east-1), wait ~15 min — predictions/snap/substitution then become AI-ranked automatically (no code change).

---

## 9. Demo video — what to showcase

### ✅ Safe to record (reliable, no AI/Bedrock needed)
These work in **Expo Go** and don't depend on the pending Anthropic form:

1. **Splash → Onboarding** — show the animated splash, then the **+91** phone login. Enter any number + any 6-digit code to log in (mock). Optionally show the Google button.
2. **Home / PredictCart** — the greeting, the predicted-products carousel (catalog fallback looks like real recommendations), and the reorder chips.
3. **Product Comparison (highlight feature)** — tap the **compare icon** on a few products → floating **"Compare N items"** → CompareScreen. Compare **Red Bull vs Monster vs Sting** to show the **LOWEST / FASTEST** badges, **Add to Cart**, and **View on Amazon.in** (opens the real amazon.in listing).
4. **Cart → Checkout** — show pre-filled **Indian address + payment**, delivery ETA, and the **swipe-to-confirm**.
5. **Confirmed** — the success animation, order ID, and ETA.
6. **SwapAI (substitution)** — add an **out-of-stock** item (e.g., **Advil**) from the reorder chips → it routes to SwapAI showing **original vs substitute** with the similarity bar → Accept. (Works via fallback even without Bedrock.)

### 🟡 Record only on a dev build / after setup
- **FlashAsk (voice)** — only in an **Android dev build** (`npx expo run:android`), not Expo Go. Then: tap mic, say **"dettol"** / **"monster"** / **"orange juice"** → it matches and you swipe to order. *(Live and deployed — Monster/Sting/Lifebuoy/Real all resolve.)*
- **SnapReorder (camera)** — camera UI records well, but the **match result needs Bedrock** (Anthropic form). Show the scanning reticle, but don't rely on a successful match unless AI is enabled.

### 🔴 Avoid showing
- Bottom-tab **Search / Profile** (placeholders, no screens).
- A successful **SnapReorder match** before the Anthropic form is approved.
- Anything implying **real SMS OTP** (it's mocked).

### Suggested 60–90s flow
Splash → +91 login → Home (PredictCart) → **Compare Red Bull vs Monster** → Add to cart → Checkout (swipe) → Confirmed → back Home → tap an out-of-stock chip → **SwapAI** accept. *(If on a dev build, open with **FlashAsk: "get me a dettol"** as the hook.)*

### Pre-record checklist
- [x] Backend deployed — newest matcher + 12-item PredictCart are **live** (stack `UPDATE_COMPLETE`).
- [ ] `npx expo start --clear` (env baked in: API URL, ₹, +91).
- [ ] Cart empty before starting (clean checkout demo).
- [ ] For voice: use the **Android dev build**, grant mic permission once.
- [ ] (Optional) Submit the Anthropic form first if you want AI predictions + working SnapReorder on camera.
