import type { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { getItem, putItem, updateItem, Tables } from '../shared/dynamo';
import { getUserId } from '../shared/context';
import type { ApiResponse, CartItem, Order, User } from '../shared/types';

// ─── Order Placer ─────────────────────────────────────────────────────────────
// Validates the cart, assembles an Order record, writes to DynamoDB,
// and updates the user's order history.

export const handler: APIGatewayProxyHandler = async (event): Promise<APIGatewayProxyResult> => {
  const requestId = event.requestContext.requestId;

  try {
    if (!event.body) return respond(400, { error: 'Missing body' });

    const { items } = JSON.parse(event.body) as { items: CartItem[] };
    if (!items?.length) return respond(400, { error: 'Cart is empty' });

    const userId = getUserId(event);
    if (!userId) return respond(401, { error: 'Unauthorized' });
    const user = await getItem<User>(Tables.users, { id: userId });
    if (!user) return respond(404, { error: 'User not found' });

    // Validate all items are in stock
    const oosItem = items.find((i) => !i.product.inStock);
    if (oosItem) {
      return respond(409, { error: `Item out of stock: ${oosItem.product.name}` });
    }

    const orderId = randomUUID();
    const totalPrice = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
    const etaMin = Math.max(...items.map((i) => i.product.estimatedDeliveryMin));

    const order: Order = {
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
    await putItem(Tables.orders, order as unknown as Record<string, unknown>);

    // Update user's order history
    await updateItem({
      TableName: Tables.users,
      Key: { id: userId },
      UpdateExpression: 'SET orderHistory = list_append(if_not_exists(orderHistory, :empty), :orderId)',
      ExpressionAttributeValues: { ':orderId': [orderId], ':empty': [] },
    });

    const response: ApiResponse<Order> = { data: order, requestId };
    return respond(200, response);
  } catch (err) {
    console.error('[orderPlacer] Error:', err);
    return respond(500, { error: 'Order placement failed' });
  }
};

function respond(statusCode: number, body: unknown): APIGatewayProxyResult {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(body),
  };
}
