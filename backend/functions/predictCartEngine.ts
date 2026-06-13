import type { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { invokeClaudeJSON }     from '../shared/bedrock';
import { Prompts }              from '../shared/prompts';
import { getItem, scanItems, Tables } from '../shared/dynamo';
import type { ApiResponse, PredictCartResult, Product, User } from '../shared/types';

// ─── Predict Cart Engine ──────────────────────────────────────────────────────
// Generates personalised product predictions via Bedrock, then resolves each
// predicted query to a real product from DynamoDB.

export const handler: APIGatewayProxyHandler = async (event): Promise<APIGatewayProxyResult> => {
  const requestId = event.requestContext.requestId;

  try {
    const userId = event.requestContext.authorizer?.['sub'] as string | undefined ?? 'anonymous';

    // Fetch order history
    const user = await getItem<User>(Tables.users, { id: userId });
    const orderHistory = user?.orderHistory ?? [];

    const hour = new Date().getHours();
    const timeOfDay =
      hour < 12 ? 'morning' :
      hour < 17 ? 'afternoon' :
      hour < 21 ? 'evening' : 'night';

    // Bedrock: generate predicted product queries
    const queries = await invokeClaudeJSON<string[]>(
      Prompts.predictCart(userId, orderHistory, timeOfDay),
    );

    // Resolve queries to real products
    const productPromises = queries.slice(0, 5).map(async (query) => {
      const products = await scanItems<Product>({
        TableName:        Tables.products,
        FilterExpression: 'contains(#nm, :q) AND inStock = :true',
        ExpressionAttributeNames:  { '#nm': 'name' },
        ExpressionAttributeValues: { ':q': query, ':true': true },
        Limit: 1,
      });
      return products[0] ?? null;
    });

    const resolved = await Promise.all(productPromises);
    const items    = resolved.filter((p): p is Product => p !== null);

    const result: PredictCartResult = {
      items,
      generatedAt: new Date().toISOString(),
      fromCache:   false,
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
