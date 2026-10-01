import {EntryType, VisaCategory} from "@/lib/enums.ts";
import type { Image } from '@/lib/types';

const BASE = import.meta.env.VITE_API_URL;

// ── Shared helpers ────────────────────────────────────────────────────────────
const token = () => localStorage.getItem('token') ?? '';

const authHeaders = (json = false): HeadersInit => ({
    Authorization: `Bearer ${token()}`,
    ...(json && { 'Content-Type': 'application/json' }),
});

async function handle<T>(res: Response): Promise<T> {
    if (!res.ok) {
        const msg = await res.text().catch(() => res.statusText);
        throw new Error(`[${res.status}] ${msg}`);
    }
    const body = await res.json();
    return (body?.data ?? body) as T;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CountryOption {
    id:     string;
    code:   string;
    nameFr: string;
    nameEn: string;
    nameAr: string;
    images?: Image[];
}

export interface DocumentType {
    id:     string;
    labelFr: string;
    labelEn: string;
    labelAr: string;
}

export interface RequirementPayload {
    documentTypeId: string;
    isRequired:     boolean;
    allowsUpload:   boolean;
    notesFr:        string | null;
    notesEn:        string | null;
    notesAr:        string | null;
}

export interface DocumentRequirement extends RequirementPayload {
    id:           string;
    visaTypeId:   string;
    documentType: DocumentType;
}

/** Fields sent on create / update */
export interface VisaTypePayload {
    countryId:       string;
    nameFr:          string;
    nameEn:          string;
    nameAr:          string;
    descriptionFr:   string | null;
    descriptionEn:   string | null;
    descriptionAr:   string | null;
    category:        VisaCategory | null;
    entryType:       EntryType | null;
    duration:        number;
    processingDelay: number;
    isActive:        boolean;
    price:           number;
    currency:        string;
    requirements:    RequirementPayload[];
}

/** Full VisaType as returned by the API */
export interface VisaType {
    id:                   string;
    createdAt:            string;
    country:              CountryOption;
    nameFr:               string;
    nameEn:               string;
    nameAr:               string;
    descriptionFr:        string | null;
    descriptionEn:        string | null;
    descriptionAr:        string | null;
    category:             string;
    entryType:            string;
    duration:             number;
    processingDelay:      number;
    isActive:             boolean;
    price:                number;
    currency:             string;
    documentRequirements: DocumentRequirement[];   // relational — NOT requirements
}

// ── visa types ────────────────────────────────────────────────────────────────
export async function getAllVisaTypes(): Promise<VisaType[]> {
    return handle<VisaType[]>(await fetch(`${BASE}/api/admin/visa-types`, { headers: authHeaders() }));
}

export async function getOneVisaType(id: string): Promise<VisaType> {
    return handle<VisaType>(await fetch(`${BASE}/api/admin/visa-types/${id}`, { headers: authHeaders() }));
}

export async function createVisaType(payload: VisaTypePayload): Promise<VisaType> {
    return handle<VisaType>(await fetch(`${BASE}/api/admin/visa-types`, {
        method: 'POST', headers: authHeaders(true), body: JSON.stringify(payload),
    }));
}

export async function updateVisaType(id: string, payload: VisaTypePayload): Promise<VisaType> {
    return handle<VisaType>(await fetch(`${BASE}/api/admin/visa-types/${id}`, {
        method: 'PUT', headers: authHeaders(true), body: JSON.stringify(payload),
    }));
}

export async function removeVisaType(id: string): Promise<void> {
    return handle<void>(await fetch(`${BASE}/api/admin/visa-types/${id}`, {
        method: 'DELETE', headers: authHeaders(),
    }));
}

// ── Countries ─────────────────────────────────────────────────────────────────
export async function getCountries(): Promise<CountryOption[]> {
    return handle<CountryOption[]>(await fetch(`${BASE}/api/admin/countries`, { headers: authHeaders() }));
}

// ── Document types ────────────────────────────────────────────────────────────
export async function getDocumentTypes(): Promise<DocumentType[]> {
    return handle<DocumentType[]>(await fetch(`${BASE}/api/admin/document-types`, { headers: authHeaders() }));
}

export async function getPublicVisaTypes(): Promise<VisaType[]> {
    let res: Response;

    try {
        res = await fetch(`${BASE}/api/visa-types`);
    } catch (networkErr) {

        throw new Error(`[getPublicVisaTypes] Network error — is the server running at ${BASE}? ${networkErr}`);
    }

    let json: any;
    try {
        json = await res.json();
    } catch {
        // server returned HTML (404 page, nginx error, etc.) instead of JSON
        throw new Error(`[getPublicVisaTypes] Server returned non-JSON (HTTP ${res.status}) — check your route is registered`);
    }

    if (!res.ok) {
        throw new Error(`[getPublicVisaTypes] HTTP ${res.status}: ${json?.message ?? json?.error ?? 'Unknown server error'}`);
    }

    if (!Array.isArray(json.data)) {
        throw new Error(`[getPublicVisaTypes] Unexpected response shape: ${JSON.stringify(json)}`);
    }

    return json.data;
}