"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const crypto_1 = require("crypto");
const dynamo_1 = require("../shared/dynamo");
const context_1 = require("../shared/context");
// ─── Order Placer ─────────────────────────────────────────────────────────────
// Validates the cart, assembles an Order record, writes to DynamoDB,
// and updates the user's order history.
const handler = async (event) => {
    const requestId = event.requestContext.requestId;
    try {
        if (!event.body)
            return respond(400, { error: 'Missing body' });
        const { items } = JSON.parse(event.body);
        if (!items?.length)
            return respond(400, { error: 'Cart is empty' });
        const userId = (0, context_1.getUserId)(event);
        if (!userId)
            return respond(401, { error: 'Unauthorized' });
        const user = await (0, dynamo_1.getItem)(dynamo_1.Tables.users, { id: userId });
        if (!user)
            return respond(404, { error: 'User not found' });
        // Validate all items are in stock
        const oosItem = items.find((i) => !i.product.inStock);
        if (oosItem) {
            return respond(409, { error: `Item out of stock: ${oosItem.product.name}` });
        }
        const orderId = (0, crypto_1.randomUUID)();
        const totalPrice = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
        const etaMin = Math.max(...items.map((i) => i.product.estimatedDeliveryMin));
        const order = {
            id: orderId,
            userId,
            items,
            totalPrice,
            currency: items[0]?.product.currency ?? 'USD',
            address: user.defaultAddress,
            paymentMethodLast4: user.defaultPaymentLast4,
            status: 'confirmed',
            placedAt: new Date().toISOString(),
            etaMin,
        };
        // Write order to DynamoDB
        await (0, dynamo_1.putItem)(dynamo_1.Tables.orders, order);
        // Update user's order history
        await (0, dynamo_1.updateItem)({
            TableName: dynamo_1.Tables.users,
            Key: { id: userId },
            UpdateExpression: 'SET orderHistory = list_append(if_not_exists(orderHistory, :empty), :orderId)',
            ExpressionAttributeValues: { ':orderId': [orderId], ':empty': [] },
        });
        const response = { data: order, requestId };
        return respond(200, response);
    }
    catch (err) {
        console.error('[orderPlacer] Error:', err);
        return respond(500, { error: 'Order placement failed' });
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
