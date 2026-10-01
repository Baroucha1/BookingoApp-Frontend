import { useState, useRef, useEffect, type ClipboardEvent, type KeyboardEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';

const API = import.meta.env.VITE_API_URL;

const VerifyResetOtp = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const email = searchParams.get('email') || '';

    const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [wait, setWait] = useState(60);
    const inputs = useRef<HTMLInputElement[]>([]);

    useEffect(() => { inputs.current[0]?.focus(); }, []);
    useEffect(() => {
        if (wait <= 0) return;
        const t = setTimeout(() => setWait(w => w - 1), 1000);
        return () => clearTimeout(t);
    }, [wait]);

    const code = digits.join('');

    function handleChange(i: number, val: string) {
        if (!/^\d?$/.test(val)) return;
        setError('');
        const next = [...digits]; next[i] = val; setDigits(next);
        if (val && i < 5) inputs.current[i + 1]?.focus();
    }
    function handleKey(i: number, e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Backspace' && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
    }
    function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length === 6) { setDigits(pasted.split('')); inputs.current[5]?.focus(); }
    }

    async function submit() {
        if (code.length < 6 || loading) return;
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${API}/api/auth/verify-reset-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.message ?? 'Code invalide.');
                setDigits(Array(6).fill(''));
                inputs.current[0]?.focus();
                return;
            }
            navigate('/reset-password', { state: { resetToken: data.resetToken } });
        } finally {
            setLoading(false);
        }
    }

    async function handleResend() {
        setError('');
        const res = await fetch(`${API}/api/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
        if (res.status === 429) {
            const data = await res.json();
            setWait(data.wait ?? 60);
            return;
        }
        setWait(60);
        setDigits(Array(6).fill(''));
        inputs.current[0]?.focus();
    }

    if (!email) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-5">
                <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-6 text-center space-y-4">
                    <p className="text-sm text-gray-500">Aucune adresse email fournie.</p>
                    <button onClick={() => navigate('/forgot-password')} className="font-semibold" style={{ color: '#0865FE' }}>
                        Recommencer la procédure
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-5 py-8">
            <div className="w-full max-w-md mb-4 flex justify-start">
                <button
                    type="button"
                    onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/forgot-password')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-700 hover:text-[#0865FE] hover:border-[#0865FE]/30 font-semibold text-xs shadow-xs hover:shadow-sm transition-all cursor-pointer"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Retour</span>
                </button>
            </div>
            <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-6 space-y-6 text-center">
        <div className="text-5xl">🔑</div>
    <div>
    <h1 className="text-2xl font-bold text-gray-900">Entrez le code</h1>
    <p className="text-sm text-gray-500 mt-2">
        Un code à 6 chiffres a été envoyé à<br />
    <span className="font-semibold text-gray-700">{email}</span>
        </p>
        </div>

        <div className="flex gap-2 justify-center">
        {digits.map((d, i) => (
                <input
                    key={i}
            ref={el => { if (el) inputs.current[i] = el; }}
    type="text"
    inputMode="numeric"
    maxLength={1}
    value={d}
    onChange={e => handleChange(i, e.target.value)}
    onKeyDown={e => handleKey(i, e)}
    onPaste={handlePaste}
    className="w-11 text-center text-xl font-bold rounded-xl border-2 outline-none transition-all"
    style={{ borderColor: error ? '#ef4444' : d ? '#0865FE' : '#e5e7eb', color: '#1a1440', height: '52px' }}
    />
))}
    </div>

    {error && <p className="text-sm text-red-500">{error}</p>}

        <button
        onClick={submit}
        disabled={code.length < 6 || loading}
        className="w-full h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-white disabled:opacity-50 transition-all"
        style={{ background: '#0865FE' }}
    >
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Vérification...</> : <><ArrowRight className="w-4 h-4" /> Confirmer</>}
        </button>

        <p className="text-sm text-gray-500">
            Vous n'avez pas reçu de code ?{' '}
            {wait > 0
                ? <span className="text-gray-400">Renvoyer dans {wait}s</span>
            : <button onClick={handleResend} className="font-semibold" style={{ color: '#0865FE' }}>Renvoyer</button>}
            </p>
            </div>
            </div>
            );
            };

            export default VerifyResetOtp;