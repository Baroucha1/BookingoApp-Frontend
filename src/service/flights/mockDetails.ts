// Inline mock data sets for the flight detail modal — keyed by fareSourceCode.

export interface MockSegment {
  departureAireport: string;
  arrivalAireport: string;
  departureDate: string;
  arrivalDate: string;
  departureTime: string;
  arrivalTime: string;
  fligthDuration: string;
  stopOverTime: string | null;
  flightNum: string;
  airline: string;
  classCabin: string;
}

export const MOCK_FLIGHT_DETAILS: Record<string, { success: boolean; originDestinationOptions: { segments: MockSegment[] }[] }> = {
  MOCK_FSC_001: {
    success: true,
    originDestinationOptions: [{
      segments: [{
        departureAireport: "Houari Boumedienne - Alger (ALG)",
        arrivalAireport: "Carthage Arpt - Tunis (TUN)",
        departureDate: "2025-06-08",
        arrivalDate: "2025-06-08",
        departureTime: "07:10",
        arrivalTime: "08:30",
        fligthDuration: "01H 20M",
        stopOverTime: null,
        flightNum: "AH4000",
        airline: "Air Algérie",
        classCabin: "Economy Standard (B)",
      }],
    }],
  },
  MOCK_FSC_002: {
    success: true,
    originDestinationOptions: [{
      segments: [{
        departureAireport: "Houari Boumedienne - Alger (ALG)",
        arrivalAireport: "Carthage Arpt - Tunis (TUN)",
        departureDate: "2025-06-08",
        arrivalDate: "2025-06-08",
        departureTime: "11:45",
        arrivalTime: "13:05",
        fligthDuration: "01H 20M",
        stopOverTime: null,
        flightNum: "AH4002",
        airline: "Air Algérie",
        classCabin: "Economy Standard (Y)",
      }],
    }],
  },
  MOCK_FSC_003: {
    success: true,
    originDestinationOptions: [{
      segments: [{
        departureAireport: "Houari Boumedienne - Alger (ALG)",
        arrivalAireport: "Carthage Arpt - Tunis (TUN)",
        departureDate: "2025-06-08",
        arrivalDate: "2025-06-08",
        departureTime: "06:00",
        arrivalTime: "07:20",
        fligthDuration: "01H 20M",
        stopOverTime: null,
        flightNum: "6H1234",
        airline: "Israir (Low Cost)",
        classCabin: "Economy (Y)",
      }],
    }],
  },
  MOCK_FSC_004: {
    success: true,
    originDestinationOptions: [{
      segments: [{
        departureAireport: "Houari Boumedienne - Alger (ALG)",
        arrivalAireport: "Carthage Arpt - Tunis (TUN)",
        departureDate: "2025-06-08",
        arrivalDate: "2025-06-08",
        departureTime: "07:10",
        arrivalTime: "08:30",
        fligthDuration: "01H 20M",
        stopOverTime: null,
        flightNum: "AH4000",
        airline: "Air Algérie",
        classCabin: "Business (C)",
      }],
    }],
  },
  MOCK_FSC_005: {
    success: true,
    originDestinationOptions: [{
      segments: [
        {
          departureAireport: "Houari Boumedienne - Alger (ALG)",
          arrivalAireport: "Tunis-Carthage (TUN) — Escale",
          departureDate: "2025-06-08",
          arrivalDate: "2025-06-08",
          departureTime: "18:30",
          arrivalTime: "19:50",
          fligthDuration: "01H 20M",
          stopOverTime: "01H 05M",
          flightNum: "AH4010",
          airline: "Air Algérie",
          classCabin: "Economy Standard (Y)",
        },
        {
          departureAireport: "Tunis-Carthage (TUN)",
          arrivalAireport: "Houari Boumedienne - Alger (ALG)",
          departureDate: "2025-06-08",
          arrivalDate: "2025-06-08",
          departureTime: "21:00",
          arrivalTime: "22:15",
          fligthDuration: "01H 15M",
          stopOverTime: null,
          flightNum: "AH4011",
          airline: "Air Algérie",
          classCabin: "Economy Standard (Y)",
        },
      ],
    }],
  },
};

export interface MockRule { category: string; rules: string }
export interface MockBaggage { departure: string; arrival: string; flightNo: string; aireline: string; baggage: string }

