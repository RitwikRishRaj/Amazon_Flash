// Deterministic transcript → product matcher. Runs before Bedrock so voice
// resolves reliably (e.g. "dettol", "juice", "paracetamol") even when the
// model is unavailable. Keys are matched as substrings of the lowercased
// transcript; the FIRST catalog entry with a hit wins (order matters).

interface MatchRule {
    productId: string;
    keywords: string[];
}

const RULES: MatchRule[] = [
    { productId: 'prod-009', keywords: ['dettol', 'antiseptic', 'sanitizer', 'sanitiser', 'handwash', 'hand wash', 'disinfect'] },
    { productId: 'prod-013', keywords: ['lifebuoy', 'life buoy'] },
    { productId: 'prod-012', keywords: ['real juice', 'real orange', 'real fruit'] },
    { productId: 'prod-001', keywords: ['tropicana', 'juice', 'orange'] },
    { productId: 'prod-002', keywords: ['milk', 'amul', 'dairy', 'doodh'] },
    { productId: 'prod-003', keywords: ['chips', "lay's", 'lays', 'crisps', 'wafer'] },
    { productId: 'prod-004', keywords: ['advil', 'ibuprofen'] },
    { productId: 'prod-005', keywords: ['crocin', 'paracetamol', 'fever', 'painkiller', 'pain killer', 'headache'] },
    { productId: 'prod-010', keywords: ['monster'] },
    { productId: 'prod-011', keywords: ['sting'] },
    { productId: 'prod-006', keywords: ['red bull', 'redbull', 'energy drink', 'energy'] },
    { productId: 'prod-007', keywords: ['dove', 'body wash', 'bodywash', 'shower gel', 'soap', 'bath'] },
    { productId: 'prod-008', keywords: ['protein', 'yoga bar', 'protein bar', 'energy bar', 'snack bar'] },
];

/**
 * Resolve a free-text transcript to a catalog product id, or null if nothing matches.
 */
export function matchProductId(transcript: string): string | null {
    const text = transcript.toLowerCase();
    for (const rule of RULES) {
        if (rule.keywords.some((k) => text.includes(k))) {
            return rule.productId;
        }
    }
    return null;
}
