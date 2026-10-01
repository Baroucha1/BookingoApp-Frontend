import { apiUrl, getAuthHeaders } from '../_http';
import {BookFlightResult, OrderReserveResult, PassengerInput} from "@/service/flights_aggregator/aggregatedTypes.ts";

export async function bookFlight(
    fareSourceCode: string,
    passengers: PassengerInput[],
    totalPrice: number,
    paymentMethod?: 'agence' | 'delivery',
    officeId?: string,
    deliveryDetails?: { address: string; wilaya: string; city: string; phone: string },
): Promise<BookFlightResult> {
    const res = await fetch(apiUrl('/api/Flights/book'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ fareSourceCode, passengers, totalPrice, paymentMethod, officeId, deliveryDetails }),
    });

    if (!res.ok) {
        let message = `Booking failed: ${res.status}`;
        try {
            const data = await res.json();
            if (data?.message) message = data.message;
        } catch {
            try {
                const text = await res.text();
                if (text) message = text;
            } catch { }
        }
        console.error('Booking error:', res.status, message);
        if (res.status === 401) {
            message = "Connexion requise ou session expirée. Veuillez vous connecter pour finaliser la réservation.";
        }
        const error = new Error(message) as any;
        error.status = res.status;
        throw error;
    }

    const raw = await res.json();
    const payload = (raw?.data && typeof raw.data === 'object')
        ? raw.data
        : (raw?.booking && typeof raw.booking === 'object')
        ? raw.booking
        : raw;

    const dbId = String(
        payload?.dbId ||
        payload?.id ||
        payload?._id ||
        payload?.bookingId ||
        payload?.flightBookingId ||
        raw?.dbId ||
        raw?.id ||
        raw?._id ||
        raw?.bookingId ||
        raw?.flightBookingId ||
        ''
    );

    const bookingRef = String(
        payload?.bookingRef ||
        payload?.ref ||
        payload?.pnr ||
        raw?.bookingRef ||
        raw?.ref ||
        raw?.pnr ||
        ''
    );

    const orderId = String(
        payload?.orderId ||
        raw?.orderId ||
        ''
    );

    const status = String(
        payload?.status ||
        raw?.status ||
        'BOOKED'
    );

    return {
        ...raw,
        ...payload,
        dbId,
        id: dbId,
        bookingId: dbId,
        bookingRef,
        orderId,
        status,
        data: payload,
    };
}

// in Tk Case we  use reserve in cash cases since we have 15 min after order create to reserve the order

export async function orderReserve(bookingId: string): Promise<OrderReserveResult> {
    const res = await fetch(apiUrl(`/api/Flights/order-reserve/${bookingId}`), {
        method: 'POST',
        headers: getAuthHeaders(),
    });

    if (!res.ok) {
        let message = `Order reserve failed: ${res.status}`;
        try {
            const data = await res.json();
            if (data?.message) message = data.message;
            else if (data?.error) message = data.error;
        } catch {
            try {
                const text = await res.text();
                if (text) message = text;
            } catch { }
        }
        console.error('Order reserve error:', res.status, message);
        const error = new Error(message) as any;
        error.status = res.status;
        throw error;
    }

    const raw = await res.json();
    const payload = (raw?.data && typeof raw.data === 'object') ? raw.data : raw;
    return {
        ...raw,
        ...payload,
    };
}