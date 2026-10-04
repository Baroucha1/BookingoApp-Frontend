// src/service/admin/exchangeRate.service.ts
const API = import.meta.env.VITE_API_URL;

function authHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle<T>(res: Response): Promise<T> {
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message ?? 'Une erreur est survenue');
    return (data.data ?? data) as T;
}

export interface ExchangeRateDTO {
    id: string;
    fromCurrency: string;
    toCurrency: string;
    rate: string; // Decimal comes over the wire as a string
    createdAt: string;
    updatedAt: string;
}

export interface ExchangeRateHistoryPoint {
    id: string;
    rate: string;
    recordedAt: string;
}

export async function listExchangeRates(): Promise<ExchangeRateDTO[]> {
    const res = await fetch(`${API}/api/admin/exchange-rates`, { headers: authHeaders() });
    return handle<ExchangeRateDTO[]>(res);
}

export async function createExchangeRate(input: { fromCurrency: string; toCurrency: string; rate: string }): Promise<ExchangeRateDTO> {
    const res = await fetch(`${API}/api/admin/exchange-rates`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
    });
    return handle<ExchangeRateDTO>(res);
}

export async function updateExchangeRate(id: string, rate: string): Promise<ExchangeRateDTO> {
    const res = await fetch(`${API}/api/admin/exchange-rates/${id}`, {
        method: 'PATCH',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ rate }),
    });
    return handle<ExchangeRateDTO>(res);
}

export async function deleteExchangeRate(id: string): Promise<void> {
    const res = await fetch(`${API}/api/admin/exchange-rates/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message ?? 'Échec de la suppression');
    }
}

export async function getExchangeRateHistory(id: string, days?: number): Promise<ExchangeRateHistoryPoint[]> {
    const qs = days ? `?days=${days}` : '';
    const res = await fetch(`${API}/api/admin/exchange-rates/${id}/history${qs}`, { headers: authHeaders() });
    return handle<ExchangeRateHistoryPoint[]>(res);
}