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
        const err = await res.text();
        console.error('Booking error:', res.status, err);
        throw new Error(`Booking failed: ${res.status}`);
    }

    return res.json();
}

// in Tk Case we  use reserve in cash cases since we have 15 min after order create to reserve the order

export async function orderReserve(bookingId: string): Promise<OrderReserveResult> {
    const res = await fetch(apiUrl(`/api/Flights/order-reserve/${bookingId}`), {
        method: 'POST',
        headers: getAuthHeaders(),
    });

    if (!res.ok) {
        const err = await res.text();
        console.error('Order reserve error:', res.status, err);
        throw new Error(`Order reserve failed: ${res.status}`);
    }

    return res.json();
}