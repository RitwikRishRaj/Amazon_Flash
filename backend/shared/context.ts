import type { APIGatewayProxyEvent } from 'aws-lambda';

// ─── Request Context Helpers ──────────────────────────────────────────────────
// Auth is mock-only in this build: there is no Cognito authorizer in front of the
// API. We still try to read a Cognito `sub` claim if one is ever present, but we
// fall back to a seeded demo user so PredictCart / checkout / orders work with
// real catalog data during the demo.

const DEMO_USER_ID = 'user-001';

interface CognitoClaims {
    sub?: string;
    [key: string]: unknown;
}

/**
 * Resolve the user id for a request.
 * Order: verified Cognito `sub` claim → `x-user-id` header → seeded demo user.
 * Never returns null, so handlers always have a usable identity for the demo.
 */
export function getUserId(event: APIGatewayProxyEvent): string {
    const authorizer = event.requestContext.authorizer as
        | { claims?: CognitoClaims; sub?: string }
        | undefined;

    const sub = authorizer?.claims?.sub ?? authorizer?.sub;
    if (typeof sub === 'string' && sub.length > 0) return sub;

    const headers = event.headers ?? {};
    const headerUserId = headers['x-user-id'] ?? headers['X-User-Id'];
    if (typeof headerUserId === 'string' && headerUserId.length > 0) return headerUserId;

    return DEMO_USER_ID;
}
