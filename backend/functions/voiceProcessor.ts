import type { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { gunzipSync } from 'zlib';
import {
  LexRuntimeV2Client,
  RecognizeUtteranceCommand,
} from '@aws-sdk/client-lex-runtime-v2';
import { invokeClaudeJSON } from '../shared/bedrock';
import { Prompts } from '../shared/prompts';
import { getItem, Tables } from '../shared/dynamo';
import { getUserId } from '../shared/context';
import { matchProductId } from '../shared/productMatch';
import type { ApiResponse, VoiceRequest, VoiceResult, Product, User } from '../shared/types';

const lexClient = new LexRuntimeV2Client({ region: process.env['AWS_REGION'] ?? 'us-east-1' });

/**
 * Lex V2 RecognizeUtterance returns the transcript / interpretations as
 * gzip-compressed, base64-encoded strings. Decode one back to plain text.
 */
function decodeLexField(value: string | undefined): string {
  if (!value) return '';
  try {
    return gunzipSync(Buffer.from(value, 'base64')).toString('utf-8');
  } catch {
    return '';
  }
}

/**
 * Strip the RIFF/WAVE header from a PCM WAV file and return the raw `data`
 * chunk payload. Lex's `audio/x-l16` content type expects headerless 16-bit
 * little-endian PCM samples. If the buffer isn't a recognisable WAV, the
 * original buffer is returned unchanged.
 */
function extractPcmFromWav(buffer: Buffer): Buffer {
  if (buffer.length < 12 || buffer.toString('ascii', 0, 4) !== 'RIFF') {
    return buffer;
  }

  // Walk the chunks after the 12-byte RIFF header to find the `data` chunk.
  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.toString('ascii', offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const dataStart = offset + 8;
    if (chunkId === 'data') {
      const end = Math.min(dataStart + chunkSize, buffer.length);
      return buffer.subarray(dataStart, end);
    }
    // Chunks are word-aligned (padded to even length).
    offset = dataStart + chunkSize + (chunkSize % 2);
  }

  return buffer;
}

// ─── Voice Processor ──────────────────────────────────────────────────────────
// Pipeline: base64 audio → Lex (ASR + intent) → Bedrock (product extraction)
//           → DynamoDB product lookup → VoiceResult

export const handler: APIGatewayProxyHandler = async (event): Promise<APIGatewayProxyResult> => {
  const requestId = event.requestContext.requestId;

  try {
    if (!event.body) return respond(400, { error: 'Missing body' });

    const { audio, transcript: providedTranscript } = JSON.parse(event.body) as VoiceRequest;
    if (!audio && !providedTranscript) {
      return respond(400, { error: 'Provide either audio or transcript' });
    }

    const userId = getUserId(event);

    // Fetch user order history for context
    const user = await getItem<User>(Tables.users, { id: userId });
    const orderHistory = user?.orderHistory ?? [];

    // Step 1: Obtain a transcript.
    // Preferred path: the client sends an on-device speech-to-text transcript.
    // Fallback path: base64 PCM WAV audio is transcribed via Amazon Lex (iOS).
    let transcript = (providedTranscript ?? '').trim();
    if (!transcript && audio) {
      const wavBuffer = Buffer.from(audio, 'base64');
      const pcmBuffer = extractPcmFromWav(wavBuffer);
      const lexResponse = await lexClient.send(new RecognizeUtteranceCommand({
        botId: process.env['LEX_BOT_ID'],
        botAliasId: process.env['LEX_BOT_ALIAS_ID'],
        localeId: process.env['LEX_LOCALE_ID'] ?? 'en_US',
        sessionId: userId,
        requestContentType: 'audio/x-l16; sample-rate=16000; channel-count=1',
        responseContentType: 'text/plain;charset=utf-8',
        inputStream: pcmBuffer as unknown as Uint8Array,
      }));
      transcript = decodeLexField(lexResponse.inputTranscript);
    }

    // Step 2: Resolve transcript → product.
    // Primary: deterministic keyword match (reliable, no external dependency).
    // Fallback: Bedrock intent extraction when no keyword hits.
    let productId = matchProductId(transcript);
    let confidence = productId ? 0.95 : 0;

    if (!productId) {
      try {
        const intentData = await invokeClaudeJSON<{
          productId: string | null;
          quantity: number;
          urgent: boolean;
          confidence: number;
        }>(Prompts.voiceToIntent(transcript, orderHistory));
        productId = intentData.productId;
        confidence = intentData.confidence ?? 0.6;
      } catch (bedrockErr) {
        console.warn('[voiceProcessor] Bedrock unavailable for intent match:', bedrockErr);
      }
    }

    // Step 3: Product lookup
    let product: Product | null = null;
    if (productId) {
      product = await getItem<Product>(Tables.products, { id: productId });
    }

    const result: VoiceResult = {
      transcript,
      intent: productId ?? 'none',
      product,
      confidence,
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
