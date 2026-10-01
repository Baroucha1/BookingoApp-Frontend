import { apiUrl } from '../_http';
import type { AggregatedSearchParams, NormalizedOffer } from './aggregatedTypes';

export interface AggregatedDestination {
    code: string;
    origins: string[];
    providers: string[];
}

export interface AggregatedDestinationsResponse {
    destinations: AggregatedDestination[];
}

export async function getAggregatedDestinations(): Promise<AggregatedDestination[]> {
    const res = await fetch(apiUrl('/api/Flights/destinations'), {
        method: 'GET',
    });

    if (!res.ok) {
        const err = await res.text();
        console.error('Aggregated destinations fetch error:', res.status, err);
        throw new Error(`Destinations fetch failed: ${res.status}`);
    }

    const data: AggregatedDestinationsResponse = await res.json();
    return Array.isArray(data.destinations) ? data.destinations : [];
}

export async function searchFlightsAggregated(
    params: AggregatedSearchParams
): Promise<NormalizedOffer[]> {
    const res = await fetch(apiUrl('/api/Flights/search'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
    });

    if (!res.ok) {
        const err = await res.text();
        console.error('Aggregated flight search error:', res.status, err);
        throw new Error(`Search failed: ${res.status}`);
    }

    const data = await res.json();
    return Array.isArray(data) ? (data as NormalizedOffer[]) : [];
}

export async function repriceFlight(fareSourceCode: string): Promise<NormalizedOffer> {
    const res = await fetch(apiUrl('/api/Flights/reprice'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fareSourceCode }),
    });

    if (!res.ok) {
        const err = await res.text();
        console.error('Reprice error:', res.status, err);
        throw new Error(`Reprice failed: ${res.status}`);
    }

    return res.json();
}

export interface NearbyDatePrice {
    date: string;      // "YYYY-MM-DD"
    price: number;
    currency: string;
}

export async function getNearbyDates(params: {
    origin: string;
    destination: string;
    date: string;
    dateWindowDays?: number;
    adults?: number;
    children?: number;
    infants?: number;
    cabinClass?: string;
}): Promise<NearbyDatePrice[]> {
    const query = new URLSearchParams({
        origin: params.origin,
        destination: params.destination,
        date: params.date,
        ...(params.dateWindowDays !== undefined && { dateWindowDays: String(params.dateWindowDays) }),
        adults: String(params.adults ?? 1),
        children: String(params.children ?? 0),
        infants: String(params.infants ?? 0),
        cabinClass: params.cabinClass ?? 'Y',
    });

    const res = await fetch(apiUrl(`/api/Flights/nearby-dates?${query.toString()}`), {
        method: 'GET',
    });

    if (!res.ok) {
        const err = await res.text();
        console.error('Nearby dates fetch error:', res.status, err);
        throw new Error(`Nearby dates fetch failed: ${res.status}`);
    }

    const data = await res.json();
    return Array.isArray(data) ? (data as NearbyDatePrice[]) : [];
}