import type { DisplayOffer, DisplayLeg } from '@/service/flights_aggregator/aggregatedNormalize';

export type SortKey = 'price-asc' | 'price-desc' | 'duration' | 'departure' | 'arrival';
export type StopsValue = 'direct' | 'one' | 'twoPlus';
export type StopsFilterValue = 'all' | StopsValue;
export type TimeBlock = 'morning_early' | 'morning' | 'afternoon' | 'evening';
export type Refundability = 'all' | 'refundable' | 'non_refundable';
export type BaggageFilter = 'all' | 'with' | 'cabin_only';

export interface DirectionalValue<T> {
    outbound: T;
    return: T;
}

export interface Filters {
    sort: SortKey;
    stops: DirectionalValue<StopsFilterValue>;
    departureTimeBlocks: DirectionalValue<TimeBlock[]>;
    arrivalTimeBlocks: DirectionalValue<TimeBlock[]>;
    airlines: string[];
    priceEnabled: boolean;
    minPrice: number;
    maxPrice: number;
    refundability: Refundability;
    baggage: BaggageFilter;
    gds: ('GDS' | 'LOW')[];
}

export function defaultFilters(maxAvailablePrice: number): Filters {
    return {
        sort: 'price-asc',
        stops: { outbound: 'all', return: 'all' },
        departureTimeBlocks: { outbound: [], return: [] },
        arrivalTimeBlocks: { outbound: [], return: [] },
        airlines: [],
        priceEnabled: false,
        minPrice: 1000,
        maxPrice: maxAvailablePrice || 200000,
        refundability: 'all',
        baggage: 'all',
        gds: [],
    };
}

// ---- per-leg classification ----

export function classifyStops(leg: DisplayLeg): StopsValue {
    const n = leg.segments.length;
    if (n === 1) return 'direct';
    if (n === 2) return 'one';
    return 'twoPlus';
}

function hourOf(iso: string): number {
    return new Date(iso).getHours();
}

export function classifyTimeBlock(hour: number): TimeBlock {
    if (hour < 8) return 'morning_early';
    if (hour < 12) return 'morning';
    if (hour < 16) return 'afternoon';
    return 'evening';
}

export function legDepartureBlock(leg: DisplayLeg): TimeBlock {
    return classifyTimeBlock(hourOf(leg.segments[0].departure.dateTime));
}

export function legArrivalBlock(leg: DisplayLeg): TimeBlock {
    const lastSeg = leg.segments[leg.segments.length - 1];
    return classifyTimeBlock(hourOf(lastSeg.arrival.dateTime));
}

// ---- the actual predicate used for filtering ----

export function offerMatchesFilters(offer: DisplayOffer, filters: Filters): boolean {
    const outboundLeg = offer.legs[0];
    const returnLeg = offer.legs[1]; // undefined for one-way

    if (outboundLeg) {
        if (filters.stops.outbound !== 'all' && classifyStops(outboundLeg) !== filters.stops.outbound) return false;
        if (filters.departureTimeBlocks.outbound.length && !filters.departureTimeBlocks.outbound.includes(legDepartureBlock(outboundLeg))) return false;
        if (filters.arrivalTimeBlocks.outbound.length && !filters.arrivalTimeBlocks.outbound.includes(legArrivalBlock(outboundLeg))) return false;
    }

    if (returnLeg) {
        if (filters.stops.return !== 'all' && classifyStops(returnLeg) !== filters.stops.return) return false;
        if (filters.departureTimeBlocks.return.length && !filters.departureTimeBlocks.return.includes(legDepartureBlock(returnLeg))) return false;
        if (filters.arrivalTimeBlocks.return.length && !filters.arrivalTimeBlocks.return.includes(legArrivalBlock(returnLeg))) return false;
    }

    if (filters.airlines.length && !filters.airlines.includes(offer.airlineCode)) return false;
    if (filters.priceEnabled && (offer.price < filters.minPrice || offer.price > filters.maxPrice)) {
        return false;
    }
    if (filters.refundability === 'refundable' && offer.refundable !== true) return false;
    if (filters.refundability === 'non_refundable' && offer.refundable !== false) return false;

    if (filters.baggage !== 'all') {
            const hasBag = !!offer.checkedBaggage;if (filters.baggage === 'with' && !hasBag) return false;
            if (filters.baggage === 'cabin_only' && hasBag) return false;
          }

    return true;
}

export function isStopsActive(f: Filters) {
    return f.stops.outbound !== 'all' || f.stops.return !== 'all';
}
export function isTimingActive(f: Filters) {
    return (
        f.departureTimeBlocks.outbound.length > 0 ||
        f.departureTimeBlocks.return.length > 0 ||
        f.arrivalTimeBlocks.outbound.length > 0 ||
        f.arrivalTimeBlocks.return.length > 0
    );
}
export function isPriceActive(f: Filters) {
    return f.priceEnabled;
}
export function isAirlineActive(f: Filters) {
    return f.airlines.length > 0;
}
export function isRefundabilityActive(f: Filters) {
    return f.refundability !== 'all';
}

export function computePriceHistogram(offers: DisplayOffer[], bucketCount = 11) {
    if (!offers.length) return { buckets: [] as number[], min: 0, max: 0 };
    const prices = offers.map((o) => o.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const buckets = new Array(bucketCount).fill(0);
    for (const p of prices) {
        const idx = Math.min(bucketCount - 1, Math.floor(((p - min) / range) * bucketCount));
        buckets[idx]++;
    }
    return { buckets, min, max };
}

export function isBaggageActive(f: Filters) {
    return f.baggage !== 'all';
}