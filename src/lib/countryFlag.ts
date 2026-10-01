// src/lib/countryFlag.ts

export function countryCodeToFlagEmoji(countryCode: string): string {
    if (!countryCode || countryCode.length !== 2) return '🌐';
    const upper = countryCode.toUpperCase();
    const codePoints = upper
        .split('')
        .map((char) => 127397 + char.charCodeAt(0));
    try {
        return String.fromCodePoint(...codePoints);
    } catch {
        return '🌐';
    }
}
