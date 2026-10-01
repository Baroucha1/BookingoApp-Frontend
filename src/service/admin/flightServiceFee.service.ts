// src/service/admin/flightServiceFee.service.ts

const API = import.meta.env.VITE_API_URL;

export type FareClassScope = 'DEFAULT' | 'ECO' | 'BUSINESS' | 'FIRST' | 'PREM_ECO';
export type FeeTarifBasis = 'TTC' | 'HT';
export type FeeType = 'FIXED' | 'PERCENT';

export interface FlightServiceFeeBlock {
    id: string;
    scope: FareClassScope;
    fraisInt: string;
    fraisDom: string;
    montantMin: string;
    montantMax: string;
}

export interface FlightServiceFee {
    id: string;
    airlineCode: string | null;
    fournisseurCode: string;
    monnaie: string;
    tarif: FeeTarifBasis;
    typeFrais: FeeType;
    blocks: FlightServiceFeeBlock[];
    createdAt: string;
    updatedAt: string;
}

export interface FeeBlockInput {
    scope: FareClassScope;
    fraisInt: number;
    fraisDom: number;
    montantMin?: number;
    montantMax?: number;
}

export interface CreateServiceFeeInput {
    airlineCode?: string | null;
    fournisseurCode: string;
    monnaie?: string;
    tarif?: FeeTarifBasis;
    typeFrais?: FeeType;
    blocks: FeeBlockInput[];
}

export interface UpdateServiceFeeInput {
    monnaie?: string;
    tarif?: FeeTarifBasis;
    typeFrais?: FeeType;
    blocks?: FeeBlockInput[];
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

export async function listServiceFees(): Promise<FlightServiceFee[]> {
    const res = await fetch(`${API}/api/admin/flight-service-fees`, { headers: authHeaders() });
    return handle<FlightServiceFee[]>(res);
}

export async function getServiceFee(id: string): Promise<FlightServiceFee> {
    const res = await fetch(`${API}/api/admin/flight-service-fees/${id}`, { headers: authHeaders() });
    return handle<FlightServiceFee>(res);
}

export async function createServiceFee(input: CreateServiceFeeInput): Promise<FlightServiceFee> {
    const res = await fetch(`${API}/api/admin/flight-service-fees`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify(input),
    });
    return handle<FlightServiceFee>(res);
}

export async function updateServiceFee(id: string, input: UpdateServiceFeeInput): Promise<FlightServiceFee> {
    const res = await fetch(`${API}/api/admin/flight-service-fees/${id}`, {
        method: 'PATCH', headers: authHeaders(), body: JSON.stringify(input),
    });
    return handle<FlightServiceFee>(res);
}

export async function deleteServiceFee(id: string): Promise<void> {
    const res = await fetch(`${API}/api/admin/flight-service-fees/${id}`, {
        method: 'DELETE', headers: authHeaders(),
    });
    await handle<void>(res);
}

// ── Fee test/preview ──────────────────────────────────────────────────────
export interface TestFeeInput {
    airlineCode: string;
    fournisseurCode: string;
    price: number;
    adults?: number;
    children?: number;
    infants?: number;
    isDomestic?: boolean;
}

export interface TestFeeResult {
    fee: number;
    feeRecordFound: boolean;
    tierMatched?: boolean;
    isDomestic?: boolean;
    perPersonFee?: number;
    pricableParticipants?: number;
    finalPrice: number;
}

export async function testServiceFee(input: TestFeeInput): Promise<TestFeeResult> {
    const res = await fetch(`${API}/api/admin/flight-service-fees/test`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify(input),
    });
    return handle<TestFeeResult>(res);
}