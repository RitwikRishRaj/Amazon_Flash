"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_rekognition_1 = require("@aws-sdk/client-rekognition");
const bedrock_1 = require("../shared/bedrock");
const prompts_1 = require("../shared/prompts");
const dynamo_1 = require("../shared/dynamo");
const context_1 = require("../shared/context");
const rekognition = new client_rekognition_1.RekognitionClient({ region: process.env['AWS_REGION'] ?? 'us-east-1' });
// ─── Snap Processor ───────────────────────────────────────────────────────────
// Pipeline: base64 image → Rekognition DetectLabels → Bedrock product ID
//           → DynamoDB lookup → SnapResult
const handler = async (event) => {
    const requestId = event.requestContext.requestId;
    try {
        if (!event.body)
            return respond(400, { error: 'Missing body' });
        const { image } = JSON.parse(event.body);
        if (!image)
            return respond(400, { error: 'Missing image field' });
        if (!(0, context_1.getUserId)(event))
            return respond(401, { error: 'Unauthorized' });
        const imageBuffer = Buffer.from(image, 'base64');
        // Step 1: Rekognition label detection
        const rekResult = await rekognition.send(new client_rekognition_1.DetectLabelsCommand({
            Image: { Bytes: imageBuffer },
            MaxLabels: 20,
            MinConfidence: 60,
        }));
        const rawLabels = (rekResult.Labels ?? [])
            .map((l) => l.Name ?? '')
            .filter(Boolean);
        if (rawLabels.length === 0) {
            const result = { product: null, confidence: 0, rawLabels: [] };
            return respond(200, { data: result, requestId });
        }
        // Step 2: Bedrock label → product matching
        const productData = await (0, bedrock_1.invokeClaudeJSON)(prompts_1.Prompts.labelsToProduct(rawLabels));
        // Step 3: DynamoDB product lookup
        let product = null;
        if (productData.productId) {
            const rawProduct = await (0, dynamo_1.getItem)(dynamo_1.Tables.products, { id: productData.productId });
            if (rawProduct) {
                product = { ...rawProduct, confidence: productData.confidence };
            }
        }
        const result = {
            product,
            confidence: productData.confidence,
            rawLabels,
        };
        const response = { data: result, requestId };
        return respond(200, response);
    }
    catch (err) {
        console.error('[snapProcessor] Error:', err);
        return respond(500, { error: 'Snap processing failed' });
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
