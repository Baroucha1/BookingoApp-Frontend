// src/service/admin/flightAcdFee.service.ts

const API = import.meta.env.VITE_API_URL;

export type FareClassScope = 'DEFAULT' | 'ECO' | 'BUSINESS' | 'FIRST' | 'PREM_ECO';
export type FeeTarifBasis = 'TTC' | 'HT';
export type FeeType = 'FIXED' | 'PERCENT';

export interface FlightAcdFeeBlock {
    id: string;
    scope: FareClassScope;
    fraisInt: string;
    montantMin: string;
    montantMax: string;
}

export interface FlightAcdFee {
    id: string;
    airlineCode: string | null;
    fournisseurCode: string;
    monnaie: string;
    tarif: FeeTarifBasis;
    typeFrais: FeeType;
    blocks: FlightAcdFeeBlock[];
    createdAt: string;
    updatedAt: string;
}

export interface AcdFeeBlockInput {
    scope: FareClassScope;
    fraisInt: number;
    montantMin?: number;
    montantMax?: number;
}

export interface CreateAcdFeeInput {
    airlineCode?: string | null;
    fournisseurCode: string;
    monnaie?: string;
    tarif?: FeeTarifBasis;
    typeFrais?: FeeType;
    blocks: AcdFeeBlockInput[];
}

export interface UpdateAcdFeeInput {
    monnaie?: string;
    tarif?: FeeTarifBasis;
    typeFrais?: FeeType;
    blocks?: AcdFeeBlockInput[];
}

export interface AcdZoneCountry {
    id: string;
    isoCode: string;
    nom: string;
}

function authHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

async function handle<T>(res: Response): Promise<T> {
    const data = await res.json();
    if (!res.ok) throw new Error(data.message ?? 'Une erreur est survenue');
    return data.data as T;
}

export async function listAcdFees(): Promise<FlightAcdFee[]> {
    const res = await fetch(`${API}/api/admin/flight-acd-fees`, { headers: authHeaders() });
    return handle<FlightAcdFee[]>(res);
}

export async function getAcdFee(id: string): Promise<FlightAcdFee> {
    const res = await fetch(`${API}/api/admin/flight-acd-fees/${id}`, { headers: authHeaders() });
    return handle<FlightAcdFee>(res);
}

export async function createAcdFee(input: CreateAcdFeeInput): Promise<FlightAcdFee> {
    const res = await fetch(`${API}/api/admin/flight-acd-fees`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify(input),
    });
    return handle<FlightAcdFee>(res);
}

export async function updateAcdFee(id: string, input: UpdateAcdFeeInput): Promise<FlightAcdFee> {
    const res = await fetch(`${API}/api/admin/flight-acd-fees/${id}`, {
        method: 'PATCH', headers: authHeaders(), body: JSON.stringify(input),
    });
    return handle<FlightAcdFee>(res);
}

export async function deleteAcdFee(id: string): Promise<void> {
    const res = await fetch(`${API}/api/admin/flight-acd-fees/${id}`, {
        method: 'DELETE', headers: authHeaders(),
    });
    await handle<void>(res);
}

export async function listAcdZoneCountries(): Promise<AcdZoneCountry[]> {
    const res = await fetch(`${API}/api/admin/acd-zone-countries`, { headers: authHeaders() });
    return handle<AcdZoneCountry[]>(res);
}