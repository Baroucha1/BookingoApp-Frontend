import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2, Mail } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

const API = import.meta.env.VITE_API_URL;

function validateEmail(v: string, invalidMessage: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : invalidMessage;
}

const ForgotPassword = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [email, setEmail] = useState('');
    const [emailErr, setEmailErr] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const err = validateEmail(email, t('emailInvalid'));
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
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-5">
            <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-6">
                {sent ? (
                    <div className="text-center space-y-4">
                        <div className="text-5xl">✉️</div>
                        <h1 className="text-2xl font-bold text-gray-900">{t('forgotCheckEmail')}</h1>
                        <p className="text-sm text-gray-500">
                            {t('forgotPrivacyMessage')} <span className="font-semibold text-gray-700">{email}</span>, {t('forgotCodeSent')}
                        </p>
                        <button
                            onClick={() => navigate(`/verify-reset-otp?email=${encodeURIComponent(email)}`)}
                            className="w-full h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-white hover:opacity-90 transition-all"
                            style={{ background: '#0865FE' }}
                        >
                            <ArrowRight className="w-4 h-4" /> {t('forgotReceivedCode')}
                        </button>
                        <button
                            onClick={() => navigate('/login')}
                            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            {t('backToLogin')}
                        </button>
                    </div>
                ) : (
                    <>
                        <h1 className="text-2xl font-bold text-[#1775FF] mb-1">{t('forgotTitle')}</h1>
                        <p className="text-sm text-gray-400 mb-5">
                            {t('forgotInstructions')}
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                                    {t('emailLabel')}
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
                                        onChange={e => { setEmail(e.target.value); if (emailErr) setEmailErr(validateEmail(e.target.value, t('emailInvalid'))); }}
                                        onBlur={() => setEmailErr(validateEmail(email, t('emailInvalid')))}
                                        required
                                        placeholder={t('emailPlaceholder')}
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
                                    ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('forgotSending')}</>
                                    : <>{t('forgotSendCode')} <ArrowRight className="w-4 h-4" /></>}
                            </button>
                        </form>

                        <p className="text-center text-sm text-gray-500 mt-5">
                            <button type="button" onClick={() => navigate('/login')} className="font-semibold hover:underline" style={{ color: '#0865FE' }}>
                                {t('backToLogin')}
                            </button>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;