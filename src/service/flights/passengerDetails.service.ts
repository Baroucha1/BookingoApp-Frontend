import { apiUrl, getAuthHeaders } from '../_http';

export async function getPassengerModel(payload: { fareSourceCode: string; [k: string]: unknown }): Promise<any | null> {
  try {
    const res = await fetch(apiUrl('/api/Flights/passenger-model'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) { console.error('passenger-model failed', res.status); return null; }
    return await res.json();
  } catch (err) {
    console.error('passenger-model error', err);
    return null;
  }
}
