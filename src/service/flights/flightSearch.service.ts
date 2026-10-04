import { apiUrl, getAuthHeaders } from '../_http';
import type { SearchParams, FlightResult } from './types';

const USE_MOCK = false;

export const MOCK_FLIGHT_RESULTS: any[] = [
  {
    fareSourceCode: "MOCK_FSC_001",
    gds: "AMA",
    totalFare: [{ amount: "23976.0", currencyCode: "DZD", decimalPlaces: 2 }],
    originDestinationOptions: [{
      departureAirportLocationCode: "ALG",
      departureAirportLocation: "Houari Boumedienne - Alger",
      departureTime: "07:10",
      departureDate: "08/06/2025",
      arrivalAirportLocationCode: "TUN",
      arrivalAirportLocation: "Carthage Arpt - Tunis",
      arrivalTime: "08:30",
      arrivalDate: "08/06/2025",
      totalTime: "01H 20M",
      airlineCodes: [["AH", "AH4000 B Economy Standard"]],
      nbStop: "Direct",
      seat: "9",
      baggage: "1PC",
      cabin: "Economy Standard"
    }],
    soldeBlock: "vert",
    ptcFareBreakdowns: [{
      passengerFare: {
        baseFare: { amount: "12390.00", currencyCode: "DZD" },
        tax: { amount: "11586.00", currencyCode: "DZD" },
        totalFare: { amount: "23976.00", currencyCode: "DZD" }
      },
      passengerTypeQuantity: { code: "ADT", quantity: 1 }
    }],
    refund: "73", fareType: "GDS", gdsCountry: "DZ"
  },
  {
    fareSourceCode: "MOCK_FSC_002",
    gds: "AMA",
    totalFare: [{ amount: "31500.0", currencyCode: "DZD", decimalPlaces: 2 }],
    originDestinationOptions: [{
      departureAirportLocationCode: "ALG",
      departureAirportLocation: "Houari Boumedienne - Alger",
      departureTime: "11:45",
      departureDate: "08/06/2025",
      arrivalAirportLocationCode: "TUN",
      arrivalAirportLocation: "Carthage Arpt - Tunis",
      arrivalTime: "13:05",
      arrivalDate: "08/06/2025",
      totalTime: "01H 20M",
      airlineCodes: [["AH", "AH4002 Y Economy Standard"]],
      nbStop: "Direct",
      seat: "4",
      baggage: "1PC",
      cabin: "Economy Standard"
    }],
    soldeBlock: "vert",
    ptcFareBreakdowns: [{
      passengerFare: {
        baseFare: { amount: "18000.00", currencyCode: "DZD" },
        tax: { amount: "13500.00", currencyCode: "DZD" },
        totalFare: { amount: "31500.00", currencyCode: "DZD" }
      },
      passengerTypeQuantity: { code: "ADT", quantity: 1 }
    }],
    refund: "70", fareType: "GDS", gdsCountry: "DZ"
  },
  {
    fareSourceCode: "MOCK_FSC_003",
    gds: "LOW",
    totalFare: [{ amount: "18200.0", currencyCode: "DZD", decimalPlaces: 2 }],
    originDestinationOptions: [{
      departureAirportLocationCode: "ALG",
      departureAirportLocation: "Houari Boumedienne - Alger",
      departureTime: "06:00",
      departureDate: "08/06/2025",
      arrivalAirportLocationCode: "TUN",
      arrivalAirportLocation: "Carthage Arpt - Tunis",
      arrivalTime: "07:20",
      arrivalDate: "08/06/2025",
      totalTime: "01H 20M",
      airlineCodes: [["6H", "6H1234 Y Economy"]],
      nbStop: "Direct",
      seat: "12",
      baggage: "Cabine uniquement",
      cabin: "Economy"
    }],
    soldeBlock: "vert",
    ptcFareBreakdowns: [{
      passengerFare: {
        baseFare: { amount: "14000.00", currencyCode: "DZD" },
        tax: { amount: "4200.00", currencyCode: "DZD" },
        totalFare: { amount: "18200.00", currencyCode: "DZD" }
      },
      passengerTypeQuantity: { code: "ADT", quantity: 1 }
    }],
    refund: "70", fareType: "LOW", gdsCountry: "DZ"
  },
  {
    fareSourceCode: "MOCK_FSC_004",
    gds: "AMA",
    totalFare: [{ amount: "67800.0", currencyCode: "DZD", decimalPlaces: 2 }],
    originDestinationOptions: [{
      departureAirportLocationCode: "ALG",
      departureAirportLocation: "Houari Boumedienne - Alger",
      departureTime: "07:10",
      departureDate: "08/06/2025",
      arrivalAirportLocationCode: "TUN",
      arrivalAirportLocation: "Carthage Arpt - Tunis",
      arrivalTime: "08:30",
      arrivalDate: "08/06/2025",
      totalTime: "01H 20M",
      airlineCodes: [["AH", "AH4000 C Business"]],
      nbStop: "Direct",
      seat: "2",
      baggage: "2PC",
      cabin: "Business"
    }],
    soldeBlock: "vert",
    ptcFareBreakdowns: [{
      passengerFare: {
        baseFare: { amount: "52000.00", currencyCode: "DZD" },
        tax: { amount: "15800.00", currencyCode: "DZD" },
        totalFare: { amount: "67800.00", currencyCode: "DZD" }
      },
      passengerTypeQuantity: { code: "ADT", quantity: 1 }
    }],
    refund: "73", fareType: "GDS", gdsCountry: "DZ"
  },
  {
    fareSourceCode: "MOCK_FSC_005",
    gds: "AMA",
    totalFare: [{ amount: "19900.0", currencyCode: "DZD", decimalPlaces: 2 }],
    originDestinationOptions: [{
      departureAirportLocationCode: "ALG",
      departureAirportLocation: "Houari Boumedienne - Alger",
      departureTime: "18:30",
      departureDate: "08/06/2025",
      arrivalAirportLocationCode: "TUN",
      arrivalAirportLocation: "Carthage Arpt - Tunis",
      arrivalTime: "22:15",
      arrivalDate: "08/06/2025",
      totalTime: "03H 45M",
      airlineCodes: [["AH", "AH4010 Y Economy Standard"]],
      nbStop: "1 escale",
      seat: "7",
      baggage: "1PC",
      cabin: "Economy Standard"
    }],
    soldeBlock: "vert",
    ptcFareBreakdowns: [{
      passengerFare: {
        baseFare: { amount: "9000.00", currencyCode: "DZD" },
        tax: { amount: "10900.00", currencyCode: "DZD" },
        totalFare: { amount: "19900.00", currencyCode: "DZD" }
      },
      passengerTypeQuantity: { code: "ADT", quantity: 1 }
    }],
    refund: "70", fareType: "GDS", gdsCountry: "DZ"
  },
  {
    fareSourceCode: "MOCK_FSC_006",
    gds: "AMA",
    totalFare: [{ amount: "15500.0", currencyCode: "DZD", decimalPlaces: 2 }],
    originDestinationOptions: [{
      departureAirportLocationCode: "ALG",
      departureAirportLocation: "Houari Boumedienne - Alger",
      departureTime: "14:00",
      departureDate: "08/06/2025",
      arrivalAirportLocationCode: "TUN",
      arrivalAirportLocation: "Carthage Arpt - Tunis",
      arrivalTime: "15:20",
      arrivalDate: "08/06/2025",
      totalTime: "01H 20M",
      airlineCodes: [["AH", "AH4006 Y Economy"]],
      nbStop: "Direct",
      seat: "15",
      baggage: "1PC",
      cabin: "Economy"
    }],
    soldeBlock: "rouge",
    ptcFareBreakdowns: [{
      passengerFare: {
        baseFare: { amount: "8000.00", currencyCode: "DZD" },
        tax: { amount: "7500.00", currencyCode: "DZD" },
        totalFare: { amount: "15500.00", currencyCode: "DZD" }
      },
      passengerTypeQuantity: { code: "ADT", quantity: 1 }
    }],
    refund: "70", fareType: "GDS", gdsCountry: "DZ"
  },
  {
    fareSourceCode: "MOCK_FSC_007",
    gds: "AMA",
    totalFare: [{ amount: "42500.0", currencyCode: "DZD", decimalPlaces: 2 }],
    originDestinationOptions: [{
      departureAirportLocationCode: "ALG",
      departureAirportLocation: "Houari Boumedienne - Alger",
      departureTime: "09:25",
      departureDate: "08/06/2025",
      arrivalAirportLocationCode: "IST",
      arrivalAirportLocation: "Istanbul Airport",
      arrivalTime: "13:55",
      arrivalDate: "08/06/2025",
      totalTime: "04H 30M",
      airlineCodes: [["TK", "TK656 Y Economy"]],
      nbStop: "Direct",
      seat: "8",
      baggage: "1PC",
      cabin: "Economy"
    }],
    soldeBlock: "vert",
    ptcFareBreakdowns: [{
      passengerFare: {
        baseFare: { amount: "28000.00", currencyCode: "DZD" },
        tax: { amount: "14500.00", currencyCode: "DZD" },
        totalFare: { amount: "42500.00", currencyCode: "DZD" }
      },
      passengerTypeQuantity: { code: "ADT", quantity: 1 }
    }],
    refund: "73", fareType: "GDS", gdsCountry: "DZ"
  },
  {
    fareSourceCode: "MOCK_FSC_008",
    gds: "AMA",
    totalFare: [{ amount: "58900.0", currencyCode: "DZD", decimalPlaces: 2 }],
    originDestinationOptions: [{
      departureAirportLocationCode: "ALG",
      departureAirportLocation: "Houari Boumedienne - Alger",
      departureTime: "23:50",
      departureDate: "08/06/2025",
      arrivalAirportLocationCode: "DOH",
      arrivalAirportLocation: "Doha Hamad Intl",
      arrivalTime: "08:15",
      arrivalDate: "09/06/2025",
      totalTime: "06H 25M",
      airlineCodes: [["QR", "QR1382 Y Economy"]],
      nbStop: "Direct",
      seat: "3",
      baggage: "2PC",
      cabin: "Economy"
    }],
    soldeBlock: "vert",
    ptcFareBreakdowns: [{
      passengerFare: {
        baseFare: { amount: "39000.00", currencyCode: "DZD" },
        tax: { amount: "19900.00", currencyCode: "DZD" },
        totalFare: { amount: "58900.00", currencyCode: "DZD" }
      },
      passengerTypeQuantity: { code: "ADT", quantity: 1 }
    }],
    refund: "73", fareType: "GDS", gdsCountry: "DZ"
  },
  {
    fareSourceCode: "MOCK_FSC_009",
    gds: "AMA",
    totalFare: [{ amount: "37800.0", currencyCode: "DZD", decimalPlaces: 2 }],
    originDestinationOptions: [{
      departureAirportLocationCode: "ALG",
      departureAirportLocation: "Houari Boumedienne - Alger",
      departureTime: "16:20",
      departureDate: "08/06/2025",
      arrivalAirportLocationCode: "CAI",
      arrivalAirportLocation: "Cairo International",
      arrivalTime: "20:10",
      arrivalDate: "08/06/2025",
      totalTime: "03H 50M",
      airlineCodes: [["MS", "MS722 Y Economy"]],
      nbStop: "Direct",
      seat: "6",
      baggage: "1PC",
      cabin: "Economy"
    }],
    soldeBlock: "vert",
    ptcFareBreakdowns: [{
      passengerFare: {
        baseFare: { amount: "24500.00", currencyCode: "DZD" },
        tax: { amount: "13300.00", currencyCode: "DZD" },
        totalFare: { amount: "37800.00", currencyCode: "DZD" }
      },
      passengerTypeQuantity: { code: "ADT", quantity: 1 }
    }],
    refund: "70", fareType: "GDS", gdsCountry: "DZ"
  },
  {
    fareSourceCode: "MOCK_FSC_010",
    gds: "AMA",
    totalFare: [{ amount: "89500.0", currencyCode: "DZD", decimalPlaces: 2 }],
    originDestinationOptions: [{
      departureAirportLocationCode: "ALG",
      departureAirportLocation: "Houari Boumedienne - Alger",
      departureTime: "02:15",
      departureDate: "08/06/2025",
      arrivalAirportLocationCode: "DXB",
      arrivalAirportLocation: "Dubai International",
      arrivalTime: "11:40",
      arrivalDate: "08/06/2025",
      totalTime: "07H 25M",
      airlineCodes: [["EK", "EK756 Y Economy"]],
      nbStop: "Direct",
      seat: "11",
      baggage: "2PC",
      cabin: "Economy"
    }],
    soldeBlock: "vert",
    ptcFareBreakdowns: [{
      passengerFare: {
        baseFare: { amount: "62000.00", currencyCode: "DZD" },
        tax: { amount: "27500.00", currencyCode: "DZD" },
        totalFare: { amount: "89500.00", currencyCode: "DZD" }
      },
      passengerTypeQuantity: { code: "ADT", quantity: 1 }
    }],
    refund: "73", fareType: "GDS", gdsCountry: "DZ"
  },
];

export async function searchFlights(params: SearchParams): Promise<FlightResult[]> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 1500));
    return MOCK_FLIGHT_RESULTS as unknown as FlightResult[];
  }

  const res = await fetch(apiUrl('/api/Flights/search'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Flight search error:', res.status, err);
    throw new Error(`Search failed: ${res.status}`);
  }

  // Le backend Amadeus renvoie déjà un tableau JSON plat — plus besoin de
  // gérer pricedItineraryNewModel / NDJSON / streaming (spécifique Worldsoft)
  const results: FlightResult[] = await res.json();

  if (results.length > 0) {
    console.log('RAW FIRST FLIGHT:', JSON.stringify(results[0], null, 2));
  }

  return results;
}