
// ── seatMap.service.ts ──
import { apiUrl, getAuthHeaders } from '../_http';

export async function getSeatMap(segment: any, cabin: string, classCode: string) {
    const res = await fetch(apiUrl('/api/Flights/seat-map'), {
        method: 'POST',
        headers: { ...getAuthHeaders() },
        body: JSON.stringify({ segment, cabin, classCode }),
    });
    if (!res.ok) return null;
    const text = await res.text();
    console.log('seat-map response text:', text.slice(0, 200));
    return text ? JSON.parse(text) : null;
}
