# FlashCart 🚀

**AI-powered urgent shopping for Amazon Now**

> The core thesis: urgent shoppers don't want to search. They want the thing in under 30 seconds.

---

## Architecture

```
flashcart/
├── app/        React Native (Expo SDK 51) — mobile client
└── backend/    AWS Lambda (Node.js 20, TypeScript) — serverless API
```

## Three Entry Points

| Entry Point | Trigger | Pipeline |
|---|---|---|
| **FlashAsk** | Voice | Expo Audio → Lex → Bedrock |
| **SnapReorder** | Camera scan | Expo Camera → Rekognition |
| **PredictCart** | AI pre-load | Bedrock → DynamoDB cache |

## Getting Started

```bash
# Install dependencies
yarn install

# Start the app (Expo)
yarn app

# Start backend (serverless-offline)
yarn backend
```

## Design System

All design decisions are documented in [`design.md`](./design.md).
All color tokens live in [`app/src/constants/colors.ts`](./app/src/constants/colors.ts).

## Rules

- TypeScript strict mode everywhere. No `any`.
- Design tokens only — no hardcoded hex values in components.
- No mock data in screens — all data flows through hooks → services → API.
- Every screen must handle: loading, error, empty, and success states.
- PredictCart is offline-first via AsyncStorage.
