import type { NormalizedOffer, NormalizedSegment } from './aggregatedTypes';
import { AIRLINE_NAMES } from '@/service/flights/airlines';

export interface Amenity {
    segmentId: string | null;
    amenityType: string;              // "WIFI" | "POWER" | "MEAL" | "ENTERTAINMENT" | "SEAT" | "BEVERAGE"
    isChargeable: boolean;
    description: string | null;
    amenitySeat: {
        legSpace?: number;
        spaceUnit?: string;
        tilt?: string;
    } | null;
}

export interface DisplayLeg {
    originDestId: string;
    originAirport: string;
    destinationAirport: string;
    departureTime: string;
    departureDate: string;
    arrivalTime: string;
    arrivalDate: string;
    durationLabel: string;
    isDirect: boolean;
    stopsLabel: string;
    checkedBaggage: string | null;
    cabinBaggage: string | null;
    segments: NormalizedSegment[];
}

export interface BagOption {
    optionId: string;
    quantity: number;
    weight: number | null;
    weightUnit: string | null;
    price: number;
    currency: string | null;
    bookableByItinerary: boolean;
    segmentIds: string[];
    travelerIds: string[];
}

export interface DisplayOffer {
    raw: NormalizedOffer;
    offerId: string;
    price: number;
    currency: string;
    provider: string;
    isDirect: boolean;
    stopsLabel: string;
    originAirport: string;
    destinationAirport: string;
    departureTime: string;
    departureDate: string;
    arrivalTime: string;
    arrivalDate: string;
    totalMinutes: number;
    totalDurationLabel: string;
    airlineCode: string;
    airlineName: string;
    baseFare: number | null;
    tax: number | null;
    cabinName: string | null;
    brandName: string | null;
    checkedBaggage: string | null;
    refundable: boolean | null;
    seatsRemaining: number | null;
    legs: DisplayLeg[];
    instantTicketingRequired: boolean;
    validatingCarrierCode: string | null;
    amenities: Amenity[];
    fees: { amount: number; type: string }[];
    fareType: string | null;
    includedCheckedBagsOnly: boolean | null;
    chargeableFirstBagPrice: { amount: number; currency: string } | null; // NEW
    fareSourceCode: string | null;
    bagOptions: BagOption[];
    bagsTotal: number;
    cabinBaggage: string | null;
}

export interface GroupedOffer {
    representative: NormalizedOffer;
    alternates: NormalizedOffer[];
}

