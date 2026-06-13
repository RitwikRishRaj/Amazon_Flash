import type { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import type { ApiResponse } from '../shared/types';

// ─── Intent Router ────────────────────────────────────────────────────────────
// Routes incoming requests to the appropriate processing function based on
// the declared intent type in the request body.

interface IntentRequest {
  type:    'voice' | 'snap' | 'text';
  payload: unknown;
}

export const handler: APIGatewayProxyHandler = async (event): Promise<APIGatewayProxyResult> => {
  const requestId = event.requestContext.requestId;

  try {
    if (!event.body) {
      return respond(400, { error: 'Missing request body' });
    }

    const body = JSON.parse(event.body) as IntentRequest;

    const routeMap: Record<string, string> = {
      voice: '/voice/process',
      snap:  '/snap/process',
      text:  '/predict/cart',
    };

    const route = routeMap[body.type];
    if (!route) {
      return respond(400, { error: `Unknown intent type: ${body.type}` });
    }

    // Return the resolved route for API gateway to forward
    const response: ApiResponse<{ route: string }> = {
      data:      { route },
      requestId,
    };

    return respond(200, response);
  } catch (err) {
    console.error('[intentRouter] Error:', err);
    return respond(500, { error: 'Internal server error' });
  }
};

function respond(statusCode: number, body: unknown): APIGatewayProxyResult {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(body),
  };
}
