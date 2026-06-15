"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const products_json_1 = __importDefault(require("./products.json"));
const users_json_1 = __importDefault(require("./users.json"));
// ─── Seed Script ──────────────────────────────────────────────────────────────
// Run with: yarn seed
// Requires AWS credentials and PRODUCTS_TABLE / USERS_TABLE env vars.
const PRODUCTS_TABLE = process.env['PRODUCTS_TABLE'] ?? 'flashcart-products-dev';
const USERS_TABLE = process.env['USERS_TABLE'] ?? 'flashcart-users-dev';
const raw = new client_dynamodb_1.DynamoDBClient({ region: process.env['AWS_REGION'] ?? 'us-east-1' });
const dynamo = lib_dynamodb_1.DynamoDBDocumentClient.from(raw);
async function seedTable(tableName, items) {
    console.log(`\n📦 Seeding ${items.length} items into ${tableName}…`);
    for (const item of items) {
        await dynamo.send(new lib_dynamodb_1.PutCommand({ TableName: tableName, Item: item }));
        console.log(`  ✓ ${String(item['id'] ?? item['name'] ?? 'item')}`);
    }
}
async function main() {
    console.log('🚀 FlashCart seed starting…');
    await seedTable(PRODUCTS_TABLE, products_json_1.default);
    await seedTable(USERS_TABLE, users_json_1.default);
    console.log('\n✅ Seed complete!');
}
main().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});
