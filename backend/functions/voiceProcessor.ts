import type { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import {
  LexRuntimeV2Client,
  RecognizeUtteranceCommand,
} from '@aws-sdk/client-lex-runtime-v2';
import { invokeClaudeJSON }              from '../shared/bedrock';
import { Prompts }                       from '../shared/prompts';
import { getItem, scanItems, Tables }    from '../shared/dynamo';
import type { ApiResponse, VoiceRequest, VoiceResult, Product, User } from '../shared/types';

const lexClient = new LexRuntimeV2Client({ region: process.env['AWS_REGION'] ?? 'us-east-1' });

// ─── Voice Processor ──────────────────────────────────────────────────────────
// Pipeline: base64 audio → Lex (ASR + intent) → Bedrock (product extraction)
//           → DynamoDB product lookup → VoiceResult

export const handler: APIGatewayProxyHandler = async (event): Promise<APIGatewayProxyResult> => {
  const requestId = event.requestContext.requestId;

  try {
    if (!event.body) return respond(400, { error: 'Missing body' });

    const { audio } = JSON.parse(event.body) as VoiceRequest;
    if (!audio) return respond(400, { error: 'Missing audio field' });

    // Extract userId from auth context (JWT sub)
    const userId = event.requestContext.authorizer?.['sub'] as string | undefined ?? 'anonymous';

    // Fetch user order history for context
    const user = await getItem<User>(Tables.users, { id: userId });
    const orderHistory = user?.orderHistory ?? [];

    // Step 1: Send audio to Lex for ASR → transcript
    const audioBuffer = Buffer.from(audio, 'base64');
    const lexResponse = await lexClient.send(new RecognizeUtteranceCommand({
      botId:          process.env['LEX_BOT_ID'],
      botAliasId:     process.env['LEX_BOT_ALIAS_ID'],
      localeId:       process.env['LEX_LOCALE_ID'] ?? 'en_US',
      sessionId:      userId,
      requestContentType: 'audio/x-l16; sample-rate=16000; channel-count=1',
      responseContentType: 'text/plain;charset=utf-8',
      inputStream:    audioBuffer as unknown as Uint8Array,
    }));

    // inputTranscript is URL-encoded in the Lex v2 response header
    const rawTranscript = lexResponse.inputTranscript ?? '';
    const transcript = decodeURIComponent(rawTranscript);

    // Step 2: Bedrock intent extraction
    const intentData = await invokeClaudeJSON<{
      productQuery: string;
      quantity: number;
      urgent: boolean;
      confidence: number;
    }>(Prompts.voiceToIntent(transcript, orderHistory));

    // Step 3: Product lookup (simplified scan — production would use OpenSearch)
    const products = await scanItems<Product>({
      TableName:        Tables.products,
      FilterExpression: 'contains(#nm, :q) AND inStock = :true',
      ExpressionAttributeNames:  { '#nm': 'name' },
      ExpressionAttributeValues: { ':q': intentData.productQuery, ':true': true },
      Limit: 1,
    });

    const product = products[0] ?? null;

    const result: VoiceResult = {
      transcript,
      intent:     intentData.productQuery,
      product,
      confidence: intentData.confidence,
    };

    const response: ApiResponse<VoiceResult> = { data: result, requestId };
    return respond(200, response);
  } catch (err) {
    console.error('[voiceProcessor] Error:', err);
    return respond(500, { error: 'Voice processing failed' });
  }
};

function respond(statusCode: number, body: unknown): APIGatewayProxyResult {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(body),
  };
}
