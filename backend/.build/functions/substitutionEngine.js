"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const dynamo_1 = require("../shared/dynamo");
const bedrock_1 = require("../shared/bedrock");
const prompts_1 = require("../shared/prompts");
// ─── Substitution Engine ──────────────────────────────────────────────────────
// When a product is OOS, finds similar alternatives via DynamoDB category query,
// then uses Bedrock to rank and select the best substitute.
const handler = async (event) => {
    const requestId = event.requestContext.requestId;
    try {
        const asin = event.pathParameters?.['asin'];
        if (!asin)
            return respond(400, { error: 'Missing ASIN' });
        // Fetch original product using scanItems by ASIN filter since asin is not the partition key
        const products = await (0, dynamo_1.scanItems)({
            TableName: dynamo_1.Tables.products,
            FilterExpression: 'asin = :asin',
            ExpressionAttributeValues: { ':asin': asin },
            Limit: 1,
        });
        const original = products[0] ?? null;
        if (!original)
            return respond(404, { error: 'Product not found' });
        // Find alternatives in the same category that are in stock
        const alternatives = await (0, dynamo_1.scanItems)({
            TableName: dynamo_1.Tables.products,
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
        // Bedrock: rank alternatives
        const altNames = alternatives.map((a) => `${a.name} by ${a.brand}`);
        const choice = await (0, bedrock_1.invokeClaudeJSON)(prompts_1.Prompts.substitute(original.name, original.brand, altNames));
        const substitute = alternatives[choice.chosenIndex - 1];
        if (!substitute)
            return respond(500, { error: 'Invalid substitute index from AI' });
        const result = {
            original,
            substitute,
            similarityScore: choice.similarityScore,
            reason: choice.reason,
        };
        const response = { data: result, requestId };
        return respond(200, response);
    }
    catch (err) {
        console.error('[substitutionEngine] Error:', err);
        return respond(500, { error: 'Substitution failed' });
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
