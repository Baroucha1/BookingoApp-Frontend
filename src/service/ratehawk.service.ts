import { apiUrl, getAuthHeaders } from './_http';

// ── Toggle unique — passer à true pour retourner aux données factices ───────
const USE_MOCK_DATA = false;

export interface RateHawkGuestRoom {
    adults: number;
    children: number[]; // ages
}

export interface RateHawkRoomGuests {
    adults: number;
    childrenAges: number[];
}

/**
 * Optional live-search filter, passed straight through to ETG's
 * Search by region/hotel IDs/geo coordinates `filter` field.
 * Values come from GET /api/ratehawk/filter-values (star_rating, kind) —
 * meal_type values aren't in filter-values (docs say they come from
 * Retrieve hotel static data instead), so a small hardcoded list is used
 * in the UI for that one.
 */
export interface RateHawkFilterPayload {
    star_rating?: number[];
    kind?: string[];
    meal_type?: string[];
}

export interface RateHawkSearchParams {
    regionId: number;
    regionName: string;
    checkin: string;
    checkout: string;
    rooms: RateHawkGuestRoom[];
    residency: string;
    filter?: RateHawkFilterPayload;
}

export interface RateHawkHotelResult {
    id: string;
    name: string;
    starRating: number;
    address: string;
    image: string;
    lowestPrice: number;
    currency: string;
    boardType: string;
}

export interface RateHawkRate {
    bookHash: string;
    roomName: string;
    boardType: string;
    price: number;
    currency: string;
    refundable: boolean;
    cancellationDeadline: string | null;
}

export interface RateHawkHotelpageResult {
    id: string;
    name: string;
    address: string;
    images: string[];
    rates: RateHawkRate[];
}

export interface RateHawkPrebookResult {
    bookHash: string;
    priceChanged: boolean;
    newPrice?: number;
    currency: string;
}

export interface RateHawkBookingPayload {
    hotelId: string;
    bookHash: string;
    orderId: string;
    rooms: {
        adults: number;
        children: number[];
        adultsDetails: { firstName: string; lastName: string; title?: string }[];
        childrenDetails?: { firstName: string; lastName: string }[];
    }[];
    checkin: string;
    checkout: string;
    boardType: string;
    totalPrice: number;
    currency: string;
    payment: { type: string };
}

export interface RateHawkBookingResult {
    status: 'confirmed' | 'failed';
    bookingId: string;
    partnerOrderId?: string;
    reason?: string;
}

export interface DestinationSuggestion {
    regionId: number;
    name: string;
    country: string;
}

/**
 * Full static hotel content (name, images, amenities, descriptions, etc.),
 * synced/cached via the Content API. See getHotelsContent below.
 */
export interface RateHawkHotelContent {
    id: string;
    name: string;
    starRating: number | null;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    images: string[];
    amenities: any;
    rawContent: any;
}

/**
 * Response shape of GET /api/ratehawk/filter-values — used only to LABEL
 * filter UI controls (e.g. list of star ratings / hotel "kind" values that
 * exist), never called per search. See Content API Best Practices.
 */
export interface RateHawkFilterValues {
    star_rating: number[];
    kind: string[];
    serp_filter: { value: string; desc: string }[];
    country: { value: string; desc: string }[];
    language: { value: string; desc: string }[];
}

// ── Mock fixtures (kept for local dev / demos without hitting the API) ──────

const MOCK_HOTELS: RateHawkHotelResult[] = [
    {
        id: 'mock_hotel_paris_1',
        name: 'Hôtel Le Marais Boutique',
        starRating: 4,
        address: '12 Rue des Archives, 75003 Paris',
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600',
        lowestPrice: 145,
        currency: 'USD',
        boardType: 'Room Only',
    },
    {
        id: 'mock_hotel_paris_2',
        name: 'Grand Hôtel Opéra',
        starRating: 5,
        address: '5 Boulevard des Capucines, 75002 Paris',
        image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600',
        lowestPrice: 289,
        currency: 'USD',
        boardType: 'Breakfast Included',
    },
    {
        id: 'mock_hotel_paris_3',
        name: 'Residence Montmartre',
        starRating: 3,
        address: '18 Rue Lepic, 75018 Paris',
        image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=600',
        lowestPrice: 98,
        currency: 'USD',
        boardType: 'Room Only',
    },
];

