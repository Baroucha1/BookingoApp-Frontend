const API_URL = import.meta.env.VITE_API_URL;

const authHeaders = (): HeadersInit => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

export interface AdminUserRow {
    id:       string;
    email:    string;
    name:     string;
    lastname: string;
    phone:    string | null;
    role:     'ADMIN' | 'AGENCY' | 'CLIENT';
    isActive: boolean;
    client:   { id: string; isVerified: boolean } | null;
    agency:   { id: string; companyName: string; isVerified: boolean } | null;
    admin:    { id: string } | null;
}

/** Admin: list users, optionally filtered by role */
export const listUsers = async (role?: 'ADMIN' | 'AGENCY' | 'CLIENT'): Promise<AdminUserRow[]> => {
    const url = role ? `${API_URL}/api/admin/users?role=${role}` : `${API_URL}/api/admin/users`;
    const res  = await fetch(url, { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message ?? 'Erreur de chargement des utilisateurs');
    return data.data;
};

/** Admin: get a single user by id */
export const getUser = async (id: string): Promise<AdminUserRow> => {
    const res  = await fetch(`${API_URL}/api/admin/users/${id}`, { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message ?? 'Utilisateur introuvable');
    return data.data;
};