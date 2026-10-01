import { getAirlineLogo, getAirlineName } from '@/service/flights/airlines.ts';
import {partners} from "@/data/data.ts";

const PARTNER_IATA_CODES: Record<string, string> = {
    'Turkish Airlines': 'TK',
    'Qatar Airways': 'QR',
    'Air Algérie': 'AH',
    'Air France': 'AF',
    'Lufthansa': 'LH',
    'Iberia': 'IB',
    'ITA Airways': 'AZ',
    'Tassili Airlines': 'SF',
    'Nouvelair': 'BJ',
    'Vueling': 'VY',
    'AJet': 'VF',
    'ASL Airlines France': '5O',
    'LAM Mozambique Airlines': 'TM',
    'TUI fly Belgium': 'TB',
    'Tunisair': 'TU',
    'Volotea': 'V7',
};

export interface AirlineOption {
    code: string;
    name: string;
    logo: string;
}

export const AIRLINES: AirlineOption[] = partners
    .map((p) => {
        const code = PARTNER_IATA_CODES[p.name];
        if (!code) {
            console.warn(`[airlines] no IATA code mapped for partner "${p.name}" — excluded from AIRLINES list`);
            return null;
        }
        return {
            code,
            name: getAirlineName(code), // use your canonical name map, not p.name
            logo: getAirlineLogo(code),  // icon-only Google Flights logo
        };
    })
    .filter((a): a is AirlineOption => a !== null);