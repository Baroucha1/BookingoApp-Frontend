import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Loader2, Mail } from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

function validateEmail(v: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Adresse e-mail invalide.';
}

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [emailErr, setEmailErr] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const err = validateEmail(email);
        setEmailErr(err);
        if (err) return;

        setLoading(true);
        try {
            await fetch(`${API}/api/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            // On affiche toujours le même message, que le compte existe ou non
            setSent(true);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-5 py-8">
            <div className="w-full max-w-md mb-4 flex justify-start">
                <button
                    type="button"
                    onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/login')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-700 hover:text-[#0865FE] hover:border-[#0865FE]/30 font-semibold text-xs shadow-xs hover:shadow-sm transition-all cursor-pointer"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Retour à la connexion</span>
                </button>
            </div>
            <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-6">
                {sent ? (
                    <div className="text-center space-y-4">
                        <div className="text-5xl">✉️</div>
                        <h1 className="text-2xl font-bold text-gray-900">Vérifiez votre e-mail</h1>
                        <p className="text-sm text-gray-500">
                            Si un compte existe pour <span className="font-semibold text-gray-700">{email}</span>,
                            un code de vérification vient d'être envoyé.
                        </p>
                        <button
                            onClick={() => navigate(`/verify-reset-otp?email=${encodeURIComponent(email)}`)}
                            className="w-full h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-white hover:opacity-90 transition-all"
                            style={{ background: '#0865FE' }}
                        >
                            <ArrowRight className="w-4 h-4" /> J'ai reçu le code
                        </button>
                    </div>
                ) : (
                    <>
                        <h1 className="text-2xl font-bold text-[#1775FF] mb-1">Mot de passe oublié</h1>
                        <p className="text-sm text-gray-400 mb-5">
                            Entrez votre adresse email, nous vous enverrons un code pour réinitialiser votre mot de passe.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                                    Adresse email
                                </label>
                                <div
                                    className={`flex items-center h-12 px-4 rounded-xl border-[1.5px] bg-gray-50 transition-all focus-within:bg-white ${
                                        emailErr ? 'border-red-400 bg-red-50' : 'border-gray-200 focus-within:border-blue-400'
                                    }`}
                                >
                                    <Mail className="w-4 h-4 shrink-0 text-gray-400" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => { setEmail(e.target.value); if (emailErr) setEmailErr(validateEmail(e.target.value)); }}
                                        onBlur={() => setEmailErr(validateEmail(email))}
                                        required
                                        placeholder="vous@exemple.com"
                                        className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder:text-gray-400 pl-3"
                                    />
                                </div>
                                {emailErr && <p className="text-[11px] text-red-500 pl-1">{emailErr}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-white disabled:opacity-60 hover:opacity-90 transition-all"
                                style={{ background: '#0865FE' }}
                            >
                                {loading
                                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Envoi...</>
                                    : <>Envoyer le code <ArrowRight className="w-4 h-4" /></>}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;