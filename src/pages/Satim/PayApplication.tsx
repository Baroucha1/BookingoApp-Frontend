import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Loader2, Lock, Calendar, Users, Mail, Phone,
    Clock, ArrowLeft, CreditCard,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { initiateSatimPayment } from '@/service/payment.service';
import { setAppSession } from '@/lib/satimRedirect';
import AppLoading from '@/components/common/AppLoading';

declare global { interface Window { grecaptcha: any; } }

const formatAmount = (amount: number) => `${amount.toFixed(2)} DA`;
const formatDate   = (iso: string) => {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-');
    const months = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet',
        'Août','Septembre','Octobre','Novembre','Décembre'];
    return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
};

const API = import.meta.env.VITE_API_URL;

const PayApplication = () => {
    const { applicationId }   = useParams<{ applicationId: string }>();
    const navigate             = useNavigate();
    const { toast }            = useToast();
    const { user }             = useAuth();

    const [application, setApplication] = useState<any>(null);
    const [loading,     setLoading]     = useState(true);
    const [submitting,  setSubmitting]  = useState(false);
    const [termsAccepted,   setTermsAccepted]   = useState(false);
    const [captchaVerified, setCaptchaVerified] = useState(false);

    const recaptchaRef      = useRef<HTMLDivElement>(null);
    const recaptchaWidgetId = useRef<number | null>(null);
    const skipRecaptcha     = import.meta.env.VITE_SKIP_RECAPTCHA === 'true';

    // ── Load reCAPTCHA script ─────────────────────────────────────────────────
    useEffect(() => {
        if (skipRecaptcha) return;
        if (document.getElementById('recaptcha-script')) return;
        const script   = document.createElement('script');
        script.id      = 'recaptcha-script';
        script.src     = 'https://www.google.com/recaptcha/api.js?render=explicit';
        script.async   = true;
        script.defer   = true;
        document.head.appendChild(script);
    }, [skipRecaptcha]);

    useEffect(() => {
        if (skipRecaptcha) return;
        const tryRender = () => {
            if (!window.grecaptcha || !recaptchaRef.current) { setTimeout(tryRender, 300); return; }
            if (recaptchaWidgetId.current !== null) return;
            try {
                recaptchaWidgetId.current = window.grecaptcha.render(recaptchaRef.current, {
                    sitekey:            import.meta.env.VITE_RECAPTCHA_SITE_KEY,
                    callback:           () => setCaptchaVerified(true),
                    'expired-callback': () => setCaptchaVerified(false),
                });
            } catch (e) {
                console.warn('reCAPTCHA render notice:', e);
            }
        };
        if (!loading) setTimeout(tryRender, 300);
    }, [loading, skipRecaptcha]);

    // ── Fetch application ─────────────────────────────────────────────────────
    useEffect(() => {
        if (!applicationId || !user) return;
        const token = localStorage.getItem('token');
        fetch(`${API}/api/applications/${applicationId}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.json())
            .then(data => {
                if (data.status === 'success') setApplication(data.data);
                else throw new Error(data.message ?? 'Introuvable');
            })
            .catch(err => {
                toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
                navigate('/client/applications');
            })
            .finally(() => setLoading(false));
    }, [applicationId, user]);

    // ── Pay ───────────────────────────────────────────────────────────────────
    const handlePay = async () => {
        setSubmitting(true);
        try {
            let captchaToken = '';
            if (!skipRecaptcha) {
                if (window.grecaptcha?.getResponse) {
                    try {
                        captchaToken = recaptchaWidgetId.current !== null
                            ? window.grecaptcha.getResponse(recaptchaWidgetId.current)
                            : window.grecaptcha.getResponse();
                    } catch {
                        captchaToken = '';
                    }
                }
                if (!captchaToken) {
                    toast({ title: 'reCAPTCHA requis', description: 'Veuillez valider le reCAPTCHA avant de continuer.', variant: 'destructive' });
                    setSubmitting(false);
                    return;
                }
            }
            if (!applicationId) {
                throw new Error("Identifiant de la demande introuvable.");
            }
            const { formUrl } = await initiateSatimPayment(applicationId, captchaToken);
            setAppSession();
            window.location.href = formUrl;
        } catch (err: any) {
            const rawMsg = err?.message ?? '';
            const msg = (rawMsg && rawMsg !== 'null' && rawMsg !== '[object Object]')
                ? rawMsg
                : "Une erreur est survenue lors de l'initiation du paiement SATIM.";
            toast({ title: 'Erreur SATIM', description: msg, variant: 'destructive' });
            setSubmitting(false);
        }
    };

    // ── Loading ───────────────────────────────────────────────────────────────
    if (loading) return (
        <AppLoading message="Chargement de votre dossier de paiement..." />
    );

    if (!application) return null;

    const visa       = application.visaType;
    const country    = visa?.country;
    const total      = Number(visa?.price ?? 0) * (application.numberOfPeople ?? 1);
    const canPay     = termsAccepted && (skipRecaptcha || captchaVerified) && !submitting;

    return (
        <div
            className="min-h-screen pb-8"
            style={{
                background: '#F4F6FA',
                paddingTop: 'calc(env(safe-area-inset-top, 0px) + 2rem)',
            }}
        >
            <div className="max-w-2xl mx-auto px-4 space-y-4">

                {/* ── Back ── */}
                <button
                    onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/client/applications')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-700 hover:text-[#0865FE] hover:border-[#0865FE]/30 font-semibold text-xs shadow-xs hover:shadow-sm transition-all cursor-pointer"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Retour aux demandes</span>
                </button>

                {/* ── Recap card ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex">
                        <div className="w-1 shrink-0" style={{ background: '#0865FE' }} />
                        <div className="flex-1 p-5">

                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Résumé de la demande</h2>
                                    <p className="text-xs text-gray-400 mt-0.5">Vérifiez les informations avant paiement</p>
                                </div>
                            </div>

                            {/* Country + visa */}
                            <div className="flex items-center gap-3 mb-5">
                                {country && (
                                    <div className="w-12 h-12 rounded-full border-2 border-gray-100 shadow-sm overflow-hidden shrink-0">
                                        <img
                                            src={`https://flagcdn.com/w80/${country.code?.toLowerCase()}.png`}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                                <div>
                                    <p className="font-bold text-gray-900 text-base">{country?.nameFr}</p>
                                    <p className="text-sm text-gray-400">
                                        {visa?.nameFr} — {visa?.duration} jours
                                    </p>
                                </div>
                            </div>

                            {/* Info grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {[
                                    { icon: Users,    label: 'VOYAGEURS',   value: `${application.numberOfPeople}` },
                                    { icon: Calendar, label: 'DATE DÉPART', value: formatDate(application.startDate) },
                                    { icon: Clock,    label: 'DURÉE',       value: `${visa?.duration} jours` },
                                    { icon: Mail,     label: 'EMAIL',       value: application.email },
                                    { icon: Phone,    label: 'TÉLÉPHONE',   value: `+213 ${application.phone}` },
                                    { icon: Clock,    label: 'DÉLAI',       value: `${visa?.processingDelay} jours ouvrés`, green: true },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-100 bg-gray-50">
                                        <item.icon className="w-4 h-4 shrink-0 text-gray-400" />
                                        <div className="min-w-0">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{item.label}</p>
                                            <p className={`font-semibold text-sm truncate ${item.green ? 'text-green-600' : 'text-gray-800'}`}>
                                                {item.value}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Total */}
                            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-500">Total à payer</span>
                                <span className="text-2xl font-bold" style={{ color: '#FFB400' }}>
                                    {formatAmount(total)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Payment card ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#EFF6FF' }}>
                            <CreditCard className="w-5 h-5" style={{ color: '#0865FE' }} />
                        </div>
                        <div>
                            <p className="font-bold text-gray-900">CIB / EDAHABIA</p>
                            <p className="text-xs text-gray-400">Carte bancaire algérienne · SATIM I-PAY</p>
                        </div>
                        <img src="/dhahabiaCIB.png" alt="CIB" className="h-8 object-contain ml-auto" />
                    </div>

                    {/* Terms */}
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={termsAccepted}
                            onChange={e => setTermsAccepted(e.target.checked)}
                            className="mt-0.5 w-4 h-4 accent-blue-600 rounded"
                        />
                        <span className="text-sm text-gray-600">
                            J'accepte les{' '}
                            <span className="font-semibold underline cursor-pointer" style={{ color: '#0865FE' }}>
                                conditions d'utilisation
                            </span>
                            {' '}et les conditions générales de paiement en ligne
                        </span>
                    </label>

                    {/* reCAPTCHA */}
                    {!skipRecaptcha && (
                        <div className="flex justify-center">
                            <div ref={recaptchaRef} />
                        </div>
                    )}

                    {/* CTA */}
                    <div className="rounded-2xl p-5 flex items-center justify-between gap-4" style={{ background: '#0865FE' }}>
                        <div className="text-white">
                            <p className="text-xs opacity-75 font-medium">Montant total à payer</p>
                            <p className="text-3xl font-black mt-0.5">{formatAmount(total)}</p>
                            <p className="text-xs opacity-60 mt-1">
                                {application.numberOfPeople} voyageur(s) · {visa?.nameFr} · {visa?.duration} jours
                            </p>
                        </div>
                        <button
                            onClick={handlePay}
                            disabled={!canPay}
                            className="flex items-center gap-2 bg-white rounded-xl px-5 py-3 shrink-0 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg font-bold"
                            style={{ color: '#0865FE' }}>
                            {submitting
                                ? <Loader2 className="w-5 h-5 animate-spin" />
                                : <img src="/logoCIB1.png" alt="CIB" className="h-6 object-contain" />}
                            <span>{submitting ? 'Redirection...' : 'Valider et payer'}</span>
                            {!submitting && <Lock className="w-3.5 h-3.5 opacity-60" />}
                        </button>
                    </div>

                    <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Paiement 100% sécurisé · SSL · SATIM certifié</span>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default PayApplication;