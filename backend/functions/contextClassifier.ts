import type { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';

// ─── Context Classifier ───────────────────────────────────────────────────────
// Classifies the shopping context (normal vs urgent) based on:
//  - Time of day
//  - User signal (explicit toggle, or previous order cadence)
//  - Device signals (if provided by client)

interface ContextRequest {
  hour?:          number;   // 0-23, defaults to server time
  userSignal?:    boolean;  // explicit urgent toggle from app
  deviceSignals?: {
    battery?:   number;   // 0-100
    motion?:    boolean;  // is the user moving?
  };
}

interface ContextResult {
  mode:       'normal' | 'urgent';
  confidence: number;
  reasons:    string[];
}

export const handler: APIGatewayProxyHandler = async (event): Promise<APIGatewayProxyResult> => {
  const requestId = event.requestContext.requestId;

  try {
    const body = event.body ? (JSON.parse(event.body) as ContextRequest) : {};

    const hour = body.hour ?? new Date().getHours();
    const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 20);

    const reasons: string[] = [];
    let score = 0;

    if (body.userSignal) { score += 1.0; reasons.push('User manually enabled urgent mode'); }
    if (isRushHour)       { score += 0.5; reasons.push('Rush hour detected'); }
    if (body.deviceSignals?.motion)  { score += 0.2; reasons.push('User is in motion'); }
    if ((body.deviceSignals?.battery ?? 100) < 20) { score += 0.1; reasons.push('Low battery — user likely on the go'); }

    const mode: 'urgent' | 'normal' = score >= 0.5 ? 'urgent' : 'normal';

    const result: ContextResult = { mode, confidence: Math.min(score, 1), reasons };
    return respond(200, { data: result, requestId });
  } catch (err) {
    console.error('[contextClassifier] Error:', err);
    return respond(500, { error: 'Context classification failed' });
  }
};

function respond(statusCode: number, body: unknown): APIGatewayProxyResult {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(body),
  };
}
