// Currency / locale formatting helpers. Defaults to Indian Rupee.

const CURRENCY_SYMBOLS: Record<string, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
};

export const DEFAULT_CURRENCY = 'INR';

export function currencySymbol(code?: string): string {
    return CURRENCY_SYMBOLS[(code ?? DEFAULT_CURRENCY).toUpperCase()] ?? '₹';
}

/**
 * Format a price with its currency symbol, e.g. formatPrice(199) => "₹199.00".
 * Falls back to INR when no currency is provided.
 */
export function formatPrice(amount: number, code?: string): string {
    return `${currencySymbol(code)}${amount.toFixed(2)}`;
}
