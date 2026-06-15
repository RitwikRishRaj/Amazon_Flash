"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const bedrock_1 = require("../shared/bedrock");
const prompts_1 = require("../shared/prompts");
const dynamo_1 = require("../shared/dynamo");
const context_1 = require("../shared/context");
// ─── Predict Cart Engine ──────────────────────────────────────────────────────
// Generates personalised product predictions via Bedrock, then resolves each
// predicted query to a real product from DynamoDB.
const handler = async (event) => {
    const requestId = event.requestContext.requestId;
    try {
        const userId = (0, context_1.getUserId)(event);
        if (!userId)
            return respond(401, { error: 'Unauthorized' });
        // Fetch order history
        const user = await (0, dynamo_1.getItem)(dynamo_1.Tables.users, { id: userId });
        const orderHistory = user?.orderHistory ?? [];
        const hour = new Date().getHours();
        const timeOfDay = hour < 12 ? 'morning' :
            hour < 17 ? 'afternoon' :
                hour < 21 ? 'evening' : 'night';
        // Bedrock: generate predicted product IDs
        const productIds = await (0, bedrock_1.invokeClaudeJSON)(prompts_1.Prompts.predictCart(userId, orderHistory, timeOfDay));
        // Resolve IDs to real products
        const productPromises = productIds.slice(0, 5).map(async (id) => {
            return await (0, dynamo_1.getItem)(dynamo_1.Tables.products, { id });
        });
        const resolved = await Promise.all(productPromises);
        const items = resolved.filter((p) => p !== null);
        const result = {
            items,
            generatedAt: new Date().toISOString(),
            fromCache: false,
        };
        const response = { data: result, requestId };
        return respond(200, response);
    }
    catch (err) {
        console.error('[predictCartEngine] Error:', err);
        return respond(500, { error: 'PredictCart failed' });
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
