import type { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { invokeClaudeJSON } from '../shared/bedrock';
import { Prompts } from '../shared/prompts';
import { getItem, Tables } from '../shared/dynamo';
import { getUserId } from '../shared/context';
import type { ApiResponse, PredictCartResult, Product, User } from '../shared/types';

// ─── Predict Cart Engine ──────────────────────────────────────────────────────
// Generates personalised product predictions via Bedrock, then resolves each
// predicted query to a real product from DynamoDB.

export const handler: APIGatewayProxyHandler = async (event): Promise<APIGatewayProxyResult> => {
  const requestId = event.requestContext.requestId;

  try {
    const userId = getUserId(event);
    if (!userId) return respond(401, { error: 'Unauthorized' });

    // Fetch order history
    const user = await getItem<User>(Tables.users, { id: userId });
    const orderHistory = user?.orderHistory ?? [];

    const hour = new Date().getHours();
    const timeOfDay =
      hour < 12 ? 'morning' :
        hour < 17 ? 'afternoon' :
          hour < 21 ? 'evening' : 'night';

    // Bedrock: generate predicted product IDs
    const productIds = await invokeClaudeJSON<string[]>(
      Prompts.predictCart(userId, orderHistory, timeOfDay),
    );

    // Resolve IDs to real products
    const productPromises = productIds.slice(0, 5).map(async (id) => {
      return await getItem<Product>(Tables.products, { id });
    });

    const resolved = await Promise.all(productPromises);
    const items = resolved.filter((p): p is Product => p !== null);

    const result: PredictCartResult = {
      items,
      generatedAt: new Date().toISOString(),
      fromCache: false,
    };

    const response: ApiResponse<PredictCartResult> = { data: result, requestId };
    return respond(200, response);
  } catch (err) {
    console.error('[predictCartEngine] Error:', err);
    return respond(500, { error: 'PredictCart failed' });
  }
};

function respond(statusCode: number, body: unknown): APIGatewayProxyResult {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(body),
  };
}