function fmtTime(iso: string) {
    if (!iso) return '--:--';
    const match = /T(\d{2}:\d{2})/.exec(iso);
    if (match) return match[1];
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function durationLabel(mins: number) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${String(m).padStart(2, '0')}m`;
}

export function normalizeAggregatedOffer(offer: NormalizedOffer): DisplayOffer {
    const segments = offer.segments;
    const first = segments[0];
    const last = segments[segments.length - 1];
    const isDirect = segments.length === 1;

    const totalMinutes = Math.round(
        (new Date(last.arrival.dateTime).getTime() - new Date(first.departure.dateTime).getTime()) / 60000
    );

    // Build per-leg display data from offer.legs (grouped by originDestId).
    // Falls back to treating the whole offer as a single leg if `legs` is
    // ever missing (e.g. an older/unmigrated offer shape).
    const rawLegs = offer.legs?.length ? offer.legs : [{ originDestId: 'OD1', segments }];

    const legs: DisplayLeg[] = rawLegs
        .map((leg) => {
            const legFirst = leg.segments[0];
            const legLast = leg.segments[leg.segments.length - 1];
            const legMinutes = Math.round(
                (new Date(legLast.arrival.dateTime).getTime() - new Date(legFirst.departure.dateTime).getTime()) / 60000
            );
            const legIsDirect = leg.segments.length === 1;

            return {
                originDestId: leg.originDestId,
                originAirport: legFirst.departure.airport,
                destinationAirport: legLast.arrival.airport,
                departureTime: fmtTime(legFirst.departure.dateTime),
                departureDate: fmtDate(legFirst.departure.dateTime),
                arrivalTime: fmtTime(legLast.arrival.dateTime),
                arrivalDate: fmtDate(legLast.arrival.dateTime),
                durationLabel: durationLabel(legMinutes),
                isDirect: legIsDirect,
                stopsLabel: legIsDirect ? 'Direct' : `${leg.segments.length - 1} escale${leg.segments.length > 2 ? 's' : ''}`,
                segments: leg.segments,
                checkedBaggage: leg.baggage?.checked ?? null,
                cabinBaggage: leg.baggage?.cabin ?? null,
                _sortKey: new Date(legFirst.departure.dateTime).getTime(),
            };
        })
        .sort((a, b) => a._sortKey - b._sortKey)
        .map(({ _sortKey, ...leg }) => leg);

    return {
        raw: offer,
        offerId: offer.offerId,
        price: offer.price,
        currency: offer.currency,
        provider: offer.provider,
        isDirect,
        stopsLabel: isDirect ? 'Direct' : `${segments.length - 1} escale${segments.length > 2 ? 's' : ''}`,
        originAirport: first.departure.airport,
        destinationAirport: last.arrival.airport,
        departureTime: fmtTime(first.departure.dateTime),
        departureDate: fmtDate(first.departure.dateTime),
        arrivalTime: fmtTime(last.arrival.dateTime),
        arrivalDate: fmtDate(last.arrival.dateTime),
        totalMinutes,
        totalDurationLabel: durationLabel(totalMinutes),
        airlineCode: first.carrierCode,
        airlineName: AIRLINE_NAMES[first.carrierCode] ?? first.carrierName ?? first.carrierCode,
        baseFare: offer.baseFare ?? null,
        tax: offer.tax ?? null,
        cabinName: offer.cabin?.name ?? null,
        brandName: offer.cabin?.brand ?? null,
        checkedBaggage: offer.baggage?.checked ?? null,
        refundable: offer.refundable ?? null,
        seatsRemaining: offer.seatsRemaining ?? null,
        instantTicketingRequired: offer.instantTicketingRequired ?? false,
        validatingCarrierCode: offer.validatingCarrierCode ?? null,
        amenities: offer.amenities ?? [],
        fees: offer.fees ?? [],
        fareType: offer.fareType ?? null,
        includedCheckedBagsOnly: offer.includedCheckedBagsOnly ?? null,
        chargeableFirstBagPrice: offer.baggage?.chargeableFirstBagPrice ?? null,
        fareSourceCode: offer.fareSourceCode,
        bagOptions: offer.bagOptions ?? [],
        bagsTotal: offer.bagsTotal ?? 0,
        cabinBaggage: offer.baggage?.cabin ?? null,
        legs,
    };
}

/**
 * Deduplicates offers that represent "the same trip at the same price" but
 * differ only in connection routing (e.g. same origin/destination/price
 * quoted via two slightly different itineraries). Keeps just the fastest
 * one per (origin, destination, price, currency) key, discarding the rest.
 *
 * NOTE: this keys on price, not flight identity — two genuinely different
 * flights that happen to cost the same will collapse into one here. Use
 * groupByFlightIdentity() instead if you need to preserve/compare distinct
 * physical flights (e.g. showing the same TK flight across two providers).
 */
/*export function dedupeByRouteAndPrice(offers: NormalizedOffer[]): NormalizedOffer[] {
    const seen = new Map<string, NormalizedOffer>();

    for (const offer of offers) {
        const first = offer.segments[0];
        const last = offer.segments[offer.segments.length - 1];
        // key: origin-destination-price-currency — collapses all itineraries
        // that are "the same trip at the same price" into one representative offer
        const key = `${first.departure.airport}-${last.arrival.airport}-${offer.price}-${offer.currency}`;

        const existing = seen.get(key);
        if (!existing) {
            seen.set(key, offer);
            continue;
        }

        // keep whichever has the shortest total duration (fastest option first)
        const existingDuration =
            new Date(existing.segments[existing.segments.length - 1].arrival.dateTime).getTime() -
            new Date(existing.segments[0].departure.dateTime).getTime();
        const offerDuration =
            new Date(last.arrival.dateTime).getTime() - new Date(first.departure.dateTime).getTime();

        if (offerDuration < existingDuration) {
            seen.set(key, offer);
        }
    }

    return Array.from(seen.values());
}*/

/**
 * Builds a key that identifies the exact physical flight(s) an offer
 * represents — one "carrier+flightNumber+date" token per segment, joined
 * in order. Two offers only share a key if every segment matches exactly,
 * so a round-trip's outbound+return sequence must match in full.
 *
 * Deliberately ignores price and fare class — this is what lets the same
 * TK flight sold by TK_NDC and by AMADEUS (at different prices/fare rules)
 * end up grouped together for comparison.
 */
function buildFlightIdentityKey(offer: NormalizedOffer): string {
    // one token per leg: "TK-1823-2026-08-03" (carrier-flightNumber-departureDateOnly)
    // joined across all legs, in order, so a round-trip's outbound+return
    // sequence must match exactly to be considered "the same flight(s)"
    return offer.segments
        .map((seg) => {
            const dateOnly = seg.departure.dateTime.slice(0, 10); // "YYYY-MM-DD"
            return `${seg.carrierCode}${seg.flightNumber}-${dateOnly}`;
        })
        .join('|');
}

export interface FlightIdentityGroup {
    key: string;
    offers: NormalizedOffer[];
}

/**
 * Groups offers by real flight identity (see buildFlightIdentityKey), not
 * by price. Each group represents one actual physical itinerary; `offers`
 * holds every fare class/provider combination available for it, sorted
 * cheapest-first. This is the grouping the results page + detail modal
 * use — one card per real flight, with all fares/providers shown inside
 * the modal's fare picker rather than as separate cards.
 */
export function groupByFlightIdentity(offers: NormalizedOffer[]): FlightIdentityGroup[] {
    const groups = new Map<string, NormalizedOffer[]>();

    for (const offer of offers) {
        const key = buildFlightIdentityKey(offer);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(offer);
    }

    return Array.from(groups.entries()).map(([key, groupOffers]) => ({
        key,
        offers: groupOffers.sort((a, b) => a.price - b.price), // cheapest first
    }));
}