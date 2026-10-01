import { apiUrl } from '../_http';

export interface Airport {
    code: string
    name: string
    city: string
    country: string
    type: string
}

export const searchAirports = async (keyword: string): Promise<Airport[]> => {
    if (!keyword || keyword.length < 2) return [];
    try {
        const res = await fetch(apiUrl(`/api/flights/airports?keyword=${encodeURIComponent(keyword)}`));
        if (!res.ok) return [];
        return res.json();
    } catch {
        return [];
    }
};

// fallback static list for when API is unavailable
export const FALLBACK_AIRPORTS: Airport[] = [
    { code: 'ALG', name: 'Houari Boumedienne', city: 'Alger', country: 'Algérie', type: 'AIRPORT' },
    { code: 'ORN', name: 'Es Sénia', city: 'Oran', country: 'Algérie', type: 'AIRPORT' },
    { code: 'CZL', name: 'Mohamed Boudiaf', city: 'Constantine', country: 'Algérie', type: 'AIRPORT' },
    { code: 'AAE', name: 'Rabah Bitat', city: 'Annaba', country: 'Algérie', type: 'AIRPORT' },
    { code: 'TLM', name: 'Zenata', city: 'Tlemcen', country: 'Algérie', type: 'AIRPORT' },
    { code: 'BJA', name: 'Soummam', city: 'Béjaïa', country: 'Algérie', type: 'AIRPORT' },
    { code: 'GJL', name: 'Taher', city: 'Jijel', country: 'Algérie', type: 'AIRPORT' },
    { code: 'OGX', name: 'Ain Beida', city: 'Ouargla', country: 'Algérie', type: 'AIRPORT' },
    { code: 'TMR', name: 'Aguenar', city: 'Tamanrasset', country: 'Algérie', type: 'AIRPORT' },
    { code: 'BSK', name: 'Mohamed Khider', city: 'Biskra', country: 'Algérie', type: 'AIRPORT' },
    { code: 'TUN', name: 'Carthage', city: 'Tunis', country: 'Tunisie', type: 'AIRPORT' },
    { code: 'CMN', name: 'Mohammed V', city: 'Casablanca', country: 'Maroc', type: 'AIRPORT' },
    { code: 'CDG', name: 'Charles de Gaulle', city: 'Paris', country: 'France', type: 'AIRPORT' },
    { code: 'ORY', name: 'Orly', city: 'Paris', country: 'France', type: 'AIRPORT' },
    { code: 'LYS', name: 'Saint-Exupéry', city: 'Lyon', country: 'France', type: 'AIRPORT' },
    { code: 'MRS', name: 'Provence', city: 'Marseille', country: 'France', type: 'AIRPORT' },
    { code: 'NCE', name: 'Côte d\'Azur', city: 'Nice', country: 'France', type: 'AIRPORT' },
    { code: 'IST', name: 'Istanbul Airport', city: 'Istanbul', country: 'Turquie', type: 'AIRPORT' },
    { code: 'DXB', name: 'Dubai International', city: 'Dubai', country: 'EAU', type: 'AIRPORT' },
    { code: 'DOH', name: 'Hamad International', city: 'Doha', country: 'Qatar', type: 'AIRPORT' },
    { code: 'CAI', name: 'Cairo International', city: 'Le Caire', country: 'Égypte', type: 'AIRPORT' },
    { code: 'LHR', name: 'Heathrow', city: 'Londres', country: 'Royaume-Uni', type: 'AIRPORT' },
    { code: 'FCO', name: 'Leonardo da Vinci', city: 'Rome', country: 'Italie', type: 'AIRPORT' },
    { code: 'MAD', name: 'Barajas', city: 'Madrid', country: 'Espagne', type: 'AIRPORT' },
    { code: 'BCN', name: 'El Prat', city: 'Barcelone', country: 'Espagne', type: 'AIRPORT' },
    { code: 'AMS', name: 'Schiphol', city: 'Amsterdam', country: 'Pays-Bas', type: 'AIRPORT' },
    { code: 'FRA', name: 'Frankfurt', city: 'Francfort', country: 'Allemagne', type: 'AIRPORT' },
    { code: 'JED', name: 'King Abdulaziz', city: 'Jeddah', country: 'Arabie Saoudite', type: 'AIRPORT' },
    { code: 'RUH', name: 'King Khalid', city: 'Riyad', country: 'Arabie Saoudite', type: 'AIRPORT' },
    { code: 'BEY', name: 'Rafic Hariri', city: 'Beyrouth', country: 'Liban', type: 'AIRPORT' },
    { code: 'AMM', name: 'Queen Alia', city: 'Amman', country: 'Jordanie', type: 'AIRPORT' },
    { code: 'TIP', name: 'Mitiga', city: 'Tripoli', country: 'Libye', type: 'AIRPORT' },
    { code: 'NBO', name: 'Jomo Kenyatta', city: 'Nairobi', country: 'Kenya', type: 'AIRPORT' },
    { code: 'JNB', name: 'OR Tambo', city: 'Johannesburg', country: 'Afrique du Sud', type: 'AIRPORT' },
    { code: 'YUL', name: 'Pierre Elliott Trudeau', city: 'Montréal', country: 'Canada', type: 'AIRPORT' },
    { code: 'JFK', name: 'John F. Kennedy', city: 'New York', country: 'États-Unis', type: 'AIRPORT' },
]

export const searchAirportsFallback = (keyword: string): Airport[] => {
    if (!keyword || keyword.length < 2) return []
    const q = keyword.toLowerCase()
    return FALLBACK_AIRPORTS.filter(a =>
        a.code.toLowerCase().includes(q) ||
        a.city.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.country.toLowerCase().includes(q)
    ).slice(0, 6)
}