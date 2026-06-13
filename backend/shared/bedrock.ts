import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  type InvokeModelCommandOutput,
} from '@aws-sdk/client-bedrock-runtime';

const client = new BedrockRuntimeClient({ region: process.env['AWS_REGION'] ?? 'us-east-1' });
const MODEL_ID = process.env['BEDROCK_MODEL_ID'] ?? 'anthropic.claude-3-sonnet-20240229-v1:0';

export interface BedrockMessage {
  role:    'user' | 'assistant';
  content: string;
}

/**
 * Invoke Claude via Bedrock and return the text response.
 * Throws on non-200 response or JSON parse failure.
 */
export async function invokeClaude(prompt: string): Promise<string> {
  const body = JSON.stringify({
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens:        1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const command = new InvokeModelCommand({
    modelId:     MODEL_ID,
    contentType: 'application/json',
    accept:      'application/json',
    body:        Buffer.from(body),
  });

  const response: InvokeModelCommandOutput = await client.send(command);

  if (!response.body) throw new Error('Bedrock returned empty body');

  const parsed = JSON.parse(Buffer.from(response.body).toString('utf-8')) as {
    content: Array<{ text: string }>;
  };

  const text = parsed.content[0]?.text;
  if (!text) throw new Error('Bedrock response missing content text');
  return text;
}

/**
 * Invoke Claude and parse the response as JSON.
 * Extracts the first JSON object or array from the response text.
 */
export async function invokeClaudeJSON<T>(prompt: string): Promise<T> {
  const text = await invokeClaude(prompt);

  // Extract JSON from markdown code fences if present
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]+?)```/) ?? text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  const raw = jsonMatch?.[1] ?? text.trim();

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error(`Bedrock response was not valid JSON: ${raw.slice(0, 200)}`);
  }
}
