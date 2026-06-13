import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  QueryCommand,
  ScanCommand,
  type GetCommandInput,
  type PutCommandInput,
  type UpdateCommandInput,
  type QueryCommandInput,
  type ScanCommandInput,
} from '@aws-sdk/lib-dynamodb';

const raw = new DynamoDBClient({ region: process.env['AWS_REGION'] ?? 'us-east-1' });

export const dynamo = DynamoDBDocumentClient.from(raw, {
  marshallOptions:   { removeUndefinedValues: true },
  unmarshallOptions: { wrapNumbers: false },
});

// Table name helpers — read from environment
export const Tables = {
  products: process.env['PRODUCTS_TABLE'] ?? 'flashcart-products-dev',
  users:    process.env['USERS_TABLE']    ?? 'flashcart-users-dev',
  orders:   process.env['ORDERS_TABLE']   ?? 'flashcart-orders-dev',
} as const;

// ─── Typed wrappers ───────────────────────────────────────────────────────────

export async function getItem<T>(
  table: string,
  key: Record<string, unknown>,
): Promise<T | null> {
  const input: GetCommandInput = { TableName: table, Key: key };
  const res = await dynamo.send(new GetCommand(input));
  return (res.Item as T | undefined) ?? null;
}

export async function putItem(
  table: string,
  item: Record<string, unknown>,
): Promise<void> {
  const input: PutCommandInput = { TableName: table, Item: item };
  await dynamo.send(new PutCommand(input));
}

export async function updateItem(
  input: UpdateCommandInput,
): Promise<void> {
  await dynamo.send(new UpdateCommand(input));
}

export async function queryItems<T>(
  input: QueryCommandInput,
): Promise<T[]> {
  const res = await dynamo.send(new QueryCommand(input));
  return (res.Items as T[] | undefined) ?? [];
}

export async function scanItems<T>(
  input: ScanCommandInput,
): Promise<T[]> {
  const res = await dynamo.send(new ScanCommand(input));
  return (res.Items as T[] | undefined) ?? [];
}
