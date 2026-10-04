const API_URL = import.meta.env.VITE_API_URL;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DocumentType {
    id: string;
    key: string;
    labelFr: string;
    labelEn: string;
    labelAr: string;
    descriptionFr: string | null;
    descriptionEn: string | null;
    descriptionAr: string | null;
    createdAt: string;
    updatedAt: string;
    _count?: { visaRequirements: number };
}

export interface DocumentTypeInput {
    key: string;
    labelFr: string;
    labelEn: string;
    labelAr: string;
    descriptionFr: string;
    descriptionEn: string;
    descriptionAr: string;
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
        headers: {
            ...authHeaders(),
            ...options.headers,
        },
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.status !== 'success') {
        throw new Error(data.message ?? `Erreur ${res.status}`);
    }

    return data.data as T;
}

// ── Document types (admin) ────────────────────────────────────────────────────

export const documentTypesService = {
    // GET /api/admin/document-types
    getAll: () =>
        request<DocumentType[]>('/api/admin/document-types'),

    // GET /api/admin/document-types/:id
    getById: (id: string) =>
        request<DocumentType>(`/api/admin/document-types/${id}`),

    // POST /api/admin/document-types
    create: (data: DocumentTypeInput) =>
        request<DocumentType>('/api/admin/document-types', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    // PUT /api/admin/document-types/:id
    update: (id: string, data: DocumentTypeInput) =>
        request<DocumentType>(`/api/admin/document-types/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    // DELETE /api/admin/document-types/:id
    remove: (id: string) =>
        request<null>(`/api/admin/document-types/${id}`, { method: 'DELETE' }),
};