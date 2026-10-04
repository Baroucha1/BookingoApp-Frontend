// src/service/hotels/hotels.service.ts
import type { TravellandaHotelDetails } from '@/service/admin/hotel/staticdataTravellenda.ts';

const API = import.meta.env.VITE_API_URL;

function authHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
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
    optionId: string; // opaque token — provider baked in server-side, never exposed
    onRequest: boolean;
    boardType: string;
    totalPrice: number;
    currency: string;
    dealName?: string | null;
    discountApplied?: number | null;
    rooms: SearchOptionRoom[];
}

export interface SearchHotelResult {
    hotelId: string;
    hotelName: string;
    starRating: number | null;
    options: SearchOption[];
}

export interface SearchError {
    code: string;
    message: string;
}

export interface SearchResponse {
    hotels: SearchHotelResult[];
    errors: SearchError[];
}

export async function searchHotels(input: SearchHotelsInput): Promise<SearchResponse> {
    const res = await fetch(`${API}/api/hotels/search`, {
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

export async function getHotelPolicies(optionId: string): Promise<HotelPolicies> {
    const res = await fetch(`${API}/api/hotels/policies/${encodeURIComponent(optionId)}`, {
        headers: authHeaders(),
    });
    return handle<HotelPolicies>(res);
}

export async function getHotelDetailsBatch(hotelIds: number[]): Promise<TravellandaHotelDetails[]> {
    if (hotelIds.length === 0) return [];
    const res = await fetch(`${API}/api/hotels/hotels/details?ids=${hotelIds.join(',')}`, {
        headers: authHeaders(),
    });
    return handle<TravellandaHotelDetails[]>(res);
}

// ─── Booking ──────────────────────────────────────────────────────────────

export interface BookingGuestAdult {
    title: 'Mr' | 'Mrs' | 'Miss';
    firstName: string;
    lastName: string;
}

export interface BookingGuestChild {
    firstName: string;
    lastName: string;
}

export interface BookingRoomInput {
    roomId: string;
    adults: BookingGuestAdult[];
    children?: BookingGuestChild[];
}

export interface BookingContact {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
}

export interface BookHotelInput {
    optionId: string; // opaque token — no provider field sent from the client
    rooms: BookingRoomInput[];
    contact: BookingContact;
    hotelId?: number;
    hotelName?: string;
    checkInDate?: string;
    checkOutDate?: string;
    boardType?: string;
    totalPrice?: number;
    currency?: string;
}

export interface BookHotelResult {
    id: string;
    yourReference: string;
    bookingReference: string | null;
    status: string;
    totalPrice: number | null;
    currency: string | null;
}

export interface PendingVerification {
    status: 'pending_verification';
    message: string;
    bookingId: string;
    yourReference: string;
}



// ─── My bookings — requires an authenticated account ───────────────────────

export interface MyHotelBooking {
    id: string;
    yourReference: string;
    bookingReference: string | null;
    status: string;
    hotelName: string | null;
    checkInDate: string | null;
    checkOutDate: string | null;
    totalPrice: number | null;
    currency: string | null;
    createdAt: string;
    // note: no `provider` field — admin-only concern, not shown to the client
}

export async function getMyHotelBookings(): Promise<MyHotelBooking[]> {
    const res = await fetch(`${API}/api/hotels/my-bookings`, {
        headers: authHeaders(),
    });
    return handle<MyHotelBooking[]>(res);
}
// add to src/service/hotels/hotels.public.service.ts

// ─── Payment (SATIM) — pay-first flow, no separate /book endpoint ──────────
// initiateHotelPayment takes the full booking payload directly (no prior
// booking exists yet); confirmHotelPayment takes the resulting bookingToken.

export interface InitiateHotelPaymentInput {
    optionId: string; // opaque token — no provider field sent from the client
    rooms: BookingRoomInput[];
    contact: BookingContact;
    hotelId?: number;
    hotelName?: string;
    checkInDate?: string;
    checkOutDate?: string;
    boardType?: string;
    totalPrice: number;
    currency?: string;
    captchaToken: string;
}

export interface InitiateHotelPaymentResult {
    formUrl: string;
    orderId: string;
    bookingToken: string;
}

export async function initiateHotelPayment(input: InitiateHotelPaymentInput): Promise<InitiateHotelPaymentResult> {
    const res = await fetch(`${API}/api/hotels/satim/initiate-hotel`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.status === 'error') {
        const msg = (typeof data?.message === 'string' && data.message !== 'null' && data.message.trim())
            ? data.message
            : (typeof data?.error === 'string' && data.error !== 'null' && data.error.trim())
            ? data.error
            : (typeof data?.errorMessage === 'string' && data.errorMessage !== 'null' && data.errorMessage.trim())
            ? data.errorMessage
            : "Échec de l'initialisation du paiement";
        throw new Error(msg);
    }
    const payload = (data?.data && typeof data.data === 'object') ? data.data : data;
    const formUrl = payload?.formUrl || data?.formUrl;
    const orderId = payload?.orderId || data?.orderId || '';
    const bookingToken = payload?.bookingToken || data?.bookingToken || '';

    if (!formUrl) {
        throw new Error(data?.message || data?.error || "Lien de redirection bancaire SATIM indisponible");
    }

    return {
        formUrl,
        orderId: String(orderId),
        bookingToken: String(bookingToken),
    };
}

export interface ConfirmHotelPaymentInput {
    bookingToken: string;
    orderId: string;
}

export interface HotelSatimDetails {
    identifiant: string;
    orderNumber: string;
    approvalCode: string;
    respCode_desc: string | null;
    pan: string | null;
    amount: number;
    currency: string;
    paymentMethod: string;
    transactionDate: string;
}

export interface ConfirmedHotelBooking {
    id: string;
    yourReference: string;
    bookingReference: string | null;
    status: string;
    hotelName: string | null;
    checkInDate: string | null;
    checkOutDate: string | null;
    totalPrice: number | null;
    currency: string | null;
    payment: {
        id: string;
        amount: number;
        currency: string;
        status: string;
        paidAt: string | null;
    };
}

export interface ConfirmHotelPaymentResult {
    status: 'success';
    message: string;
    data: ConfirmedHotelBooking;
    satimDetails: HotelSatimDetails;
}

export interface PendingVerification {
    status: 'pending_verification';
    message: string;
    bookingId: string;
}


export async function confirmHotelPayment(
    input: ConfirmHotelPaymentInput,
): Promise<ConfirmHotelPaymentResult | PendingVerification> {
    const res = await fetch(`${API}/api/hotels/satim/confirm-hotel`, {
        method: 'POST',
        // no auth header sent — the route has no auth middleware, and identity
        // was already resolved and baked into bookingToken at initiate time
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
    });
    const data = await res.json();
    if (res.status === 202) return data as PendingVerification;
    if (!res.ok) throw new Error(data?.message ?? 'Échec de la confirmation du paiement');
    return data as ConfirmHotelPaymentResult;
}

// ─── Admin — booking list & cancel (provider-explicit, admin-gated routes) ──

export interface BookingListItem {
    bookingReference: string;
    status: string;
    requestStatus: string | null;
    paymentStatus: string | null;
    bookingTime: string;
    yourReference: string;
    currency: string | null;
    totalPrice: number | null;
    hotelName: string | null;
    city: string | null;
    checkInDate: string | null;
    checkOutDate: string | null;
    leaderName: string;
    bookerEmail: string | null;
    bookerPhone: string | null;
    nationality: string | null;
    cancellationDeadline: string | null;
    rooms: { roomName: string; numAdults: number; numChildren: number }[];
    guests: { roomId: string; title: string | null; firstName: string; lastName: string; isChild: boolean }[];
    restrictions: string[];
    alerts: string[];
    policyLines: { from: string; type: string; value: number }[];
}

export async function listBookings(provider: string, filters: {
    bookingReference?: string; yourReference?: string;
    bookingDateStart?: string; bookingDateEnd?: string;
    checkInDateStart?: string; checkInDateEnd?: string;
} = {}): Promise<BookingListItem[]> {
    const params = new URLSearchParams({ provider, ...filters as Record<string, string> });
    const res = await fetch(`${API}/api/admin/hotels/bookings?${params}`, { headers: authHeaders() });
    return handle<BookingListItem[]>(res);
}

export interface CancelBookingResult {
    bookingReference: string;
    status: string;
    requestStatus: string | null;
}

export async function cancelHotelBooking(provider: string, bookingReference: string): Promise<CancelBookingResult> {
    const res = await fetch(`${API}/api/admin/hotels/book/${provider}/${bookingReference}`, {
        method: 'DELETE',
        headers: authHeaders(),
    });
    return handle<CancelBookingResult>(res);
}

export interface TestBookHotelInput {
    optionId: string;
    rooms: BookingRoomInput[];
    contact: BookingContact;
    hotelId?: number;
    hotelName?: string;
    checkInDate?: string;
    checkOutDate?: string;
    boardType?: string;
    totalPrice?: number;
    currency?: string;
    nationality: string;
    cancellationPolicy?: {
        currency: string;
        cancellationDeadline: string;
        policies: { from: string; type: string; value: number }[];
        restrictions: string[];
        alerts: string[];
    } | null;
}

export interface TestBookHotelResult {
    id: string;
    yourReference: string;
    bookingReference: string | null;
    status: string;
    totalPrice: number | null;
    currency: string | null;

}

export interface PendingVerification {
    status: 'pending_verification';
    message: string;
    bookingId: string;
    yourReference: string;
}

