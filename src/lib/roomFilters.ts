import type { SearchOption } from '@/service/hotels/hotels.service';

export interface RoomOffer {
    key: string;
    roomName: string;      // "Double Room" or "Double Room + Twin Room" for multi-room searches
    board: string;         // raw board type from the supplier
    boardLabel: string;    // French label
    price: number;         // option.totalPrice — what actually gets booked
    currency: string;
    option: SearchOption;
    searchText: string;    // lowercased text used for filtering
}

/**
 * ⚠️ Adjust to your SearchOption type. Travellanda returns a board type per option;
 * replace this with the real field (e.g. `option.boardType`) once you've checked it.
 */
export function getBoardType(option: SearchOption): string {
    const o = option as unknown as Record<string, unknown>;
    const value = o.boardType ?? o.boardTypeName ?? o.board;
    return typeof value === 'string' ? value : '';
}

export function translateBoard(board: string): string {
    const b = board.toLowerCase();
    if (!b) return '';
    if (b.includes('all inclusive')) return 'Tout compris';
    if (b.includes('full board')) return 'Pension complète';
    if (b.includes('half board')) return 'Demi-pension';
    if (b.includes('breakfast')) return 'Petit-déjeuner inclus';
    if (b.includes('room only') || b.includes('no meal')) return 'Sans repas';
    return board;
}

/** One card per (room combination + board type), keeping the cheapest option. */
export function buildRoomOffers(options: SearchOption[]): RoomOffer[] {
    const byKey = new Map<string, RoomOffer>();
    for (const option of options) {
        const roomName = option.rooms.map((r) => r.roomName).join(' + ');
        const board = getBoardType(option);
        const key = `${roomName}|${board}`;
        const existing = byKey.get(key);
        if (!existing || option.totalPrice < existing.price) {
            byKey.set(key, {
                key,
                roomName,
                board,
                boardLabel: translateBoard(board),
                price: option.totalPrice,
                currency: option.currency,
                option,
                searchText: `${roomName} ${board}`.toLowerCase(),
            });
        }
    }
    return [...byKey.values()].sort((a, b) => a.price - b.price);
}

export const ROOM_FILTERS: { id: string; label: string; keywords: string[] }[] = [
    { id: 'breakfast', label: 'Petit-déjeuner inclus', keywords: ['breakfast', 'petit-déjeuner', 'half board', 'full board', 'all inclusive', 'demi-pension', 'pension complète', 'tout compris'] },
    { id: 'halfboard', label: 'Demi-pension', keywords: ['half board', 'demi-pension', 'demi pension'] },
    { id: 'allinclusive', label: 'Tout compris', keywords: ['all inclusive', 'tout compris'] },
    { id: 'seaview', label: 'Vue mer', keywords: ['sea view', 'ocean view', 'seaview', 'vue mer'] },
    { id: 'balcony', label: 'Balcon / terrasse', keywords: ['balcony', 'terrace', 'balcon', 'terrasse'] },
    { id: 'suite', label: 'Suite', keywords: ['suite'] },
    { id: 'double', label: 'Lit double', keywords: ['double', 'king', 'queen'] },
    { id: 'twin', label: 'Lits séparés', keywords: ['twin', 'lits séparés'] },
    { id: 'family', label: 'Familiale', keywords: ['family', 'familiale'] },
];

export function matchesRoomFilter(offer: RoomOffer, filterId: string): boolean {
    const filter = ROOM_FILTERS.find((f) => f.id === filterId);
    return !!filter && filter.keywords.some((kw) => offer.searchText.includes(kw));
}

/** Only filters that match at least one offer, with counts. */
export function getAvailableRoomFilters(offers: RoomOffer[]) {
    return ROOM_FILTERS
        .map((f) => ({ id: f.id, label: f.label, count: offers.filter((o) => matchesRoomFilter(o, f.id)).length }))
        .filter((f) => f.count > 0);
}

const amountFmt = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
export const formatAmount = (n: number, currency = '') => `${amountFmt.format(Math.round(n))} ${currency}`.trim();