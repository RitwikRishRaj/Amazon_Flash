"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPhoneOtp = exports.signInWithPhone = void 0;
const client_cognito_identity_provider_1 = require("@aws-sdk/client-cognito-identity-provider");
const cognito = new client_cognito_identity_provider_1.CognitoIdentityProviderClient({
    region: process.env.COGNITO_REGION || 'us-east-1',
});
const CLIENT_ID = process.env.COGNITO_CLIENT_ID ?? '';
function errorMessage(err) {
    return err instanceof Error ? err.message : 'Unexpected error';
}
const signInWithPhone = async (event) => {
    try {
        const { phoneNumber } = JSON.parse(event.body || '{}');
        if (!phoneNumber) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ success: false, message: 'phoneNumber is required' }),
            };
        }
        const command = new client_cognito_identity_provider_1.InitiateAuthCommand({
            AuthFlow: 'CUSTOM_AUTH',
            ClientId: CLIENT_ID,
            AuthParameters: {
                USERNAME: phoneNumber,
            },
        });
        const result = await cognito.send(command);
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                data: { sessionId: result.Session },
            }),
        };
    }
    catch (err) {
        console.error('Error initiating custom phone auth:', err);
        return {
            statusCode: 400,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ success: false, message: errorMessage(err) }),
        };
    }
};
exports.signInWithPhone = signInWithPhone;
const verifyPhoneOtp = async (event) => {
    try {
        const { phoneNumber, sessionId, code } = JSON.parse(event.body || '{}');
        if (!phoneNumber || !sessionId || !code) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ success: false, message: 'phoneNumber, sessionId, and code are required' }),
            };
        }
        const command = new client_cognito_identity_provider_1.RespondToAuthChallengeCommand({
            ChallengeName: 'CUSTOM_CHALLENGE',
            ClientId: CLIENT_ID,
            Session: sessionId,
            ChallengeResponses: {
                USERNAME: phoneNumber,
                ANSWER: code,
            },
        });
        const result = await cognito.send(command);
        const tokens = result.AuthenticationResult;
        if (!tokens) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ success: false, message: 'Challenge verification failed or incomplete' }),
            };
        }
        // Default mock user profile to map to Zustand store
        const user = {
            id: phoneNumber,
            name: 'Rishu (Phone)',
            email: '',
            defaultAddress: {
                line1: '12, 4th Block, Koramangala',
                city: 'Bengaluru',
                state: 'KA',
                zip: '560034',
                country: 'India',
            },
            defaultPaymentLast4: '8811',
            orderHistory: [],
            urgentModeEnabled: false,
        };
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                data: {
                    token: tokens.IdToken,
                    user,
                },
            }),
        };
    }
    catch (err) {
        console.error('Error verifying custom OTP challenge:', err);
        return {
            statusCode: 400,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ success: false, message: errorMessage(err) }),
        };
    }
};
exports.verifyPhoneOtp = verifyPhoneOtp;
