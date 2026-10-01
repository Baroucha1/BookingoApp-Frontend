// src/service/admin/hotel/hotelSearch.service.ts
const API = import.meta.env.VITE_API_URL;

function authHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
}

async function handle<T>(res: Response): Promise<T> {
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message ?? 'Une erreur est survenue');
    return data.data as T;
}

// ─── Search ───────────────────────────────────────────────────────────────

export interface SearchRoomInput {
    numAdults: number;
    childAges?: number[];
}

export interface SearchHotelsInput {
    cityIds?: number[];
    hotelIds?: number[];
    checkInDate: string;
    checkOutDate: string;
    rooms: SearchRoomInput[];
    nationality: string;
    currency?: string;
    availableOnly?: boolean;
}

export interface SearchOptionRoom {
    roomId: string;
    roomName: string;
    numAdults: number;
    numChildren: number;
    price: number;
}

export interface SearchOption {
    provider: string;
    optionId: string;
    onRequest: boolean;
    boardType: string;
    totalPrice: number;
    currency: string;
    rooms: SearchOptionRoom[];
}

export interface SearchHotelResult {
    provider: string;
    hotelId: string;
    hotelName: string;
    starRating: number | null;
    options: SearchOption[];
}

export interface SearchError {
    provider: string;
    code: string;
    message: string;
}

export interface SearchResponse {
    hotels: SearchHotelResult[];
    errors: SearchError[];
}

export async function searchHotels(input: SearchHotelsInput): Promise<SearchResponse> {
    const res = await fetch(`${API}/api/admin/hotels/search`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
    });
    return handle<SearchResponse>(res);
}

// ─── Policies ─────────────────────────────────────────────────────────────

export interface CancellationPolicyLine {
    from: string;
    type: 'Amount' | 'Nights' | 'Percentage';
    value: number;
}

export interface HotelPolicies {
    price: number;
    policies: {
        currency: string;
        cancellationDeadline: string;
        policies: CancellationPolicyLine[];
        restrictions: string[];
        alerts: string[];
    };
}

export async function getHotelPolicies(provider: string, optionId: string): Promise<HotelPolicies> {
    const res = await fetch(`${API}/api/admin/hotels/policies/${provider}/${encodeURIComponent(optionId)}`, {
        headers: authHeaders(),
    });
    return handle<HotelPolicies>(res);
}