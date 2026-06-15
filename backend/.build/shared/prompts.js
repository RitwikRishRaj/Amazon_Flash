"use strict";
// All Bedrock prompts live here — never inline in function handlers.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Prompts = void 0;
// Single source of truth for the catalog shown to the model. Keep the IDs in
// sync with seed/products.json — the IDs are the join key for DynamoDB lookups.
const CATALOG = `
- ID: "prod-001" | Name: "Tropicana Orange Juice, 1 L" (brand: "Tropicana", category: "beverages")
- ID: "prod-002" | Name: "Amul Taaza Toned Milk, 1 L" (brand: "Amul", category: "dairy")
- ID: "prod-003" | Name: "Lay's Classic Salted Potato Chips, 90 g" (brand: "Lay's", category: "snacks")
- ID: "prod-004" | Name: "Advil Ibuprofen 200mg, 100 Tablets" (brand: "Advil", category: "health")
- ID: "prod-005" | Name: "Crocin Advance 500mg, 20 Tablets" (brand: "Crocin", category: "health")
- ID: "prod-006" | Name: "Red Bull Energy Drink, 4 x 250 ml" (brand: "Red Bull", category: "beverages")
- ID: "prod-007" | Name: "Dove Deeply Nourishing Body Wash, 800 ml" (brand: "Dove", category: "personal-care")
- ID: "prod-008" | Name: "Yoga Bar Chocolate Protein Bars, 12-pack" (brand: "Yoga Bar", category: "snacks")`.trim();
exports.Prompts = {
    /**
     * Given a voice transcript and shopping context, extract:
     * - matched product ID from the catalog
     * - quantity (default 1)
     * - urgency signal
     */
    voiceToIntent: (transcript, orderHistory) => `
You are FlashCart's intent extraction engine for Amazon Now (India).

User voice transcript: "${transcript}"

Recent order history (for context):
${orderHistory.slice(0, 5).join(', ') || 'None'}

Available product catalog:
${CATALOG}

Match the user's voice transcript to the most relevant product in the catalog. If the user refers to an item that corresponds to one of the catalog products (even if they specify it in a generic way, like "juice", "milk", "chips", "painkiller", "paracetamol", "energy drink", "body wash", "protein bar", etc.), select that product's ID.

Respond ONLY with valid JSON matching this schema:
{
  "productId": string | null, // the matched product ID from the catalog, or null if no catalog item matches
  "quantity": number,         // default 1
  "urgent": boolean,          // true if user indicates urgency (e.g. "now", "immediately", "hurry")
  "confidence": number        // 0.0–1.0, how confident you are
}
`.trim(),
    /**
     * Given Rekognition labels from a product scan, identify the product.
     */
    labelsToProduct: (labels) => `
You are FlashCart's product identification engine.

Amazon Rekognition detected these labels from a product image:
${labels.join(', ')}

Available product catalog:
${CATALOG}

Identify which product from the catalog most likely matches the image labels.

Respond ONLY with valid JSON:
{
  "productId": string | null,  // the matched product ID from the catalog, or null if no match is relevant
  "confidence": number         // 0.0–1.0
}
`.trim(),
    /**
     * Generate personalized product predictions for a user.
     */
    predictCart: (userId, orderHistory, timeOfDay) => `
You are FlashCart's predictive engine for Amazon Now urgent delivery (India).

User ID: ${userId}
Time of day: ${timeOfDay}
Recent purchases: ${orderHistory.slice(0, 10).join(', ') || 'None'}

Available product catalog:
${CATALOG}

Predict the top 5 product IDs this user is most likely to need RIGHT NOW for urgent delivery.
Consider the time of day (e.g. morning → breakfast items like juice/milk, evening/night → snacks/energy drink/body wash, or health items if they recently purchased them).
Respond ONLY with a JSON array of product IDs from the catalog:
["prod-001", "prod-002", "prod-003", "prod-006", "prod-008"]
`.trim(),
    /**
     * Suggest the best AI substitute for an out-of-stock item.
     */
    substitute: (originalName, originalBrand, availableAlternatives) => `
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
};
