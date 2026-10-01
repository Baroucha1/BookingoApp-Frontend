import { getAirlineName } from './airlines';

export interface NormalizedFlight {
  raw: any;
  fareSourceCode: string;
  airlineCode: string;
  airlineName: string;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  departureCode: string;
  arrivalCode: string;
  departureAirport: string;
  arrivalAirport: string;
  totalTime: string;
  nbStop: string;
  isDirect: boolean;
  baggage: string;
  hasCheckedBaggage: boolean;
  cabin: string;
  priceAmount: number;
  currency: string;
  refundable: boolean;
  seat: number;
  soldeBlock: string;
  fareType: string;
  baseFare: number;
  tax: number;
  totalFare: number;

  // --- Aller-retour (Option A) ---
  isRoundTrip: boolean;
  returnDepartureTime?: string;
  returnArrivalTime?: string;
  returnDepartureCode?: string;
  returnArrivalCode?: string;
  returnTotalTime?: string;
  returnNbStop?: string;
  returnIsDirect?: boolean;
  returnFlightNumber?: string;
  returnAirlineCode?: string;
  returnAirlineName?: string;
}

function num(v: any): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return parseFloat(v) || 0;
  return 0;
}

function extractTime(iso: string | undefined): string {
  if (!iso) return '--:--';
  const match = /T(\d{2}:\d{2})/.exec(iso);
  if (match) return match[1];
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '--:--';
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function isoDurationToDisplay(iso: string | undefined): string {
  if (!iso) return '—';
  const h = /(\d+)H/i.exec(iso)?.[1];
  const m = /(\d+)M/i.exec(iso)?.[1];
  const parts: string[] = [];
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  return parts.length ? parts.join(' ') : '—';
}

function stopsLabel(count: number): string {
  if (count === 0) return 'Direct';
  if (count === 1) return '1 escale';
  return `${count} escales`;
}

// Extrait les infos d'un seul itinéraire (aller OU retour)
function extractLegInfo(itinerary: any) {
  const segments = itinerary?.segments ?? [];
  const firstSegment = segments[0] ?? {};
  const lastSegment = segments[segments.length - 1] ?? {};
  const stopCount = Math.max(segments.length - 1, 0);

  return {
    airlineCode: firstSegment.carrierCode || '',
    flightNumber: firstSegment.flightNumber || '',
    departureTime: extractTime(firstSegment?.departure?.at),
    arrivalTime: extractTime(lastSegment?.arrival?.at),
    departureCode: firstSegment?.departure?.airport || '',
    arrivalCode: lastSegment?.arrival?.airport || '',
    totalTime: isoDurationToDisplay(itinerary?.duration),
    nbStop: stopsLabel(stopCount),
    isDirect: stopCount === 0,
  };
}

export function normalizeFlight(f: any): NormalizedFlight {
  const itineraries = f?.itineraries ?? [];
  const outbound = itineraries[0] ?? {};
  const returnLeg = itineraries[1]; // undefined si one-way

  const outboundInfo = extractLegInfo(outbound);
  const isRoundTrip = itineraries.length > 1;
  const returnInfo = isRoundTrip ? extractLegInfo(returnLeg) : null;

  const priceAmount = num(f?.price?.total);
  const currency = f?.price?.currency || 'EUR';

  const travelerPricing = f?.travelerPricings?.[0] ?? {};
  const baseFare = num(travelerPricing?.price?.base ?? f?.price?.base);
  const totalFare = num(travelerPricing?.price?.total ?? f?.price?.total) || priceAmount;
  const tax = Math.max(totalFare - baseFare, 0);

  const baggageQty = f?.baggage?.included;
  const baggage = baggageQty != null ? `${baggageQty} PC` : '';
  const hasCheckedBaggage = baggageQty != null && baggageQty > 0;

  const refundRule = f?.fareRules?.rules?.find((r: any) => r.category === 'REFUND');
  const refundable = refundRule ? !refundRule.notApplicable : false;

  return {
    raw: f,
    fareSourceCode: f?.fareSourceCode || '',
    airlineCode: outboundInfo.airlineCode,
    airlineName: getAirlineName(outboundInfo.airlineCode),
    flightNumber: outboundInfo.flightNumber,
    departureTime: outboundInfo.departureTime,
    arrivalTime: outboundInfo.arrivalTime,
    departureCode: outboundInfo.departureCode,
    arrivalCode: outboundInfo.arrivalCode,
    departureAirport: outboundInfo.departureCode,
    arrivalAirport: outboundInfo.arrivalCode,
    totalTime: outboundInfo.totalTime,
    nbStop: outboundInfo.nbStop,
    isDirect: outboundInfo.isDirect,
    baggage,
    hasCheckedBaggage,
    cabin: f?.cabin || '',
    priceAmount,
    currency,
    refundable,
    seat: f?.numberOfBookableSeats ?? 0,
    soldeBlock: 'vert',
    fareType: 'GDS',
    baseFare,
    tax,
    totalFare,

    // --- Aller-retour ---
    isRoundTrip,
    ...(returnInfo && {
      returnDepartureTime: returnInfo.departureTime,
      returnArrivalTime: returnInfo.arrivalTime,
      returnDepartureCode: returnInfo.departureCode,
      returnArrivalCode: returnInfo.arrivalCode,
      returnTotalTime: returnInfo.totalTime,
      returnNbStop: returnInfo.nbStop,
      returnIsDirect: returnInfo.isDirect,
      returnFlightNumber: returnInfo.flightNumber,
      returnAirlineCode: returnInfo.airlineCode,
      returnAirlineName: getAirlineName(returnInfo.airlineCode),
    }),
  };
}

export function formatPrice(amount: number, currency = 'DZD'): string {
  return `${Math.round(amount).toLocaleString('fr-FR').replace(/,/g, ' ').replace(/\u202F/g, ' ')} ${currency}`;
}

export type TimeBlock = 'morning_early' | 'morning' | 'afternoon' | 'evening';

export function getTimeBlock(time: string): TimeBlock | null {
  const [h] = time.split(':').map((x) => parseInt(x, 10));
  if (isNaN(h)) return null;
  if (h < 8) return 'morning_early';
  if (h < 12) return 'morning';
  if (h < 16) return 'afternoon';
  return 'evening';
}

export function durationToMinutes(d: string): number {
  if (!d) return 0;
  const h = /(\d+)\s*H/i.exec(d)?.[1];
  const m = /(\d+)\s*M/i.exec(d)?.[1];
  return (parseInt(h || '0', 10) * 60) + parseInt(m || '0', 10);
}