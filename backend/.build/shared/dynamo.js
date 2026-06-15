"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tables = exports.dynamo = void 0;
exports.getItem = getItem;
exports.putItem = putItem;
exports.updateItem = updateItem;
exports.queryItems = queryItems;
exports.scanItems = scanItems;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const raw = new client_dynamodb_1.DynamoDBClient({ region: process.env['AWS_REGION'] ?? 'us-east-1' });
exports.dynamo = lib_dynamodb_1.DynamoDBDocumentClient.from(raw, {
    marshallOptions: { removeUndefinedValues: true },
    unmarshallOptions: { wrapNumbers: false },
});
// Table name helpers — read from environment
exports.Tables = {
    products: process.env['PRODUCTS_TABLE'] ?? 'flashcart-products-dev',
    users: process.env['USERS_TABLE'] ?? 'flashcart-users-dev',
    orders: process.env['ORDERS_TABLE'] ?? 'flashcart-orders-dev',
};
// ─── Typed wrappers ───────────────────────────────────────────────────────────
async function getItem(table, key) {
    const input = { TableName: table, Key: key };
    const res = await exports.dynamo.send(new lib_dynamodb_1.GetCommand(input));
    return res.Item ?? null;
}
async function putItem(table, item) {
    const input = { TableName: table, Item: item };
    await exports.dynamo.send(new lib_dynamodb_1.PutCommand(input));
}
async function updateItem(input) {
    await exports.dynamo.send(new lib_dynamodb_1.UpdateCommand(input));
}
async function queryItems(input) {
    const res = await exports.dynamo.send(new lib_dynamodb_1.QueryCommand(input));
    return res.Items ?? [];
}
async function scanItems(input) {
    const res = await exports.dynamo.send(new lib_dynamodb_1.ScanCommand(input));
    return res.Items ?? [];
}
