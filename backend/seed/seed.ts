import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import products from './products.json';
import users    from './users.json';

// ─── Seed Script ──────────────────────────────────────────────────────────────
// Run with: yarn seed
// Requires AWS credentials and PRODUCTS_TABLE / USERS_TABLE env vars.

const PRODUCTS_TABLE = process.env['PRODUCTS_TABLE'] ?? 'flashcart-products-dev';
const USERS_TABLE    = process.env['USERS_TABLE']    ?? 'flashcart-users-dev';

const raw    = new DynamoDBClient({ region: process.env['AWS_REGION'] ?? 'us-east-1' });
const dynamo = DynamoDBDocumentClient.from(raw);

async function seedTable(tableName: string, items: Record<string, unknown>[]): Promise<void> {
  console.log(`\n📦 Seeding ${items.length} items into ${tableName}…`);
  for (const item of items) {
    await dynamo.send(new PutCommand({ TableName: tableName, Item: item }));
    console.log(`  ✓ ${String(item['id'] ?? item['name'] ?? 'item')}`);
  }
}

async function main(): Promise<void> {
  console.log('🚀 FlashCart seed starting…');

  await seedTable(PRODUCTS_TABLE, products as Record<string, unknown>[]);
  await seedTable(USERS_TABLE,    users    as Record<string, unknown>[]);

  console.log('\n✅ Seed complete!');
}

main().catch((err: unknown) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
