import { createContext, useContext, useMemo, useState, useCallback, ReactNode } from 'react';
import type { SearchParams, SelectedFlight, FlightResult } from '../service/flights/types.ts';
import {DisplayOffer} from "@/service/flights_aggregator/aggregatedNormalize.ts";

export interface PassengerFormData {
    paxType: 'ADT' | 'CHD' | 'INF';
    passengerTitle: 'MR' | 'MS' | 'MRS' | '';
    firstName: string;
    lastName: string;
    sexe: 'M' | 'F' | '';
    birthday: string;
    passportNumber: string;
    typeDoc: 'P' | 'N' | 'R' | '';
    expiryDate: string;
    nationality: string;
    mail?: string;
    tel?: string;
}


export type BookingStatus = 'IDLE' | 'BOOKED' | 'PAID' | 'TICKETED' | 'CANCELLED';

interface FlightContextValue {
    searchParams: SearchParams | null;
    setSearchParams: (p: SearchParams | null) => void;
    searchResults: FlightResult[];
    setSearchResults: (r: FlightResult[]) => void;
    selectedFlight: SelectedFlight | null;
    setSelectedFlight: (f: SelectedFlight | null) => void;
    uniqueId: string | null;
    setUniqueId: (v: string | null) => void;
    numPnr: string | null;
    setNumPnr: (v: string | null) => void;
    passengers: PassengerFormData[];
    setPassengers: (p: PassengerFormData[]) => void;
    bookingStatus: BookingStatus;
    setBookingStatus: (s: BookingStatus) => void;
    contact: { email: string; phoneNumber: string; indPaysTel: string };
    setContact: (c: { email: string; phoneNumber: string; indPaysTel: string }) => void;
    repricedTotal: number | null;
    setRepricedTotal: (n: number | null) => void;
}

const FlightContext = createContext<FlightContextValue | undefined>(undefined);

export function FlightProvider({ children }: { children: ReactNode }) {
    const [searchParams, setSearchParams] = useState<SearchParams | null>(null);
    const [searchResults, setSearchResults] = useState<FlightResult[]>([]);
    const [selectedFlight, setSelectedFlight] = useState<SelectedFlight | null>(null);
    const [uniqueId, setUniqueIdState] = useState<string | null>(() =>
        typeof window !== 'undefined' ? localStorage.getItem('flight_uniqueId') : null,
    );
    const [numPnr, setNumPnrState] = useState<string | null>(() =>
        typeof window !== 'undefined' ? localStorage.getItem('flight_numPnr') : null,
    );
    const [passengers, setPassengers] = useState<PassengerFormData[]>([]);
    const [bookingStatus, setBookingStatus] = useState<BookingStatus>('IDLE');
    const [contact, setContact] = useState({ email: '', phoneNumber: '', indPaysTel: '+213' });
    const [repricedTotal, setRepricedTotal] = useState<number | null>(null);

    const setUniqueId = useCallback((v: string | null) => {
        setUniqueIdState(v);
        if (typeof window !== 'undefined') {
            if (v) localStorage.setItem('flight_uniqueId', v);
            else localStorage.removeItem('flight_uniqueId');
        }
    }, []);
    const setNumPnr = useCallback((v: string | null) => {
        setNumPnrState(v);
        if (typeof window !== 'undefined') {
            if (v) localStorage.setItem('flight_numPnr', v);
            else localStorage.removeItem('flight_numPnr');
        }
    }, []);

    const value = useMemo(
        () => ({
            searchParams, setSearchParams,
            searchResults, setSearchResults,
            selectedFlight, setSelectedFlight,
            uniqueId, setUniqueId,
            numPnr, setNumPnr,
            passengers, setPassengers,
            bookingStatus, setBookingStatus,
            contact, setContact,
            repricedTotal, setRepricedTotal,
        }),
        [searchParams, searchResults, selectedFlight, uniqueId, numPnr, passengers, bookingStatus, contact, repricedTotal],
    );

    return <FlightContext.Provider value={value}>{children}</FlightContext.Provider>;
}

export function useFlightContext() {
    const ctx = useContext(FlightContext);
    if (!ctx) throw new Error('useFlightContext must be used within FlightProvider');
    return ctx;
}

// src/context/FlightContext.tsx
const ALGERIAN_AIRPORTS = ['ALG', 'ORN', 'CZL', 'AAE', 'BJA', 'TLM', 'GHA', 'TMR', /* extend as needed — keep in sync with the backend list */];

/**
 * True only when EVERY leg is independently domestic (that leg's own
 * origin AND destination are both Algerian). A round trip ALG→CDG→ALG
 * must NOT be flagged domestic just because both endpoints are Algerian —
 * each leg is checked on its own terms.
 */
export function isDomesticAlgeria(offer: DisplayOffer): boolean {
    if (!offer.legs?.length) return false;

    return offer.legs.every((leg) => {
        const origin = leg.originAirport;
        const destination = leg.destinationAirport;
        return !!origin && !!destination
            && ALGERIAN_AIRPORTS.includes(origin)
            && ALGERIAN_AIRPORTS.includes(destination);
    });
}