export const MOCK_FARE_RULES: Record<string, { success: boolean; baggageInfos: MockBaggage[]; fareRules: { airline: string; cityPair: string; fareBasis: string; ruleDetails: MockRule[] }[] }> = {
  MOCK_FSC_001: {
    success: true,
    baggageInfos: [{ departure: "ALG", arrival: "TUN", flightNo: "AH4000", aireline: "Air Algérie", baggage: "1 bagage en soute (23kg) inclus" }],
    fareRules: [{
      airline: "Air Algérie", cityPair: "ALG-TUN", fareBasis: "BECO",
      ruleDetails: [
        { category: "ANNULATIONS", rules: "Annulation avant départ : frais de 2 000 DZD\nNo-show : frais de 4 000 DZD\nUn no-show est constaté si la réservation n'est pas modifiée 3h avant le départ." },
        { category: "MODIFICATIONS", rules: "Changement avant départ : frais de 3 000 DZD\nLe nouveau tarif doit être égal ou supérieur au tarif initial.\nNo-show : frais de 4 000 DZD." },
        { category: "REMBOURSEMENT", rules: "Remboursement autorisé dans la limite de validité du billet.\nFrais de remboursement : 2 000 DZD.\nYR fuel surcharge remboursable si le tarif est remboursable." },
      ],
    }],
  },
  MOCK_FSC_002: {
    success: true,
    baggageInfos: [{ departure: "ALG", arrival: "TUN", flightNo: "AH4002", aireline: "Air Algérie", baggage: "1 bagage en soute (23kg) inclus" }],
    fareRules: [{
      airline: "Air Algérie", cityPair: "ALG-TUN", fareBasis: "YECO",
      ruleDetails: [
        { category: "ANNULATIONS", rules: "Billet NON REMBOURSABLE.\nAucun remboursement possible après émission." },
        { category: "MODIFICATIONS", rules: "Modification NON AUTORISÉE après émission." },
        { category: "BAGAGES", rules: "1 bagage en soute de 23kg inclus.\n1 bagage cabine de 10kg inclus." },
      ],
    }],
  },
  MOCK_FSC_003: {
    success: true,
    baggageInfos: [{ departure: "ALG", arrival: "TUN", flightNo: "6H1234", aireline: "Israir", baggage: "Cabine uniquement (pas de bagage en soute)" }],
    fareRules: [{
      airline: "Israir", cityPair: "ALG-TUN", fareBasis: "LOW",
      ruleDetails: [
        { category: "ANNULATIONS", rules: "Billet NON REMBOURSABLE. Aucune exception." },
        { category: "BAGAGES", rules: "Bagage cabine uniquement (max 10kg).\nBagage en soute disponible en option payante." },
        { category: "MODIFICATIONS", rules: "Modification possible moyennant des frais de 5 000 DZD + différence tarifaire." },
      ],
    }],
  },
  MOCK_FSC_004: {
    success: true,
    baggageInfos: [{ departure: "ALG", arrival: "TUN", flightNo: "AH4000", aireline: "Air Algérie", baggage: "2 bagages en soute (32kg chacun) inclus" }],
    fareRules: [{
      airline: "Air Algérie", cityPair: "ALG-TUN", fareBasis: "CBIZ",
      ruleDetails: [
        { category: "ANNULATIONS", rules: "Annulation gratuite jusqu'à 24h avant le départ.\nAprès : frais de 5 000 DZD." },
        { category: "MODIFICATIONS", rules: "Modification gratuite jusqu'à 24h avant le départ.\nAprès : frais de 3 000 DZD." },
        { category: "BAGAGES", rules: "2 bagages en soute de 32kg inclus.\nAccès lounge inclus." },
      ],
    }],
  },
};

export interface MockClass { classe: string; code: string; price: number; priceDiff: number; available: boolean }

export const MOCK_AVAILABILITY: Record<string, MockClass[]> = {
  MOCK_FSC_001: [
    { classe: "Economy Standard", code: "Y", price: 23976, priceDiff: 0, available: true },
    { classe: "Economy Flex",     code: "B", price: 27500, priceDiff: 3524, available: true },
    { classe: "Business",         code: "C", price: 67800, priceDiff: 43824, available: true },
    { classe: "Première classe",  code: "F", price: 95000, priceDiff: 71024, available: false },
  ],
  MOCK_FSC_003: [
    { classe: "Economy",  code: "Y", price: 18200, priceDiff: 0, available: true },
    { classe: "Economy+", code: "W", price: 24000, priceDiff: 5800, available: true },
  ],
};
