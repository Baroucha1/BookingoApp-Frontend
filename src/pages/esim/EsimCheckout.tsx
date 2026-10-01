import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    ArrowLeft, Mail, Phone, MessageCircle, BookOpen,
    CheckCircle, XCircle, ChevronRight, Calendar, Tag, User, Database, Loader2, X
} from 'lucide-react';
import { formatBytes } from '@/service/esim.service';
import { initiateEsimSatimPayment } from '@/service/payment.service';
import { useAuth } from '@/hooks/useAuth';

type DeliveryMethod = 'email' | 'whatsapp' | 'sms';

const COUNTRY_CODES = [
    { code: '+213', label: 'DZ +213' },
    { code: '+33',  label: 'FR +33'  },
    { code: '+1',   label: 'US +1'   },
    { code: '+44',  label: 'GB +44'  },
    { code: '+212', label: 'MA +212' },
    { code: '+216', label: 'TN +216' },
];

const GUIDE_URL = 'https://go.getgosim.com/guide';

const EsimCheckout = () => {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const { user } = useAuth();

    const pkgId    = Number(params.get('pkg'));
    const locCode  = params.get('loc')      ?? '';
    const locName  = params.get('name')     ?? '';
    const volume   = Number(params.get('volume'));
    const duration = Number(params.get('duration'));
    const price    = Number(params.get('price'));
    const cover    = params.get('cover')    ?? '';

    const [name,        setName]        = useState('');
    const [email,       setEmail]       = useState(user?.email ?? '');
    const [delivery,    setDelivery]    = useState<DeliveryMethod>('email');
    const [phone,       setPhone]       = useState('');
    const [countryCode, setCountryCode] = useState('+213');
    const [loading,     setLoading]     = useState(false);
    const [error,       setError]       = useState('');
    const [compatible,  setCompatible]  = useState<boolean | null>(null);

    // ── SATIM / reCAPTCHA / conditions — same rules as flights ────────────────
    const [termsAccepted,   setTermsAccepted]   = useState(false);
    const [showConditions,  setShowConditions]  = useState(false);
    const [captchaVerified, setCaptchaVerified] = useState(false);
    const recaptchaRef       = useRef<HTMLDivElement>(null);
    const recaptchaWidgetId  = useRef<number | null>(null);
    const skipRecaptcha      = import.meta.env.VITE_SKIP_RECAPTCHA === 'true';

    const needsPhone = delivery === 'whatsapp' || delivery === 'sms';

    useEffect(() => {
        if (document.getElementById('recaptcha-script')) return;
        const script = document.createElement('script');
        script.id = 'recaptcha-script';
        script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
        script.async = true;
        document.head.appendChild(script);
    }, []);

    useEffect(() => {
        if (skipRecaptcha) return;
        const tryRender = () => {
            if (!window.grecaptcha || !recaptchaRef.current) { setTimeout(tryRender, 300); return; }
            if (recaptchaWidgetId.current !== null) return;
            recaptchaWidgetId.current = window.grecaptcha.render(recaptchaRef.current, {
                sitekey: import.meta.env.VITE_RECAPTCHA_SITE_KEY,
                callback: () => setCaptchaVerified(true),
                'expired-callback': () => setCaptchaVerified(false),
            });
        };
        tryRender();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;
        setError('');
        setLoading(true);
        try {
            let captchaToken = '';
            if (!skipRecaptcha) {
                captchaToken = window.grecaptcha.getResponse(recaptchaWidgetId.current);
                if (!captchaToken) {
                    setError('Veuillez valider le reCAPTCHA.');
                    setLoading(false);
                    return;
                }
            }

            const fullPhone = needsPhone ? `${countryCode}${phone}` : undefined;
            const payload = {
                package:      pkgId,
                days:         duration,
                currency:     'DZD',
                email,
                name,
                phone:        fullPhone,
                delivery: {
                    name,
                    email,
                    ...(delivery === 'whatsapp' ? { whatsapp: fullPhone } : {}),
                    ...(delivery === 'sms'      ? { phone:    fullPhone } : {}),
                },
                locationCode: locCode,
                locationName: locName,
                volumeBytes:  volume,
                price,
                clientId:     user?.id ?? null,
                captchaToken,
            };

            const { formUrl } = await initiateEsimSatimPayment(payload);
            window.location.href = formUrl;
        } catch (err: unknown) {
            const e = err as { message?: string };
            setError(e.message ?? 'Une erreur est survenue');
            if (!skipRecaptcha && recaptchaWidgetId.current !== null && window.grecaptcha) {
                window.grecaptcha.reset(recaptchaWidgetId.current);
                setCaptchaVerified(false);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen pt-16 pb-8 bg-[#ebf3fc] bg-[url('/checkout-bg.webp')] bg-cover bg-center bg-fixed">
            <div className="max-w-lg mx-auto px-4">

                <button onClick={() => navigate('/esim')} className="flex items-center gap-2 text-gray-700 bg-white/80 backdrop-blur px-3 py-1.5 rounded-full hover:bg-white mb-4 transition-colors shadow-sm text-sm font-medium">
                    <ArrowLeft className="w-4 h-4" />
                    Retour
                </button>

                {/* Récap forfait */}
                <div className="bg-white rounded-3xl p-5 mb-4 shadow-xl border border-white/20">
                    <div className="flex items-center gap-4 mb-5">
                        <div className="w-20 h-20 rounded-2xl shrink-0 border border-gray-100 overflow-hidden shadow-sm bg-gray-100 relative">
                            {cover ? (
                                <img src={cover} alt={locName} className="w-full h-full object-cover" />
                            ) : (
                                <div className="absolute inset-0 bg-[url('/assets/dotted-map.svg')] bg-cover opacity-20 bg-blue-50" />
                            )}
                        </div>
                        <div>
                            <h2 className="text-2xl font-extrabold text-[#0a192f]">{locName}</h2>
                            <p className="text-sm text-gray-500 font-medium mt-0.5">eSIM de voyage</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div className="flex items-center gap-2 bg-blue-50/50 rounded-xl p-3">
                            <div className="bg-white p-1.5 rounded-lg shadow-sm text-blue-600 shrink-0">
                                <Database className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500 font-semibold mb-0.5">Volume</p>
                                <p className="text-sm font-bold text-gray-900">{formatBytes(volume)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 bg-blue-50/50 rounded-xl p-3">
                            <div className="bg-white p-1.5 rounded-lg shadow-sm text-blue-600 shrink-0">
                                <Calendar className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500 font-semibold mb-0.5">Durée</p>
                                <p className="text-sm font-bold text-gray-900">{duration} jours</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 bg-blue-50/50 rounded-xl p-3">
                            <div className="bg-white p-1.5 rounded-lg shadow-sm text-blue-600 shrink-0">
                                <Tag className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500 font-semibold mb-0.5">Prix</p>
                                <p className="text-sm font-bold text-blue-600">{price.toLocaleString()} DZD</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Guide eSIM */}
                <a href={GUIDE_URL} target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-[#f2f7ff] rounded-2xl p-4 mb-4 hover:bg-blue-50 transition-colors shadow-sm border border-blue-100 group">
                    <div className="bg-blue-600 p-2.5 rounded-lg shrink-0 text-white shadow-sm">
                        <BookOpen className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <p className="font-bold text-blue-900 text-sm">Guide installation eSIM</p>
                        <p className="text-xs text-blue-600/80 font-medium">Comment installer et activer votre eSIM</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
                </a>

                {/* Compatibilité */}
                <div className="bg-white rounded-3xl p-5 mb-4 shadow-xl border border-white/20">
                    <p className="font-bold text-[#0a192f] text-sm mb-3">Mon téléphone est-il compatible eSIM ?</p>
                    <div className="grid grid-cols-2 gap-3 mb-1">
                        <button type="button" onClick={() => setCompatible(true)} className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-semibold transition-colors ${compatible === true ? 'border-green-500 text-green-700 bg-green-50' : 'border-gray-100 text-gray-600 hover:border-gray-200 hover:bg-gray-50'}`}>
                            <CheckCircle className="w-4 h-4" />
                            Oui, compatible
                        </button>
                        <button type="button" onClick={() => setCompatible(false)} className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-semibold transition-colors ${compatible === false ? 'border-orange-400 text-orange-600 bg-orange-50' : 'border-gray-100 text-gray-600 hover:border-gray-200 hover:bg-gray-50'}`}>
                            <XCircle className="w-4 h-4" />
                            Je ne sais pas
                        </button>
                    </div>

                    {compatible === true && (
                        <div className="mt-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-xs text-green-700">
                            Parfait ! Vous pouvez procéder à l'achat.
                        </div>
                    )}

                    {compatible === false && (
                        <div className="mt-3 bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 text-xs text-orange-800">
                            Vérifiez la compatibilité avant d'acheter.{' '}
                            <a href={GUIDE_URL} target="_blank" rel="noreferrer" className="font-bold underline">Consulter le guide</a>
                        </div>
                    )}
                </div>

                {/* Formulaire */}
                <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-5 shadow-xl border border-white/20 space-y-4">

                    <div className="flex items-center gap-2 mb-1">
                        <div className="bg-blue-50 p-2 rounded-full text-blue-600">
                            <User className="w-4 h-4" />
                        </div>
                        <h2 className="font-bold text-[#0a192f] text-lg">Vos informations</h2>
                    </div>

                    {user && (
                        <div className="bg-green-50 border border-green-200 text-green-700 text-xs rounded-lg px-3 py-2.5 flex items-center gap-2 font-medium">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            Commande liée à votre compte
                        </div>
                    )}

                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-[#0a192f] mb-1">Nom complet</label>
                            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Prénom Nom" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow" />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-[#0a192f] mb-1">Email</label>
                            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@email.com" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow" />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-[#0a192f] mb-1.5">Livraison de l'eSIM</label>
                            <div className="grid grid-cols-3 gap-2">
                                {([
                                    { value: 'email',    label: 'Email',    icon: <Mail className="w-4 h-4" /> },
                                    { value: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle className="w-4 h-4" /> },
                                    { value: 'sms',      label: 'SMS',      icon: <Phone className="w-4 h-4" /> },
                                ] as const).map((opt) => (
                                    <button key={opt.value} type="button" onClick={() => setDelivery(opt.value)} className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 text-xs font-semibold transition-colors ${delivery === opt.value ? (opt.value === 'whatsapp' ? 'border-green-500 bg-green-50 text-green-700' : 'border-blue-500 bg-blue-50 text-blue-700') : 'border-gray-100 text-gray-500 hover:border-gray-200 hover:bg-gray-50'}`}>
                                        {opt.icon}{opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {delivery === 'whatsapp' && (
                            <div className="bg-[#eefcf3] border border-green-200 rounded-xl p-3 flex gap-3 items-center">
                                <div className="bg-green-100 text-green-600 p-1.5 rounded-full shrink-0">
                                    <MessageCircle className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-xs text-green-800">Vous allez recevoir l'eSIM sur WhatsApp</p>
                                    <p className="text-[11px] text-green-700/80 font-medium">Assurez-vous d'entrer un numéro correct.</p>
                                </div>
                            </div>
                        )}

                        {needsPhone && (
                            <div>
                                <label className="block text-xs font-medium text-[#0a192f] mb-1">Numéro de téléphone</label>
                                <div className="flex gap-2">
                                    <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)} className="w-28 border border-gray-200 rounded-xl px-2 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white">
                                        {COUNTRY_CODES.map((c) => (
                                            <option key={c.code} value={c.code}>{c.label}</option>
                                        ))}
                                    </select>
                                    <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="5XXXXXXXX" pattern="[567][0-9]{8}" maxLength={9} className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Paiement SATIM — mêmes règles que le flow vols ── */}
                    <div className="pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-2 mb-3 mt-3">
                            <img src="/dhahabiaCIB.png" alt="CIB EDAHABIA" className="h-6 object-contain" />
                            <div>
                                <p className="font-semibold text-xs text-[#0a192f]">CIB / EDAHABIA</p>
                                <p className="text-[11px] text-muted-foreground">Paiement sécurisé · SATIM</p>
                            </div>
                        </div>

                        <label className="flex items-start gap-2 cursor-pointer mb-3">
                            <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)}
                                   className="mt-0.5 w-4 h-4 accent-blue-600 cursor-pointer" />
                            <span className="text-xs text-gray-700">
                                J'accepte les{' '}
                                <button type="button" onClick={() => setShowConditions(true)}
                                        className="text-blue-600 underline hover:text-blue-700 font-medium">
                                    conditions d'utilisation
                                </button>
                            </span>
                        </label>

                        {!skipRecaptcha && (
                            <div className="flex justify-center mb-3">
                                <div ref={recaptchaRef} />
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-medium rounded-lg px-4 py-3 mt-3">
                            {error}
                        </div>
                    )}

                    <div className="pt-2 space-y-2.5">
                        <button
                            type="submit"
                            disabled={loading || compatible === false || !termsAccepted || (!skipRecaptcha && !captchaVerified)}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-base font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {loading ? 'Redirection...' : `Payer — ${price.toLocaleString()} DZD`}
                        </button>

                        <a href="https://api.whatsapp.com/send/?phone=213555571225&text=Bonjour%2C+j%27ai+une+question+sur+mon+eSIM.&type=phone_number&app_absent=0" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full border border-green-200 bg-[#eefcf3] hover:bg-green-100 text-green-700 font-bold py-3 rounded-xl transition-colors text-xs">
                            <MessageCircle className="w-4 h-4" />
                            Besoin d'aide ? Contactez-nous
                        </a>
                    </div>

                </form>
            </div>

            {showConditions && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold">Conditions d'utilisation</h2>
                            <button onClick={() => setShowConditions(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="text-sm text-gray-600 leading-relaxed space-y-3 max-h-80 overflow-y-auto">
                            <p>En procédant à ce paiement, vous acceptez nos conditions d'utilisation et les conditions générales de paiement en ligne établies par notre partenaire bancaire (CIB / EDAHABIA).</p>
                            <p>Le montant est traité de manière sécurisée via <strong>SATIM I-PAY</strong>. Les paiements ne sont pas remboursables sauf dans les cas prévus par notre politique de remboursement.</p>
                            <p>Pour tout problème de paiement, contactez le numéro gratuit SATIM <strong>3020</strong>.</p>
                        </div>
                        <div className="flex justify-end">
                            <button onClick={() => { setTermsAccepted(true); setShowConditions(false); }}
                                    className="text-white rounded-full px-5 py-2 font-semibold" style={{ background: 'linear-gradient(135deg, #0865FE, #3B2F7E)' }}>
                                J'accepte
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EsimCheckout;