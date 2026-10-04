// src/lib/aircraft.ts

// IATA aircraft type codes → readable names.
// Unknown codes fall back to the raw code, so add new ones as you see them.
const AIRCRAFT_NAMES: Record<string, string> = {
    // Airbus
    '318': 'Airbus A318',
    '319': 'Airbus A319',
    '31N': 'Airbus A319neo',
    '320': 'Airbus A320',
    '32A': 'Airbus A320',
    '32N': 'Airbus A320neo',
    '321': 'Airbus A321',
    '32B': 'Airbus A321',
    '32Q': 'Airbus A321neo',
    '32S': 'Airbus A320 Family',
    '330': 'Airbus A330',
    '332': 'Airbus A330-200',
    '333': 'Airbus A330-300',
    '338': 'Airbus A330-800neo',
    '339': 'Airbus A330-900neo',
    '350': 'Airbus A350',
    '359': 'Airbus A350-900',
    '351': 'Airbus A350-1000',
    '380': 'Airbus A380',
    '388': 'Airbus A380-800',
    '221': 'Airbus A220-100',
    '223': 'Airbus A220-300',
    'BCS1': 'Airbus A220-100',
    'BCS3': 'Airbus A220-300',

    // Boeing
    '733': 'Boeing 737-300',
    '734': 'Boeing 737-400',
    '735': 'Boeing 737-500',
    '736': 'Boeing 737-600',
    '737': 'Boeing 737',
    '738': 'Boeing 737-800',
    '73H': 'Boeing 737-800',
    '739': 'Boeing 737-900',
    '73J': 'Boeing 737-900',
    '7M7': 'Boeing 737 MAX 7',
    '7M8': 'Boeing 737 MAX 8',
    '7M9': 'Boeing 737 MAX 9',
    '744': 'Boeing 747-400',
    '74H': 'Boeing 747-8',
    '752': 'Boeing 757-200',
    '763': 'Boeing 767-300',
    '76W': 'Boeing 767-300ER',
    '772': 'Boeing 777-200',
    '77L': 'Boeing 777-200LR',
    '773': 'Boeing 777-300',
    '77W': 'Boeing 777-300ER',
    '788': 'Boeing 787-8',
    '789': 'Boeing 787-9',
    '781': 'Boeing 787-10',

    // ATR / regional
    'AT4': 'ATR 42',
    'AT5': 'ATR 42-500',
    'AT7': 'ATR 72',
    'ATR': 'ATR',
    'CR7': 'Bombardier CRJ700',
    'CR9': 'Bombardier CRJ900',
    'CRK': 'Bombardier CRJ1000',
    'DH4': 'De Havilland Dash 8-400',
    'E70': 'Embraer 170',
    'E75': 'Embraer 175',
    'E90': 'Embraer 190',
    'E95': 'Embraer 195',
    'E7W': 'Embraer 175',
    'E290': 'Embraer E190-E2',
    'E295': 'Embraer E195-E2',
    '290': 'Embraer E190-E2',
    '295': 'Embraer E195-E2',

    // Other
    'SU9': 'Sukhoi Superjet 100',
    '100': 'Fokker 100',
};

export function getAircraftName(code?: string | null): string | null {
    if (!code) return null;
    const normalized = code.trim().toUpperCase();
    return AIRCRAFT_NAMES[normalized] ?? normalized;
}