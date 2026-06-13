import type { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import {
  RekognitionClient,
  DetectLabelsCommand,
  type Label,
} from '@aws-sdk/client-rekognition';
import { invokeClaudeJSON } from '../shared/bedrock';
import { Prompts }          from '../shared/prompts';
import { scanItems, Tables } from '../shared/dynamo';
import type { ApiResponse, SnapRequest, SnapResult, Product } from '../shared/types';

const rekognition = new RekognitionClient({ region: process.env['AWS_REGION'] ?? 'us-east-1' });

// ─── Snap Processor ───────────────────────────────────────────────────────────
// Pipeline: base64 image → Rekognition DetectLabels → Bedrock product ID
//           → DynamoDB lookup → SnapResult

export const handler: APIGatewayProxyHandler = async (event): Promise<APIGatewayProxyResult> => {
  const requestId = event.requestContext.requestId;

  try {
    if (!event.body) return respond(400, { error: 'Missing body' });

    const { image } = JSON.parse(event.body) as SnapRequest;
    if (!image) return respond(400, { error: 'Missing image field' });

    const imageBuffer = Buffer.from(image, 'base64');

    // Step 1: Rekognition label detection
    const rekResult = await rekognition.send(new DetectLabelsCommand({
      Image:   { Bytes: imageBuffer },
      MaxLabels: 20,
      MinConfidence: 60,
    }));

    const rawLabels = (rekResult.Labels ?? [])
      .map((l: Label) => l.Name ?? '')
      .filter(Boolean);

    if (rawLabels.length === 0) {
      const result: SnapResult = { product: null, confidence: 0, rawLabels: [] };
      return respond(200, { data: result, requestId });
    }

    // Step 2: Bedrock label → product query
    const productData = await invokeClaudeJSON<{ productQuery: string; confidence: number }>(
      Prompts.labelsToProduct(rawLabels),
    );

    // Step 3: DynamoDB product lookup
    const products = await scanItems<Product>({
      TableName:        Tables.products,
      FilterExpression: 'contains(#nm, :q) AND inStock = :true',
      ExpressionAttributeNames:  { '#nm': 'name' },
      ExpressionAttributeValues: { ':q': productData.productQuery, ':true': true },
      Limit: 1,
    });

    const product = products[0] ? { ...products[0], confidence: productData.confidence } : null;

    const result: SnapResult = {
      product,
      confidence: productData.confidence,
      rawLabels,
    };

    const response: ApiResponse<SnapResult> = { data: result, requestId };
    return respond(200, response);
  } catch (err) {
    console.error('[snapProcessor] Error:', err);
    return respond(500, { error: 'Snap processing failed' });
  }
};

function respond(statusCode: number, body: unknown): APIGatewayProxyResult {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(body),
  };
}
