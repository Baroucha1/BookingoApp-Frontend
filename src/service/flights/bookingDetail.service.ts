import { apiUrl, getAuthHeaders } from '../_http';

export interface BookingDetail {
  id: string;
  pnr?: string;
  uniqueId?: string;
  status?: string;
  fareSourceCode?: string;
  totalAmount?: number;
  currency?: string;
  createdAt?: string;
  passengers?: any[];
  payment?: any;
  worldsoftRaw?: any;
  canBeVoid?: boolean;
  canBeRefund?: boolean;
  canBeReIssue?: boolean;
  [k: string]: unknown;
}

export async function getBookingDetail(_pnr: string, id: string): Promise<BookingDetail | null> {
  try {
    const res = await fetch(apiUrl(`/api/flights/bookings/${id}`), {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!res.ok) { console.error('bookingDetail failed', res.status); return null; }
    const data = await res.json();
    return data?.data ?? null;
  } catch (err) {
    console.error('bookingDetail error', err);
    return null;
  }
}