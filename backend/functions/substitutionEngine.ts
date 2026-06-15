import type { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { scanItems, Tables } from '../shared/dynamo';
import { invokeClaudeJSON } from '../shared/bedrock';
import { Prompts } from '../shared/prompts';
import type { ApiResponse, SubstitutionResult, Product } from '../shared/types';

// ─── Substitution Engine ──────────────────────────────────────────────────────
// When a product is OOS, finds similar alternatives via DynamoDB category query,
// then uses Bedrock to rank and select the best substitute.

export const handler: APIGatewayProxyHandler = async (event): Promise<APIGatewayProxyResult> => {
  const requestId = event.requestContext.requestId;

  try {
    const asin = event.pathParameters?.['asin'];
    if (!asin) return respond(400, { error: 'Missing ASIN' });

    // Fetch original product using scanItems by ASIN filter since asin is not the partition key
    const products = await scanItems<Product>({
      TableName: Tables.products,
      FilterExpression: 'asin = :asin',
      ExpressionAttributeValues: { ':asin': asin },
      Limit: 1,
    });
    const original = products[0] ?? null;
    if (!original) return respond(404, { error: 'Product not found' });

    // Find alternatives in the same category that are in stock
    const alternatives = await scanItems<Product>({
      TableName: Tables.products,
      FilterExpression: 'category = :cat AND inStock = :true AND id <> :id',
      ExpressionAttributeValues: {
        ':cat': original.category,
        ':true': true,
        ':id': original.id,
      },
      Limit: 10,
    });

    if (alternatives.length === 0) {
      return respond(404, { error: 'No alternatives available' });
    }

    // Bedrock: rank alternatives (fall back to the first alternative if unavailable)
    const altNames = alternatives.map((a) => `${a.name} by ${a.brand}`);
    let substitute: Product | undefined;
    let similarityScore = 0.75;
    let reason = 'Closest in-stock match in the same category.';
    try {
      const choice = await invokeClaudeJSON<{
        chosenIndex: number;
        similarityScore: number;
        reason: string;
      }>(Prompts.substitute(original.name, original.brand, altNames));
      substitute = alternatives[choice.chosenIndex - 1];
      if (substitute) {
        similarityScore = choice.similarityScore;
        reason = choice.reason;
      }
    } catch (bedrockErr) {
      console.warn('[substitutionEngine] Bedrock unavailable, using first alternative:', bedrockErr);
    }

    if (!substitute) substitute = alternatives[0];

    const result: SubstitutionResult = {
      original,
      substitute,
      similarityScore,
      reason,
    };

    const response: ApiResponse<SubstitutionResult> = { data: result, requestId };
    return respond(200, response);
  } catch (err) {
    console.error('[substitutionEngine] Error:', err);
    return respond(500, { error: 'Substitution failed' });
  }
};

function respond(statusCode: number, body: unknown): APIGatewayProxyResult {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(body),
  };
}
