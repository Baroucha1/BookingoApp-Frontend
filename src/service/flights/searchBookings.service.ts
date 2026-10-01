import { apiUrl, getAuthHeaders } from '../_http';

export interface BookingListItem {
  id: string;
  pnr?: string;
  uniqueId?: string;
  status?: string;
  origin?: string;
  departureAirport: string;
  arrivalAirport: string;
  destination?: string;
  departureDate?: string;
  totalAmount?: number;
  currency?: string;
  createdAt?: string;
  passengers?: any[];
  payment?: any;
  office?: { id: string; name: string; wilaya: string; subtitle?: string | null } | null;
  [k: string]: unknown;
}

export interface SearchBookingsParams {
  bookingDateFrom?: string;
  bookingDateTo?: string;
  statuses?: string[];
  query?: string;
}

export async function searchBookings(_params: SearchBookingsParams): Promise<BookingListItem[]> {
  try {
    const res = await fetch(apiUrl('/api/flights/getmybookings'), {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!res.ok) { console.error('searchBookings failed', res.status); return []; }
    const data = await res.json();
    return Array.isArray(data?.data) ? data.data : [];
  } catch (err) {
    console.error('searchBookings error', err);
    return [];
  }
}