const MOCK_DESTINATIONS: DestinationSuggestion[] = [
    { regionId: 2734, name: 'Paris', country: 'France' },
    { regionId: 965843211, name: 'Londres', country: 'Royaume-Uni' },
    { regionId: 3928, name: 'Dubaï', country: 'Émirats arabes unis' },
    { regionId: 4821, name: 'Istanbul', country: 'Turquie' },
    { regionId: 1122, name: 'Rome', country: 'Italie' },
    { regionId: 5567, name: 'Barcelone', country: 'Espagne' },
];

const MOCK_FILTER_VALUES: RateHawkFilterValues = {
    star_rating: [0, 1, 2, 3, 4, 5],
    kind: ['Hotel', 'Apartment', 'Hostel', 'Resort', 'Guesthouse'],
    serp_filter: [
        { value: 'has_breakfast', desc: 'Breakfast included' },
        { value: 'has_internet', desc: 'Free Internet' },
        { value: 'has_pool', desc: 'Swimming Pool' },
    ],
    country: [{ value: '59', desc: 'France' }],
    language: [{ value: 'en', desc: 'English' }],
};

function mockHotelpage(hotelId: string): RateHawkHotelpageResult {
    const base = MOCK_HOTELS.find((h) => h.id === hotelId) || MOCK_HOTELS[0];
    return {
        id: base.id,
        name: base.name,
        address: base.address,
        images: [base.image, base.image, base.image],
        rates: [
            {
                bookHash: `mock_hash_${base.id}_std`,
                roomName: 'Standard Double Room',
                boardType: 'Room Only',
                price: base.lowestPrice,
                currency: base.currency,
                refundable: true,
                cancellationDeadline: '2026-07-28',
            },
            {
                bookHash: `mock_hash_${base.id}_deluxe`,
                roomName: 'Deluxe Room with Balcony',
                boardType: 'Breakfast Included',
                price: base.lowestPrice + 65,
                currency: base.currency,
                refundable: false,
                cancellationDeadline: null,
            },
        ],
    };
}

function delay<T>(value: T, ms = 500): Promise<T> {
    return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

// ── Real API calls (aligned with the project's shared _http helper) ─────────

async function apiPost<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(apiUrl(`/api/ratehawk${path}`), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || json.error || 'RateHawk API error');
    return json;
}

