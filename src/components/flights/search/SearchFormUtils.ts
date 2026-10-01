import type { Airport } from '@/service/flights/airports.ts';
import type { CabinClass } from '@/service/flights_aggregator/aggregatedTypes';

export function toLocalISO(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export const today = toLocalISO(new Date());

export function addMonths(d: Date, n: number) {
    return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

export function buildMonthDays(month: Date) {
    const year = month.getFullYear();
    const m = month.getMonth();
    const firstDay = new Date(year, m, 1).getDay();
    const startOffset = (firstDay + 6) % 7;
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    const days: (Date | null)[] = Array(startOffset).fill(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, m, d));
    return days;
}

export interface Leg {
    origin: string;
    destination: string;
    date: string;
    originAirport?: Airport | null;
    destinationAirport?: Airport | null;
}

export interface FormState {
    tripType: 'oneway' | 'roundtrip' | 'multicity';
    departVol1: string;
    destinationVol1: string;
    departleVol1: string;
    retourleVol1: string;
    legs: Leg[];
    qteADT: number;
    qteCHD: number;
    qteINF: number;
    classe: CabinClass;
    baggage?: string;
    refundable?: 'O' | 'N';
    directOnly?: boolean;
    preferredAirlines?: string[];
}

export const emptyLeg = (): Leg => ({ origin: '', destination: '', date: today });

export const defaultForm: FormState = {
    tripType: 'roundtrip',
    departVol1: '',
    destinationVol1: '',
    departleVol1: today,
    retourleVol1: '',
    legs: [emptyLeg()],
    qteADT: 1,
    qteCHD: 0,
    qteINF: 0,
    classe: 'Y' as CabinClass,
};

export const RECENT_KEY = 'visago_recent_airports';

export function getRecentAirports(): Airport[] {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]'); } catch { return []; }
}

export function saveRecentAirport(a: Airport) {
    const prev = getRecentAirports().filter((r) => r.code !== a.code);
    localStorage.setItem(RECENT_KEY, JSON.stringify([a, ...prev].slice(0, 3)));
}

export type DayState = { isPast: boolean; isStart: boolean; isEnd: boolean; inRange: boolean; isToday: boolean };

export function getDayState(date: Date, start: Date | null, end: Date | null, floor: Date): DayState {
    const iso = toLocalISO;
    const todayFloor = new Date();
    todayFloor.setHours(0, 0, 0, 0);
    return {
        isPast: date < floor,
        isStart: !!(start && iso(date) === iso(start)),
        isEnd: !!(end && iso(date) === iso(end)),
        inRange: !!(start && end && date > start && date < end),
        isToday: iso(date) === iso(todayFloor),
    };
}