import type { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { invokeClaudeJSON } from '../shared/bedrock';
import { Prompts } from '../shared/prompts';
import { getItem, scanItems, Tables } from '../shared/dynamo';
import { getUserId } from '../shared/context';
import type { ApiResponse, PredictCartResult, Product, User } from '../shared/types';

/**
 * Fallback predictions when Bedrock is unavailable (e.g. model access pending):
 * return up to 5 in-stock catalog products so the UI still has something useful.
 */
async function fallbackProducts(): Promise<Product[]> {
  const all = await scanItems<Product>({
    TableName: Tables.products,
    FilterExpression: 'inStock = :true',
    ExpressionAttributeValues: { ':true': true },
    Limit: 25,
  });
  return all.slice(0, 12);
}

// ─── Predict Cart Engine ──────────────────────────────────────────────────────
// Generates personalised product predictions via Bedrock, then resolves each
// predicted query to a real product from DynamoDB.

export const handler: APIGatewayProxyHandler = async (event): Promise<APIGatewayProxyResult> => {
  const requestId = event.requestContext.requestId;

  try {
    const userId = getUserId(event);

    // Fetch order history
    const user = await getItem<User>(Tables.users, { id: userId });
    const orderHistory = user?.orderHistory ?? [];

    const hour = new Date().getHours();
    const timeOfDay =
      hour < 12 ? 'morning' :
        hour < 17 ? 'afternoon' :
          hour < 21 ? 'evening' : 'night';

    let items: Product[];
    try {
      // Bedrock: generate predicted product IDs
      const productIds = await invokeClaudeJSON<string[]>(
        Prompts.predictCart(userId, orderHistory, timeOfDay),
      );

      // Resolve IDs to real products
      const resolved = await Promise.all(
        productIds.slice(0, 5).map((id) => getItem<Product>(Tables.products, { id })),
      );
      items = resolved.filter((p): p is Product => p !== null);

      // If the model returned nothing usable, fall back to the catalog
      if (items.length === 0) items = await fallbackProducts();
    } catch (bedrockErr) {
      console.warn('[predictCartEngine] Bedrock unavailable, using catalog fallback:', bedrockErr);
      items = await fallbackProducts();
    }

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
