import type { AggregatedSearchParams } from '@/service/flights_aggregator/aggregatedTypes';

export function encodeSearchParams(p: AggregatedSearchParams): URLSearchParams {
    const sp = new URLSearchParams();

    if (p.legs && p.legs.length > 0) {
        // Multi-city legs are a variable-length array of objects — JSON is the
        // simplest reliable way to round-trip them through a single query param.
        sp.set('legs', JSON.stringify(p.legs));
    } else {
        if (p.origin) sp.set('origin', p.origin);
        if (p.destination) sp.set('destination', p.destination);
        if (p.date) sp.set('date', p.date);
        if (p.returnDate) sp.set('returnDate', p.returnDate);
    }

    sp.set('adults', String(p.adults ?? 1));
    sp.set('children', String(p.children ?? 0));
    sp.set('infants', String(p.infants ?? 0));
    sp.set('cabinClass', p.cabinClass ?? 'Y');

    return sp;
}

export function decodeSearchParams(sp: URLSearchParams): AggregatedSearchParams | null {
    const adults = Number(sp.get('adults') ?? 1);
    const children = Number(sp.get('children') ?? 0);
    const infants = Number(sp.get('infants') ?? 0);
    const cabinClass = (sp.get('cabinClass') ?? 'Y') as AggregatedSearchParams['cabinClass'];

    const legsRaw = sp.get('legs');
    if (legsRaw) {
        try {
            const legs = JSON.parse(legsRaw);
            return {
                legs,
                origin: legs[0]?.origin,
                destination: legs[legs.length - 1]?.destination,
                date: legs[0]?.date,
                adults, children, infants, cabinClass,
            };
        } catch {
            return null;
        }
    }

    const origin = sp.get('origin');
    const destination = sp.get('destination');
    const date = sp.get('date');
    if (!origin || !destination || !date) return null;

    return {
        origin, destination, date,
        returnDate: sp.get('returnDate') ?? undefined,
        adults, children, infants, cabinClass,
    };
}