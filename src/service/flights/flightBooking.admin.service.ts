import { apiUrl, getAuthHeaders } from '../_http';

export interface FlightBookingRow {
    // mirrors the shape returned by getAllFlightBookings
    id:               string;
    pnr:              string | null;
    uniqueId:         string | null;
    fareSourceCode:   string;
    totalAmount:      number;
    currency:         string;
    departureAirport: string | null;
    arrivalAirport:   string | null;
    departureDate:    string | null;
    airlineCode:      string | null;
    airlineName:      string | null;
    baggage:          string | null;
    cabinClass:       string | null;
    createdAt:        string;
    clientId:         string | null;
    agencyId:         string | null;
    office: { id: string; name: string; wilaya: string; subtitle: string | null } | null;
    deliveryAddress:  string | null;
    deliveryWilaya:   string | null;
    deliveryCity:     string | null;
    deliveryPhone:    string | null;
    status: 'BOOKED' | 'PAID' | 'TICKETED' | 'CANCELLED' | 'FAILED' | 'VOIDED';
    ticketedAt: string | null;
    ticketNumbers: string[];
    payment: null | {
        id:       string;
        amount:   number;
        currency: string;
        method:   string;
        status:   'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
        paidAt:   string | null;
    };
    passengers: {
        id:             string;
        paxType:        string;
        passengerTitle: string;
        firstName:      string;
        lastName:       string;
        birthday:       string;
        sexe:           string;
        nationality:    string;
        typeDoc:        string;
        passportNumber: string;
        expiryDate:     string;
        mail:           string | null;
        tel:            string | null;
    }[];
    client: null | {
        id:   string;
        user: { email: string; phone: string | null };
    };
    agency: null | {
        id:   string;
        user: { email: string; phone: string | null };
    };
}

export interface AmadeusOrderDetail {
    orderId: string;
    pnr: string | null;
    queuingOfficeId: string | null;
    price: { total: string; base: string; currency: string } | null;
    validatingAirline: string | null;
    itineraries: {
        segments: {
            carrierCode: string;
            flightNumber: string;
            departure: { iataCode: string; at: string };
            arrival: { iataCode: string; at: string };
            duration: string;
            bookingStatus: string;
            aircraft: string | null;
        }[];
    }[];
    travelers: {
        id: string;
        firstName: string;
        lastName: string;
        dateOfBirth: string;
        gender: string;
        document: { number: string; expiryDate: string; nationality: string } | null;
        phone: string | null;
        email: string | null;
    }[];
    fareDetails: {
        segmentId: string;
        cabin: string;
        fareBasis: string;
        class: string;
        includedCheckedBags: { weight?: number; weightUnit?: string; quantity?: number } | null;
    }[];
}

export async function getAdminFlightBookings(): Promise<FlightBookingRow[]> {
    const res = await fetch(apiUrl('/api/flights/flight-bookings'), {
        headers: getAuthHeaders(),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
    return data.data as FlightBookingRow[];
}

export async function updateFlightPaymentStatus(
    id: string,
    status: string,
): Promise<FlightBookingRow['payment']> {
    const res = await fetch(apiUrl(`/api/flights/flight-bookings/${id}/payment-status`), {
        method: 'PATCH',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
    return data.data;
}

export async function issueFlightTicket(id: string): Promise<unknown> {
    const res = await fetch(apiUrl(`/api/flights/finalize-booking/${id}`), {
        method: 'POST',
        headers: getAuthHeaders(),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
    return data;
}

export async function voidOrCancelFlightBooking(bookingId: string): Promise<{ status: string; dbId: string; bookingStatus: string }> {
    const res = await fetch(apiUrl(`/api/flights/flight-bookings/${bookingId}/void`), {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
    return data;
}

export async function markBookingVoided(id: string): Promise<{ status: string; dbId: string }> {
    const res = await fetch(apiUrl(`/api/flights/flight-bookings/${id}/mark-voided`), {
        method: 'PATCH',
        headers: getAuthHeaders(),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
    return data;
}

export async function checkBookingOrderStatus(id: string): Promise<{ exists: boolean; order: AmadeusOrderDetail | null }> {
    const res = await fetch(apiUrl(`/api/flights/flight-bookings/${id}/order-status`), {
        headers: getAuthHeaders(),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
    return data;
}

export async function resendFlightTicket(id: string): Promise<{ status: string; to: string }> {
    const res = await fetch(apiUrl(`/api/flights/flight-bookings/${id}/resend-ticket`), {
        method: 'POST',
        headers: getAuthHeaders(),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
    return data;
}