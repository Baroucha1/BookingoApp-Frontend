const API_URL = import.meta.env.VITE_API_URL;

// ── Types ─────────────────────────────────────────────────────────────────────

export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';
export type PromoRole = 'CLIENT' | 'AGENCY';

export interface PromoCode {
    id: string;
    code: string;
    discountType: DiscountType;
    discountValue: number;
    applicableTo: PromoRole | null;
    appliesToVisa: boolean;
    appliesToFlight: boolean;
    appliesToHotel: boolean;
    minAmount: number | null;
    maxDiscount: number | null;
    maxUses: number | null;
    maxUsesPerUser: number | null;
    usedCount: number;
    expiresAt: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface PromoUsageStat {
    count: number;
    totalDiscount: number;
}

export interface PromoCodeDetail extends PromoCode {
    usage: Partial<Record<'RESERVED' | 'CONSUMED' | 'RELEASED', PromoUsageStat>>;
}

export interface PromoCodeInput {
    code: string;
    discountType: DiscountType;
    discountValue: number;
    applicableTo: PromoRole | null;
    appliesToVisa: boolean;
    appliesToFlight: boolean;
    appliesToHotel: boolean;
    minAmount: number | null;
    maxDiscount: number | null;
    maxUses: number | null;
    maxUsesPerUser: number | null;
    expiresAt: string | null;
    isActive: boolean;
}

export type PromoService = 'VISA' | 'FLIGHT' | 'HOTEL';
export type PromoUsageStatus = 'RESERVED' | 'CONSUMED' | 'RELEASED';

export interface PromoUsageRow {
    id: string;
    status: PromoUsageStatus;
    usedAt: string;
    originalAmount: number | null;
    discountApplied: number;
    service: PromoService | null;
    paymentRef: string | null;
    userType: PromoRole | null;
    userName: string | null;
    userEmail: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const authHeaders = (): HeadersInit => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: { ...authHeaders(), ...options.headers },
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.status !== 'success') {
        throw new Error(data.message ?? `Erreur ${res.status}`);
    }

    return data.data as T;
}

// ── Promo codes (admin) ───────────────────────────────────────────────────────

export const promoCodesService = {
    // GET /api/admin/promo-codes
    getAll: () =>
        request<PromoCode[]>('/api/admin/promo-codes'),

    // GET /api/admin/promo-codes/:id
    getById: (id: string) =>
        request<PromoCodeDetail>(`/api/admin/promo-codes/${id}`),

    // POST /api/admin/promo-codes
    create: (data: PromoCodeInput) =>
        request<PromoCode>('/api/admin/promo-codes', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    // PUT /api/admin/promo-codes/:id
    update: (id: string, data: PromoCodeInput) =>
        request<PromoCode>(`/api/admin/promo-codes/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    // GET /api/admin/promo-codes/:id/usages
    getUsages: (id: string) =>
        request<PromoUsageRow[]>(`/api/admin/promo-codes/${id}/usages`),

    // PATCH /api/admin/promo-codes/:id/toggle
    toggle: (id: string) =>
        request<PromoCode>(`/api/admin/promo-codes/${id}/toggle`, { method: 'PATCH' }),

    // DELETE /api/admin/promo-codes/:id
    remove: (id: string) =>
        request<null>(`/api/admin/promo-codes/${id}`, { method: 'DELETE' }),
};