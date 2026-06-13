// All Bedrock prompts live here — never inline in function handlers.

export const Prompts = {
  /**
   * Given a voice transcript and shopping context, extract:
   * - product name / search query
   * - quantity (default 1)
   * - urgency signal
   */
  voiceToIntent: (transcript: string, orderHistory: string[]): string => `
You are FlashCart's intent extraction engine for Amazon Now.

User voice transcript: "${transcript}"

Recent order history (for context):
${orderHistory.slice(0, 5).join(', ') || 'None'}

Extract the shopping intent. Respond ONLY with valid JSON matching this schema:
{
  "productQuery": string,   // the product to search for
  "quantity": number,       // default 1
  "urgent": boolean,        // true if user indicates urgency
  "confidence": number      // 0.0–1.0, how confident you are
}
`.trim(),

  /**
   * Given Rekognition labels from a product scan, identify the product.
   */
  labelsToProduct: (labels: string[]): string => `
You are FlashCart's product identification engine.

Amazon Rekognition detected these labels from a product image:
${labels.join(', ')}

Identify the most likely Amazon product. Respond ONLY with valid JSON:
{
  "productQuery": string,  // best search query for Amazon catalog
  "confidence": number     // 0.0–1.0
}
`.trim(),

  /**
   * Generate personalized product predictions for a user.
   */
  predictCart: (userId: string, orderHistory: string[], timeOfDay: string): string => `
You are FlashCart's predictive engine for Amazon Now urgent delivery.

User ID: ${userId}
Time of day: ${timeOfDay}
Recent purchases: ${orderHistory.slice(0, 10).join(', ') || 'None'}

Predict the top 5 products this user is most likely to need RIGHT NOW for urgent delivery.
Consider the time of day (e.g. morning → breakfast items, evening → dinner).
Respond ONLY with a JSON array of product search queries:
["query1", "query2", "query3", "query4", "query5"]
`.trim(),

  /**
   * Suggest the best AI substitute for an out-of-stock item.
   */
  substitute: (
    originalName: string,
    originalBrand: string,
    availableAlternatives: string[],
  ): string => `
You are FlashCart's AI substitution engine.

Out-of-stock item: "${originalName}" by ${originalBrand}

Available alternatives:
${availableAlternatives.map((a, i) => `${i + 1}. ${a}`).join('\n')}

Choose the best substitute. Explain briefly why. Respond ONLY with valid JSON:
{
  "chosenIndex": number,   // 1-based index from the list
  "similarityScore": number, // 0.0–1.0
  "reason": string         // one sentence explanation
}
`.trim(),
} as const;
