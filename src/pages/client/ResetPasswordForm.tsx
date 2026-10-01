import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

function validatePassword(v: string) {
    if (!v) return 'Le mot de passe est requis.';
    if (v.length < 8) return 'Minimum 8 caractères.';
    return '';
}

const ResetPasswordForm = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const resetToken = (location.state as { resetToken?: string } | null)?.resetToken;

    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [passwordErr, setPasswordErr] = useState('');
    const [confirmErr, setConfirmErr] = useState('');
    const [serverErr, setServerErr] = useState('');
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    if (!resetToken) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-5">
                <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-6 text-center space-y-4">
                    <p className="text-sm text-gray-500">Session invalide ou expirée.</p>
                    <button onClick={() => navigate('/forgot-password')} className="font-semibold" style={{ color: '#0865FE' }}>
                        Recommencer la procédure
                    </button>
                </div>
            </div>
        );
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const pErr = validatePassword(password);
        const cErr = password !== confirm ? 'Les mots de passe ne correspondent pas.' : '';
        setPasswordErr(pErr);
        setConfirmErr(cErr);
        if (pErr || cErr) return;

        setLoading(true);
        setServerErr('');
        try {
            const res = await fetch(`${API}/api/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resetToken, newPassword: password }),
            });
            const data = await res.json();
            if (!res.ok) {
                setServerErr(data.message ?? 'Une erreur est survenue.');
                return;
            }
            setDone(true);
            setTimeout(() => navigate('/login'), 2000);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-5">
            <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-6">
                {done ? (
                    <div className="text-center space-y-4">
                        <div className="text-5xl">✅</div>
                        <h1 className="text-2xl font-bold text-gray-900">Mot de passe modifié</h1>
                        <p className="text-sm text-gray-500">Redirection vers la connexion...</p>
                    </div>
                ) : (
                    <>
                        <h1 className="text-2xl font-bold text-[#1775FF] mb-1">Nouveau mot de passe</h1>
                        <p className="text-sm text-gray-400 mb-5">Choisissez un nouveau mot de passe.</p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                                    Nouveau mot de passe
                                </label>
                                <div className={`flex items-center gap-2.5 h-12 px-4 rounded-xl border-[1.5px] bg-gray-50 transition-all focus-within:bg-white ${
                                    passwordErr ? 'border-red-400 bg-red-50' : 'border-gray-200 focus-within:border-blue-400'
                                }`}>
                                    <input
                                        type={showPw ? 'text' : 'password'}
                                        value={password}
                                        onChange={e => { setPassword(e.target.value); if (passwordErr) setPasswordErr(validatePassword(e.target.value)); }}
                                        onBlur={() => setPasswordErr(validatePassword(password))}
                                        required
                                        placeholder="••••••••"
                                        className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder:text-gray-400"
                                    />
                                    <button type="button" onClick={() => setShowPw(p => !p)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {passwordErr && <p className="text-[11px] text-red-500 pl-1">{passwordErr}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                                    Confirmer le mot de passe
                                </label>
                                <div className={`flex items-center h-12 px-4 rounded-xl border-[1.5px] bg-gray-50 transition-all focus-within:bg-white ${
                                    confirmErr ? 'border-red-400 bg-red-50' : 'border-gray-200 focus-within:border-blue-400'
                                }`}>
                                    <input
                                        type={showPw ? 'text' : 'password'}
                                        value={confirm}
                                        onChange={e => { setConfirm(e.target.value); if (confirmErr) setConfirmErr(''); }}
                                        required
                                        placeholder="••••••••"
                                        className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder:text-gray-400"
                                    />
                                </div>
                                {confirmErr && <p className="text-[11px] text-red-500 pl-1">{confirmErr}</p>}
                            </div>

                            {serverErr && <p className="text-sm text-red-500 text-center">{serverErr}</p>}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-white disabled:opacity-60 hover:opacity-90 transition-all"
                                style={{ background: '#0865FE' }}
                            >
                                {loading
                                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...</>
                                    : <>Réinitialiser <ArrowRight className="w-4 h-4" /></>}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default ResetPasswordForm;