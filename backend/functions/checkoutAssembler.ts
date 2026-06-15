import type { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { getItem, Tables } from '../shared/dynamo';
import { getUserId } from '../shared/context';
import type { ApiResponse, CartItem, User } from '../shared/types';

// ─── Checkout Assembler ───────────────────────────────────────────────────────
// Pre-fills checkout with the user's default address and payment method.
// Returns a ready-to-confirm checkout payload.

interface CheckoutRequest {
  items: CartItem[];
}

interface CheckoutPayload {
  items: CartItem[];
  address: User['defaultAddress'];
  paymentMethodLast4: string;
  estimatedTotal: number;
  currency: string;
}

export const handler: APIGatewayProxyHandler = async (event): Promise<APIGatewayProxyResult> => {
  const requestId = event.requestContext.requestId;

  try {
    if (!event.body) return respond(400, { error: 'Missing body' });

    const { items } = JSON.parse(event.body) as CheckoutRequest;
    if (!items?.length) return respond(400, { error: 'No items provided' });

    const userId = getUserId(event);
    if (!userId) return respond(401, { error: 'Unauthorized' });
    const user = await getItem<User>(Tables.users, { id: userId });

    if (!user) return respond(404, { error: 'User not found' });

    const estimatedTotal = items.reduce(
      (sum, i) => sum + i.product.price * i.quantity,
      0,
    );

    const payload: CheckoutPayload = {
      items,
      address: user.defaultAddress,
      paymentMethodLast4: user.defaultPaymentLast4,
      estimatedTotal,
      currency: items[0]?.product.currency ?? 'USD',
    };

    const response: ApiResponse<CheckoutPayload> = { data: payload, requestId };
    return respond(200, response);
  } catch (err) {
    console.error('[checkoutAssembler] Error:', err);
    return respond(500, { error: 'Checkout assembly failed' });
  }
};

function respond(statusCode: number, body: unknown): APIGatewayProxyResult {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(body),
  };
}
