"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const handler = async (event) => {
    const requestId = event.requestContext.requestId;
    try {
        if (!event.body) {
            return respond(400, { error: 'Missing request body' });
        }
        const body = JSON.parse(event.body);
        const routeMap = {
            voice: '/voice/process',
            snap: '/snap/process',
            text: '/predict/cart',
        };
        const route = routeMap[body.type];
        if (!route) {
            return respond(400, { error: `Unknown intent type: ${body.type}` });
        }
        // Return the resolved route for API gateway to forward
        const response = {
            data: { route },
            requestId,
        };
        return respond(200, response);
    }
    catch (err) {
        console.error('[intentRouter] Error:', err);
        return respond(500, { error: 'Internal server error' });
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
