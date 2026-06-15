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
# Install dependencies (app + backend)
npm run install:all

# Start the app (Expo)
npm run app

# Start backend (serverless-offline)
npm run backend
```

### Environment

App (`app/.env`):

```
EXPO_PUBLIC_API_BASE_URL=<your API Gateway base URL>
EXPO_PUBLIC_COGNITO_DOMAIN=<your Cognito hosted-UI domain>
EXPO_PUBLIC_COGNITO_CLIENT_ID=<your Cognito app client id>
```

Backend (`backend/.env`, see `backend/.env.example`):

```
COGNITO_USER_POOL_ARN=<arn of the Cognito user pool>
COGNITO_CLIENT_ID=<app client id>
LEX_BOT_ID=<lex v2 bot id>
LEX_BOT_ALIAS_ID=<lex v2 bot alias id>
```

All protected endpoints sit behind a Cognito User Pools API Gateway authorizer.
The mobile client sends the Cognito `IdToken` as `Authorization: Bearer <token>`;
handlers read the authenticated user from the verified `sub` claim.

## Design System

All design decisions are documented in [`design.md`](./design.md).
All color tokens live in [`app/src/constants/colors.ts`](./app/src/constants/colors.ts).

## Rules

- TypeScript strict mode everywhere. No `any`.
- Design tokens only — no hardcoded hex values in components.
- No mock data in screens — all data flows through hooks → services → API.
- Every screen must handle: loading, error, empty, and success states.
- PredictCart is offline-first via AsyncStorage.
