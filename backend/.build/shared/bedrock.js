"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invokeClaude = invokeClaude;
exports.invokeClaudeJSON = invokeClaudeJSON;
const client_bedrock_runtime_1 = require("@aws-sdk/client-bedrock-runtime");
const client = new client_bedrock_runtime_1.BedrockRuntimeClient({ region: process.env['AWS_REGION'] ?? 'us-east-1' });
const MODEL_ID = process.env['BEDROCK_MODEL_ID'] ?? 'anthropic.claude-3-5-sonnet-20240620-v1:0';
/**
 * Invoke Claude via Bedrock and return the text response.
 * Throws on non-200 response or JSON parse failure.
 */
async function invokeClaude(prompt) {
    const body = JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
    });
    const command = new client_bedrock_runtime_1.InvokeModelCommand({
        modelId: MODEL_ID,
        contentType: 'application/json',
        accept: 'application/json',
        body: Buffer.from(body),
    });
    const response = await client.send(command);
    if (!response.body)
        throw new Error('Bedrock returned empty body');
    const parsed = JSON.parse(Buffer.from(response.body).toString('utf-8'));
    const text = parsed.content[0]?.text;
    if (!text)
        throw new Error('Bedrock response missing content text');
    return text;
}
/**
 * Invoke Claude and parse the response as JSON.
 * Extracts the first JSON object or array from the response text.
 */
async function invokeClaudeJSON(prompt) {
    const text = await invokeClaude(prompt);
    // Extract JSON from markdown code fences if present
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]+?)```/) ?? text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    const raw = jsonMatch?.[1] ?? text.trim();
    try {
        return JSON.parse(raw);
    }
    catch {
        throw new Error(`Bedrock response was not valid JSON: ${raw.slice(0, 200)}`);
    }
}
