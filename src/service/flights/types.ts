export interface SearchParams {
  typeSearch: 1 | 2 | 3;
  classe: 'Y' | 'C' | 'F' | 'W';
  departVol1: string;
  destinationVol1: string;
  departleVol1: string;
  retourleVol1?: string;
  departVol2?: string; destinationVol2?: string; departleVol2?: string;
  departVol3?: string; destinationVol3?: string; departleVol3?: string;
  departVol4?: string; destinationVol4?: string; departleVol4?: string;
  departVol5?: string; destinationVol5?: string; departleVol5?: string;
  qteADT: number;
  qteCHD: number;
  qteINF: number;
  refundable?: 'O' | 'N';
  preferredAirlines?: string[];
  baggage?: string;
  calender?: boolean;
  typGds: ('G' | 'L')[];
}

export interface SelectedFlight {
  fareSourceCode: string;
  searchParams: SearchParams;
  selectedClass?: string;
}

// --- Format Amadeus (ce que /api/Flights/search renvoie réellement) ---

export interface FlightSegment {
  id: string;
  departure: { airport: string; terminal?: string; at: string };
  arrival: { airport: string; terminal?: string; at: string };
  carrierCode: string;
  flightNumber: string;
  operatingCarrierCode: string;
  aircraft?: string;
  duration: string; // ISO 8601, ex: "PT1H50M"
  numberOfStops: number;
}

export interface FlightItinerary {
  duration: string; // ISO 8601, ex: "PT5H15M"
  segments: FlightSegment[];
}

export interface FareRule {
  category: string;
  maxPenaltyAmount?: string;
  notApplicable?: boolean;
}

export interface TravelerPricing {
  travelerId: string;
  travelerType: string;
  fareOption: string;
  price: { total: string; base: string; currency: string };
}

export interface FlightResult {
  fareSourceCode: string;
  id: string;
  price: { total: string; base: string; currency: string };
  oneWay: boolean;
  instantTicketingRequired: boolean;
  numberOfBookableSeats: number;
  validatingCarrierCodes: string[];
  lastTicketingDate: string;
  isUpsellOffer: boolean;
  itineraries: FlightItinerary[];
  cabin?: string;
  brandedFare?: string;
  brandedFareLabel?: string;
  baggage?: { included: number };
  fareRules?: { rules: FareRule[] };
  travelerPricings: TravelerPricing[];
  sessionRef: string;
}

export interface WorldsoftBalance {
  success: boolean;
  error: string;
  currentSolde: number;
  mntSoldeTiers: number[];
}