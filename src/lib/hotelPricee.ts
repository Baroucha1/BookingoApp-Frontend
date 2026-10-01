export type PriceRange = [number, number];

const numberFmt = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const compactFmt = new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 });

export const formatPrice = (n: number, currency = '') =>
    `${numberFmt.format(Math.round(n))} ${currency}`.trim();

export const formatPriceCompact = (n: number) => compactFmt.format(n);

export function percentile(sorted: number[], q: number): number {
    if (sorted.length === 0) return 0;
    const i = Math.min(sorted.length - 1, Math.max(0, Math.floor(q * (sorted.length - 1))));
    return sorted[i];
}

/**
 * Slider bounds. The upper bound is capped at the 98th percentile so a single
 * outlier doesn't flatten the histogram; "max" on the slider means "and above".
 */
export function getPriceBounds(prices: number[]): PriceRange {
    if (prices.length === 0) return [0, 0];
    const sorted = [...prices].sort((a, b) => a - b);
    const low = Math.floor(sorted[0] / 100) * 100;
    const top = sorted.length >= 20 ? percentile(sorted, 0.98) : sorted[sorted.length - 1];
    const high = Math.ceil(top / 100) * 100;
    return [low, Math.max(high, low + 100)];
}

/** ~200 steps across the range, rounded to a "nice" number. */
export function getPriceStep([min, max]: PriceRange): number {
    const span = max - min;
    if (span <= 0) return 1;
    const raw = span / 200;
    const magnitude = 10 ** Math.floor(Math.log10(raw));
    return Math.max(1, Math.ceil(raw / magnitude) * magnitude);
}

/** A range covering the full bounds means "no price filter". */
export function normalizeRange(range: PriceRange, bounds: PriceRange): PriceRange | null {
    return range[0] <= bounds[0] && range[1] >= bounds[1] ? null : range;
}