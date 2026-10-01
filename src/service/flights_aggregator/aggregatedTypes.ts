// src/service/Flights/aggregatedTypes.ts

export type CabinClass = 'Y' | 'C' | 'F' | 'W';

export interface FlightLeg {
    origin: string;
    destination: string;
    date: string;          // YYYY-MM-DD
}

export interface AggregatedSearchParams {
    origin: string;
    destination: string;
    date: string;          // YYYY-MM-DD
    returnDate?: string;   // reserved, not all providers support round trip yet
    adults: number;
    children: number;
    infants: number;
    cabinClass?: string;   // 'Y' | 'C' | 'F' | 'S' — reserved, not all providers wired yet
    legs?: FlightLeg[];    // multi-city path — when present, overrides origin/destination/date
}


export interface NormalizedSegment {
    paxSegmentRefId: string;
    marketingSegmentId: string;
    carrierCode: string;
    carrierName: string;
    flightNumber: string;
    departure: { airport: string; stationName?: string; dateTime: string };
    arrival: { airport: string; stationName?: string; dateTime: string };
}

export interface Amenity {
    segmentId: string | null;
    amenityType: string;
    isChargeable: boolean;
    description: string | null;
    amenitySeat: {
        legSpace?: number;
        spaceUnit?: string;
        tilt?: string;
    } | null;
}

export interface NormalizedOffer {
    provider: string;
    offerId: string;
    offerItemId: string;
    price: number;
    currency: string;
    baseFare: number | null;
    tax: number | null;
    expirationDateTime?: string;
    segments: NormalizedSegment[];
    cabin: { code: string | null; name: string | null; brand: string | null; fareBasisCode: string | null };
    baggage: {
        chargeableFirstBagPrice: null;
        checked: string | null; cabin: string | null };
    refundable: boolean | null;
    cancellationFee: { amount: number | null; currency: string | null } | null;
    changeFee: { amount: number | null; currency: string | null } | null;
    seatsRemaining: number | null;
    legs?: {
        baggage?: { checked: string | null };
        originDestId: string; segments: NormalizedSegment[] }[];
    instantTicketingRequired?: boolean;
    validatingCarrierCode?: string | null;
    amenities?: Amenity[];
    fees?: { amount: number; type: string }[];
    fareType?: string | null;
    includedCheckedBagsOnly?: boolean | null;
    fareSourceCode: string | null;
}

export interface PassengerInput {
    paxType: string;
    passengerTitle: string;
    firstName: string;
    lastName: string;
    birthday: string;
    sexe: string;
    nationality?: string;
    typeDoc?: string;
    passportNumber: string;
    expiryDate: string;
    mail?: string;
    tel?: string;
}

export interface BookFlightResult {
    bookingRef: string;
    orderId: string;
    status: string;
    dbId: string;
}

export interface OrderReserveResult {
    orderId: string;
    status: string;
    paymentTimeLimit: string | null;
    priceGuaranteeTimeLimit: string | null;
    flightQuoteRequired: boolean;
}

