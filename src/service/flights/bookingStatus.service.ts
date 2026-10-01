import { apiUrl, getAuthHeaders } from '../_http';

export interface BookingStatusResponse {
  status?: 'PENDING' | 'BOOKED' | 'PAID' | 'TICKETED' | 'CANCELLED' | string;
  uniqueId?: string;
  numPnr?: string;
  ticketNumber?: string;
  airline?: string;
  origin?: string;
  destination?: string;
  date?: string;
  passengers?: string[];
  total?: { amount: number; currencyCode: string };
  [k: string]: unknown;
}

export async function getBookingStatus(uniqueId: string): Promise<BookingStatusResponse | null> {
  try {
    const res = await fetch(apiUrl(`/api/flights/booking-status/${encodeURIComponent(uniqueId)}`), {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!res.ok) { console.error('bookingStatus failed', res.status); return null; }
    return await res.json();
  } catch (err) {
    console.error('bookingStatus error', err);
    return null;
  }
}
