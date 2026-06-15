"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const handler = async (event) => {
    const requestId = event.requestContext.requestId;
    try {
        const body = event.body ? JSON.parse(event.body) : {};
        const hour = body.hour ?? new Date().getHours();
        const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 20);
        const reasons = [];
        let score = 0;
        if (body.userSignal) {
            score += 1.0;
            reasons.push('User manually enabled urgent mode');
        }
        if (isRushHour) {
            score += 0.5;
            reasons.push('Rush hour detected');
        }
        if (body.deviceSignals?.motion) {
            score += 0.2;
            reasons.push('User is in motion');
        }
        if ((body.deviceSignals?.battery ?? 100) < 20) {
            score += 0.1;
            reasons.push('Low battery — user likely on the go');
        }
        const mode = score >= 0.5 ? 'urgent' : 'normal';
        const result = { mode, confidence: Math.min(score, 1), reasons };
        return respond(200, { data: result, requestId });
    }
    catch (err) {
        console.error('[contextClassifier] Error:', err);
        return respond(500, { error: 'Context classification failed' });
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