async function apiGet<T>(path: string): Promise<T> {
    const res = await fetch(apiUrl(`/api/ratehawk${path}`), {
        headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || json.error || 'RateHawk API error');
    return json;
}

// ── Public service functions ──────────────────────────────────────────────

export async function searchHotels(params: RateHawkSearchParams): Promise<RateHawkHotelResult[]> {
    if (USE_MOCK_DATA) return delay(MOCK_HOTELS);

    const data = await apiPost<any>('/search', {
        type: 'region',
        regionId: params.regionId,
        checkin: params.checkin,
        checkout: params.checkout,
        guests: params.rooms.map((r) => ({ adults: r.adults, children: r.children })),
        residency: params.residency,
        ...(params.filter ? { filter: params.filter } : {}),
    });

    return (data.hotels || []).map((h: any) => ({
        id: h.id,
        name: h.name || h.id,
        starRating: h.star_rating || 0,
        address: h.address || '',
        image: h.images?.[0]?.url || h.images?.[0] || '',
        lowestPrice: Number(h.rates?.[0]?.payment_options?.payment_types?.[0]?.show_amount) || 0,
        currency: h.rates?.[0]?.payment_options?.payment_types?.[0]?.show_currency_code || 'USD',
        boardType: h.rates?.[0]?.meal_data?.value || 'nomeal',
    }));
}

/**
 * Search by known hotel IDs (hids) — used e.g. for the certified sandbox test
 * hotel (Conrad Los Angeles, hid 10004834), where full search→book→cancel is
 * documented and verified to work end-to-end.
 */
export async function searchHotelsByIds(
    hids: number[],
    params: Omit<RateHawkSearchParams, 'regionId' | 'regionName'>
): Promise<RateHawkHotelResult[]> {
    if (USE_MOCK_DATA) return delay(MOCK_HOTELS);

    const data = await apiPost<any>('/search', {
        type: 'hotelIds',
        hids,
        checkin: params.checkin,
        checkout: params.checkout,
        guests: params.rooms.map((r) => ({ adults: r.adults, children: r.children })),
        residency: params.residency,
        ...(params.filter ? { filter: params.filter } : {}),
    });

    return (data.hotels || []).map((h: any) => ({
        id: h.id,
        name: h.name || h.id,
        starRating: h.star_rating || 0,
        address: h.address || '',
        image: h.images?.[0]?.url || h.images?.[0] || '',
        lowestPrice: Number(h.rates?.[0]?.payment_options?.payment_types?.[0]?.show_amount) || 0,
        currency: h.rates?.[0]?.payment_options?.payment_types?.[0]?.show_currency_code || 'USD',
        boardType: h.rates?.[0]?.meal_data?.value || 'nomeal',
    }));
}

export async function getHotelpage(
    hotelId: string,
    params: Omit<RateHawkSearchParams, 'regionId' | 'regionName'>
): Promise<RateHawkHotelpageResult> {
    if (USE_MOCK_DATA) return delay(mockHotelpage(hotelId));

    const data = await apiPost<any>('/hotelpage', {
        hotelId,
        checkin: params.checkin,
        checkout: params.checkout,
        guests: params.rooms.map((r) => ({ adults: r.adults, children: r.children })),
        residency: params.residency,
    });

    const hotel = data.hotels?.[0] || data;

    return {
        id: hotel.id,
        name: hotel.name || hotel.id,
        address: hotel.address || '',
        images: hotel.images?.map((i: any) => i.url || i) || [],
        rates: (hotel.rates || []).map((r: any) => ({
            bookHash: r.book_hash,
            roomName: r.room_name || 'Standard Room',
            boardType: r.meal_data?.value || 'nomeal',
            price: Number(r.payment_options?.payment_types?.[0]?.show_amount) || 0,
            currency: r.payment_options?.payment_types?.[0]?.show_currency_code || 'USD',
            refundable: !r.payment_options?.payment_types?.[0]?.is_need_credit_card_data,
            cancellationDeadline:
                r.payment_options?.payment_types?.[0]?.cancellation_penalties?.free_cancellation_before || null,
        })),
    };
}

/**
 * Prebook rate from hotelpage step.
 * ⚠️ priceIncreasePercent defaults to 15 — see prior notes: ETG's sandbox
 * has hotels specifically designed to trigger a price bump at this step
 * (e.g. Rosa Bell Motel +10%, Adagio Paris Montmartre +20%). Sending 0
 * (accept no increase) caused rate_not_found on those. Any accepted
 * increase is surfaced to the user via the priceChanged flag + amber banner.
 */
export async function prebook(bookHash: string, priceIncreasePercent = 15): Promise<RateHawkPrebookResult> {
    if (USE_MOCK_DATA) {
        return delay({ bookHash, priceChanged: false, currency: 'USD' });
    }

    const data = await apiPost<any>('/prebook', { bookHash, priceIncreasePercent });

    return {
        bookHash: data.bookHash,
        priceChanged: data.priceChanged,
        newPrice: Number(data.raw?.hotels?.[0]?.rates?.[0]?.payment_options?.payment_types?.[0]?.show_amount) || undefined,
        currency: data.raw?.hotels?.[0]?.rates?.[0]?.payment_options?.payment_types?.[0]?.show_currency_code || 'USD',
    };
}

export async function bookHotel(payload: RateHawkBookingPayload): Promise<RateHawkBookingResult> {
    if (USE_MOCK_DATA) {
        return delay(
            { status: 'confirmed', bookingId: `mock_booking_${Date.now()}`, partnerOrderId: payload.orderId },
            1200
        );
    }

    return apiPost<RateHawkBookingResult>('/book', payload);
}

export async function getBookingStatus(partnerOrderId: string) {
    if (USE_MOCK_DATA) {
        return delay({ partnerOrderId, status: 'CONFIRMED', hcn: 'MOCK-HCN-123456' });
    }
    return apiGet(`/booking/${partnerOrderId}`);
}

export async function cancelHotelBooking(partnerOrderId: string) {
    if (USE_MOCK_DATA) {
        return delay({ status: 'cancelled' });
    }
    return apiPost(`/booking/${partnerOrderId}/cancel`, {});
}

export async function searchDestinations(query: string): Promise<DestinationSuggestion[]> {
    if (USE_MOCK_DATA) {
        const q = query.trim().toLowerCase();
        if (!q) return delay([], 100);
        return delay(MOCK_DESTINATIONS.filter((d) => d.name.toLowerCase().includes(q)), 200);
    }

    const data = await apiGet<any>(`/suggest?query=${encodeURIComponent(query)}`);
    return (data.regions || []).map((r: any) => ({
        regionId: r.id,
        name: r.name,
        country: r.country_name,
    }));
}

/**
 * Searches ETG regions (imported from the "Retrieve regions' dump" endpoint,
 * synced into our DB — see ratehawk.regions.js). Distinct from
 * searchDestinations() above, which hits the live ETG "Suggest hotel and
 * region" (multicomplete) endpoint directly and is limited in sandbox
 * (regions always null there). This one reads our own regions table, so it
 * works reliably in both sandbox (4 seeded regions) and production (full
 * regions catalog) once the weekly sync job has run.
 */
export async function searchRegions(query: string): Promise<DestinationSuggestion[]> {
    if (USE_MOCK_DATA) {
        const q = query.trim().toLowerCase();
        if (!q) return delay([], 100);
        return delay(MOCK_DESTINATIONS.filter((d) => d.name.toLowerCase().includes(q)), 200);
    }

    const data = await apiGet<any>(`/regions?query=${encodeURIComponent(query)}`);
    return (data.regions || []).map((r: any) => ({
        regionId: r.regionId,
        name: r.name,
        country: r.country,
    }));
}

/**
 * Fetches full static hotel content (name, images, amenities, description, etc.)
 * for a batch of hotel IDs, via our backend's cached /content endpoint.
 * Returns a map keyed by hotel id for easy lookup/merge with search results.
 */
export async function getHotelsContent(ids: string[]): Promise<Record<string, RateHawkHotelContent>> {
    if (USE_MOCK_DATA || ids.length === 0) return {};

    const data = await apiPost<any>('/content', { ids });

    const map: Record<string, RateHawkHotelContent> = {};
    for (const h of data.hotels || []) {
        map[h.id] = {
            id: h.id,
            name: h.name,
            starRating: h.starRating,
            address: h.address,
            latitude: h.latitude,
            longitude: h.longitude,
            images: h.images || [],
            amenities: h.amenities,
            rawContent: h.rawContent,
        };
    }
    return map;
}

/**
 * Fetches the enumerable filter options (star_rating, kind, serp_filter,
 * country, language) used only to LABEL filter controls in the UI. Cached
 * server-side for 24h — safe to call once per page load, never per search.
 */
export async function getFilterValues(): Promise<RateHawkFilterValues> {
    if (USE_MOCK_DATA) return delay(MOCK_FILTER_VALUES);
    return apiGet<RateHawkFilterValues>('/filter-values');
}