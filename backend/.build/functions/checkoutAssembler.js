"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const dynamo_1 = require("../shared/dynamo");
const context_1 = require("../shared/context");
const handler = async (event) => {
    const requestId = event.requestContext.requestId;
    try {
        if (!event.body)
            return respond(400, { error: 'Missing body' });
        const { items } = JSON.parse(event.body);
        if (!items?.length)
            return respond(400, { error: 'No items provided' });
        const userId = (0, context_1.getUserId)(event);
        if (!userId)
            return respond(401, { error: 'Unauthorized' });
        const user = await (0, dynamo_1.getItem)(dynamo_1.Tables.users, { id: userId });
        if (!user)
            return respond(404, { error: 'User not found' });
        const estimatedTotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
        const payload = {
            items,
            address: user.defaultAddress,
            paymentMethodLast4: user.defaultPaymentLast4,
            estimatedTotal,
            currency: items[0]?.product.currency ?? 'USD',
        };
        const response = { data: payload, requestId };
        return respond(200, response);
    }
    catch (err) {
        console.error('[checkoutAssembler] Error:', err);
        return respond(500, { error: 'Checkout assembly failed' });
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
