import { apiUrl, getAuthHeaders } from '../_http';

export async function cancelBooking(ref: string): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(apiUrl(`/api/flights/cancel/${encodeURIComponent(ref)}`), {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return { success: false, message: (data as any)?.message ?? `HTTP ${res.status}` };
    return { success: true, message: (data as any)?.message };
  } catch (err) {
    console.error('cancelBooking error', err);
    return { success: false, message: 'Erreur réseau' };
  }
}
