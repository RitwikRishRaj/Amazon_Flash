"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const zlib_1 = require("zlib");
const client_lex_runtime_v2_1 = require("@aws-sdk/client-lex-runtime-v2");
const bedrock_1 = require("../shared/bedrock");
const prompts_1 = require("../shared/prompts");
const dynamo_1 = require("../shared/dynamo");
const context_1 = require("../shared/context");
const lexClient = new client_lex_runtime_v2_1.LexRuntimeV2Client({ region: process.env['AWS_REGION'] ?? 'us-east-1' });
/**
 * Lex V2 RecognizeUtterance returns the transcript / interpretations as
 * gzip-compressed, base64-encoded strings. Decode one back to plain text.
 */
function decodeLexField(value) {
    if (!value)
        return '';
    try {
        return (0, zlib_1.gunzipSync)(Buffer.from(value, 'base64')).toString('utf-8');
    }
    catch {
        return '';
    }
}
/**
 * Strip the RIFF/WAVE header from a PCM WAV file and return the raw `data`
 * chunk payload. Lex's `audio/x-l16` content type expects headerless 16-bit
 * little-endian PCM samples. If the buffer isn't a recognisable WAV, the
 * original buffer is returned unchanged.
 */
function extractPcmFromWav(buffer) {
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
const handler = async (event) => {
    const requestId = event.requestContext.requestId;
    try {
        if (!event.body)
            return respond(400, { error: 'Missing body' });
        const { audio } = JSON.parse(event.body);
        if (!audio)
            return respond(400, { error: 'Missing audio field' });
        // Require an authenticated identity
        const userId = (0, context_1.getUserId)(event);
        if (!userId)
            return respond(401, { error: 'Unauthorized' });
        // Fetch user order history for context
        const user = await (0, dynamo_1.getItem)(dynamo_1.Tables.users, { id: userId });
        const orderHistory = user?.orderHistory ?? [];
        // Step 1: Send audio to Lex for ASR → transcript.
        // The client records 16 kHz mono PCM WAV; strip the RIFF header so Lex
        // receives the raw little-endian 16-bit samples it expects for x-l16.
        const wavBuffer = Buffer.from(audio, 'base64');
        const pcmBuffer = extractPcmFromWav(wavBuffer);
        const lexResponse = await lexClient.send(new client_lex_runtime_v2_1.RecognizeUtteranceCommand({
            botId: process.env['LEX_BOT_ID'],
            botAliasId: process.env['LEX_BOT_ALIAS_ID'],
            localeId: process.env['LEX_LOCALE_ID'] ?? 'en_US',
            sessionId: userId,
            requestContentType: 'audio/x-l16; sample-rate=16000; channel-count=1',
            responseContentType: 'text/plain;charset=utf-8',
            inputStream: pcmBuffer,
        }));
        // inputTranscript is gzip+base64 encoded in the Lex v2 RecognizeUtterance response
        const transcript = decodeLexField(lexResponse.inputTranscript);
        // Step 2: Bedrock intent extraction
        const intentData = await (0, bedrock_1.invokeClaudeJSON)(prompts_1.Prompts.voiceToIntent(transcript, orderHistory));
        // Step 3: Product lookup
        let product = null;
        if (intentData.productId) {
            product = await (0, dynamo_1.getItem)(dynamo_1.Tables.products, { id: intentData.productId });
        }
        const result = {
            transcript,
            intent: intentData.productId ?? 'none',
            product,
            confidence: intentData.confidence,
        };
        const response = { data: result, requestId };
        return respond(200, response);
    }
    catch (err) {
        console.error('[voiceProcessor] Error:', err);
        return respond(500, { error: 'Voice processing failed' });
    }
};
exports.handler = handler;
function respond(statusCode, body) {
    return {
        statusCode,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(body),
    };
}
