import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

const API = import.meta.env.VITE_API_URL;

interface AuthUser {
  id:       string;
  email:    string;
  role:     'ADMIN' | 'AGENCY' | 'CLIENT';
  name:     string;
  lastName: string;
}

interface AuthContextType {
  user:           AuthUser | null;
  isAdmin:        boolean;
  loading:        boolean;
  signIn:         (email: string, password: string) => Promise<{ error: Error | null; code?: string }>;
  signInWithGoogle: (credential: string) => Promise<{ error: Error | null; code?: string }>;
  signUp:         (email: string, password: string, phone: string, name: string, lastName: string) => Promise<{ error: Error | null; otpEmail?: string }>;
  signOut:        () => void;
  loginWithToken: (token: string, user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }

    fetch(`${API}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
        .then(r => r.ok ? r.json() : null)
        .then(data => setUser(data ?? null))
        .catch(() => setUser(null))
        .finally(() => setLoading(false));
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const res  = await fetch(`${API}/api/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        const code = data.message === 'email_not_verified' ? 'email_not_verified' : undefined;
        return { error: new Error(data.message ?? 'Erreur de connexion.'), code };
      }

      localStorage.setItem('token', data.token);
      setUser(data.user);
      return { error: null };
    } catch (e) {
      return { error: e as Error };
    }
  };

  const signInWithGoogle = async (credential: string) => {
    try {
      const res = await fetch(`${API}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });
      const data = await res.json();

      if (!res.ok) return { error: new Error(data.message ?? 'Google sign-in failed.'), code: data.code };

      localStorage.setItem('token', data.token);
      setUser(data.user);
      return { error: null };
    } catch (e) {
      return { error: e as Error };
    }
  };

  const signUp = async (email: string, password: string, phone: string, name: string, lastName: string) => {
    try {
      const res  = await fetch(`${API}/api/auth/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password, phone, name, lastName }),
      });
      const data = await res.json();

      if (!res.ok) return { error: new Error(data.message ?? 'Erreur lors de l\'inscription.') };

      return { error: null, otpEmail: data.email as string };
    } catch (e) {
      return { error: e as Error };
    }
  };

  const loginWithToken = (token: string, incomingUser: AuthUser) => {
    localStorage.setItem('token', token);
    setUser(incomingUser);
  };

  const signOut = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
      <AuthContext.Provider value={{
        user,
        isAdmin: user?.role === 'ADMIN',
        loading,
        signIn,
        signInWithGoogle,
        signUp,
        signOut,
        loginWithToken,
      }}>
        {children}
      </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const updateMe = async (updates: { phone?: string; name?: string; lastName?: string }) => {
  const token = localStorage.getItem('token');
  const res   = await fetch(`${API}/api/auth/me`, {
    method:  'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(updates),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Update failed');
  return data;
};

export const changePassword = async (currentPassword: string, newPassword: string) => {
  const token = localStorage.getItem('token');
  const res   = await fetch(`${API}/api/auth/password`, {
    method:  'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify({ currentPassword, newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Échec du changement de mot de passe');
  return data;
};

export const setPassword = async (newPassword: string) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API}/api/auth/password`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Password setup failed');
  return data;
};
