// src/service/admin/fournisseur.service.ts

const API = import.meta.env.VITE_API_URL;

export type FournisseurMode = 'LIVE' | 'TEST';
export type FournisseurTypeCode = 'FLIGHT' | 'HOTEL';

export interface FournisseurType {
    id: string;
    code: FournisseurTypeCode;
    label: string;
}

export interface Fournisseur {
    id: string;
    code: string;
    nom: string;
    marge: string; // Decimal comes back as a string from Prisma/JSON
    mode: FournisseurMode;
    monnaie: string;
    actif: boolean;
    type: FournisseurType; // NEW
    lastTestedAt: string | null;
    lastTestStatus: 'SUCCESS' | 'FAILED' | null;
    lastTestMessage: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface FournisseurTestResult {
    success: boolean;
    message: string;
}

export interface CreateFournisseurInput {
    code: string;
    nom: string;
    type: FournisseurTypeCode; // NEW — required, controller rejects without it
    marge?: number;
    mode?: FournisseurMode;
    monnaie?: string;
    actif?: boolean;
}

export interface UpdateFournisseurInput {
    nom?: string;
    marge?: number;
    mode?: FournisseurMode;
    monnaie?: string;
}

function authHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
}

async function handle<T>(res: Response): Promise<T> {
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message ?? 'Une erreur est survenue');
    }
    return data.data as T;
}

// ── GET /api/admin/fournisseurs ──────────────────────────────────────────
export async function listFournisseurs(): Promise<Fournisseur[]> {
    const res = await fetch(`${API}/api/admin/fournisseurs`, {
        headers: authHeaders(),
    });
    return handle<Fournisseur[]>(res);
}

export async function listActiveFournisseurs(): Promise<Fournisseur[]> {
    const res = await fetch(`${API}/api/admin/fournisseurs/active`, { headers: authHeaders() });
    return handle<Fournisseur[]>(res);
}

// ── GET /api/admin/fournisseurs/available-codes?type=FLIGHT|HOTEL ────────
export async function listAvailableCodes(type: FournisseurTypeCode): Promise<string[]> {
    const res = await fetch(`${API}/api/admin/fournisseurs/available-codes?type=${type}`, {
        headers: authHeaders(),
    });
    return handle<string[]>(res);
}

// ── POST /api/admin/fournisseurs ─────────────────────────────────────────
export async function createFournisseur(input: CreateFournisseurInput): Promise<Fournisseur> {
    const res = await fetch(`${API}/api/admin/fournisseurs`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(input),
    });
    return handle<Fournisseur>(res);
}

// ── PATCH /api/admin/fournisseurs/:id ────────────────────────────────────
export async function updateFournisseur(id: string, input: UpdateFournisseurInput): Promise<Fournisseur> {
    const res = await fetch(`${API}/api/admin/fournisseurs/${id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(input),
    });
    return handle<Fournisseur>(res);
}

// ── PATCH /api/admin/fournisseurs/:id/toggle ─────────────────────────────
export async function toggleFournisseur(id: string): Promise<Fournisseur> {
    const res = await fetch(`${API}/api/admin/fournisseurs/${id}/toggle`, {
        method: 'PATCH',
        headers: authHeaders(),
    });
    return handle<Fournisseur>(res);
}

// ── POST /api/admin/fournisseurs/:id/test ────────────────────────────────
export async function testFournisseur(id: string): Promise<{ fournisseur: Fournisseur; result: FournisseurTestResult }> {
    const res = await fetch(`${API}/api/admin/fournisseurs/${id}/test`, {
        method: 'POST',
        headers: authHeaders(),
    });
    return handle<{ fournisseur: Fournisseur; result: FournisseurTestResult }>(res);
}

// ── DELETE /api/admin/fournisseurs/:id ───────────────────────────────────
export async function deleteFournisseur(id: string): Promise<void> {
    const res = await fetch(`${API}/api/admin/fournisseurs/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
    });
    await handle<void>(res);
}