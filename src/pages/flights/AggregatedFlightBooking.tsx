import { useMemo, useRef, useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Briefcase, Check, Loader2, Truck, X } from 'lucide-react';
import BookingStepper from '@/components/flights/BookingStepper';
import FlightSummaryCard from '@/components/flights/FlightSummaryCard';
import PassengerForm from '@/components/flights/PassengerForm';
import { Button } from '@/components/ui/button';
import {isDomesticAlgeria, PassengerFormData} from '@/context/FlightContext';
import { useToast } from '@/hooks/use-toast';
import {bookFlight, orderReserve} from '@/service/flights_aggregator/book.service';
import {OrderReserveResult, type PassengerInput} from '@/service/flights_aggregator/aggregatedTypes.ts';
import { normalizeAggregatedOffer, type DisplayOffer } from '@/service/flights_aggregator/aggregatedNormalize';
import { repriceFlight } from '@/service/flights_aggregator/aggregatedSearch.service';
import { initiateFlightSatimPayment } from '@/service/payment.service';
import { useAuth } from '@/hooks/useAuth';
import AppLoading from '@/components/common/AppLoading';

const emptyPassenger = (type: 'ADT' | 'CHD' | 'INF'): PassengerFormData => ({
    paxType: type,
    passengerTitle: '',
    firstName: '',
    lastName: '',
    birthday: '',
    sexe: '',
    typeDoc: 'P',
    passportNumber: '',
    expiryDate: '',
    nationality: 'DZ',
    mail: '',
    tel: '',
});
function calculateAge(birthday: string, referenceDate: string): number {
    const birth = new Date(birthday);
    const ref = new Date(referenceDate);
    let age = ref.getFullYear() - birth.getFullYear();
    const monthDiff = ref.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && ref.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

function validatePassenger(
    p: PassengerFormData,
    isFirst: boolean,
    requireDocument: boolean,
    travelDate: string,
): Record<string, string> {
    const errors: Record<string, string> = {};
    if (!p.passengerTitle) errors.passengerTitle = 'Requis';
    if (!p.firstName.trim()) errors.firstName = 'Requis';
    if (!p.lastName.trim()) errors.lastName = 'Requis';

    if (!p.birthday) {
        errors.birthday = 'Requis';
    } else {
        const age = calculateAge(p.birthday, travelDate);
        if (p.paxType === 'ADT' && age < 12) {
            errors.birthday = 'Un adulte doit avoir 12 ans ou plus à la date du vol';
        } else if (p.paxType === 'CHD' && (age < 2 || age >= 12)) {
            errors.birthday = 'Un enfant doit avoir entre 2 et 11 ans à la date du vol';
        } else if (p.paxType === 'INF' && age >= 2) {
            errors.birthday = 'Un bébé doit avoir moins de 2 ans à la date du vol';
        }
    }

    if (!p.sexe) errors.sexe = 'Requis';
    if (requireDocument) {
        if (!p.passportNumber.trim()) errors.passportNumber = 'Requis';
        if (!p.expiryDate) errors.expiryDate = 'Requis';
    }
    if (!p.nationality.trim()) errors.nationality = 'Requis';

    if (isFirst) {
        if (!p.mail?.trim()) errors.mail = 'Requis';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.mail)) errors.mail = 'Email invalide';
        if (!p.tel?.trim()) errors.tel = 'Requis';
        else if (!/^(\+213|0)[567]\d{8}$/.test(p.tel)) errors.tel = 'Format: +213XXXXXXXXX';
    }
    return errors;
}

function toBookingPassengers(passengers: PassengerFormData[]): PassengerInput[] {
    return passengers.map((p) => ({
        paxType: p.paxType,
        passengerTitle: p.passengerTitle,
        firstName: p.firstName,
        lastName: p.lastName,
        birthday: p.birthday,
        sexe: p.sexe,
        nationality: p.nationality,
        typeDoc: p.typeDoc,
        passportNumber: p.passportNumber,
        expiryDate: p.expiryDate,
        mail: p.mail,
        tel: p.tel,
    }));
}

export default function AggregatedFlightBooking() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { toast } = useToast();
    const { user } = useAuth();

    const [directOffer, setDirectOffer] = useState<DisplayOffer | null>(null);
    const [loadingDirectOffer, setLoadingDirectOffer] = useState(false);
    const [directOfferError, setDirectOfferError] = useState<string | null>(null);

    const state = location.state as { offer?: DisplayOffer; searchParams?: any } | null;
    const [restoredState] = useState(() => {
        if (state?.offer) return state;
        const stored = sessionStorage.getItem('pendingFlightBooking');
        if (!stored) return null;
        try {
            return JSON.parse(stored);
        } catch {
            return null;
        }
    });
    const offer = directOffer ?? restoredState?.offer ?? null;

    const [step, setStep] = useState<2 | 4>(2);
    const [passengers, setPassengers] = useState<PassengerFormData[]>(() => {
        const counts = state?.searchParams ?? { adults: 1, children: 0, infants: 0 };
        const pax: PassengerFormData[] = [];
        for (let i = 0; i < (counts.adults ?? 1); i++) {
            const p = emptyPassenger('ADT');
            pax.push(p);
        }
        for (let i = 0; i < (counts.children ?? 0); i++) pax.push(emptyPassenger('CHD'));
        for (let i = 0; i < (counts.infants ?? 0); i++) pax.push(emptyPassenger('INF'));
        return pax;
    });

    const fareSourceCodeParam = searchParams.get('fareSourceCode') || searchParams.get('code');
    useEffect(() => {
        if (offer || !fareSourceCodeParam) return;
        setLoadingDirectOffer(true);
        setDirectOfferError(null);
        repriceFlight(fareSourceCodeParam)
            .then((raw) => {
                const normalized = normalizeAggregatedOffer(raw);
                setDirectOffer(normalized);
                const adults = parseInt(searchParams.get('adults') || '1', 10);
                const children = parseInt(searchParams.get('children') || '0', 10);
                const infants = parseInt(searchParams.get('infants') || '0', 10);
                const pax: PassengerFormData[] = [];
                for (let i = 0; i < adults; i++) pax.push(emptyPassenger('ADT'));
                for (let i = 0; i < children; i++) pax.push(emptyPassenger('CHD'));
                for (let i = 0; i < infants; i++) pax.push(emptyPassenger('INF'));
                setPassengers(pax);
            })
            .catch((err: any) => {
                console.error("Direct flight link error:", err);
                setDirectOfferError(err?.message || "Impossible de charger le vol depuis ce lien.");
            })
            .finally(() => {
                setLoadingDirectOffer(false);
            });
    }, [fareSourceCodeParam]);

    const [errors, setErrors] = useState<Record<number, Record<string, string>>>({});
    const [booking, setBooking] = useState(false);
    const [bookingResult, setBookingResult] = useState<any>(null);
    const [bookingError, setBookingError] = useState<string | null>(null);

    const [paymentMethod, setPaymentMethod] = useState<'satim' | 'agence' | 'delivery'>('satim');
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [showConditions, setShowConditions] = useState(false);
    const [captchaVerified, setCaptchaVerified] = useState(false);
    const recaptchaRef = useRef<HTMLDivElement>(null);
    const recaptchaWidgetId = useRef<number | null>(null);
    const [reserveInfo, setReserveInfo] = useState<OrderReserveResult | null>(null);
    const skipRecaptcha = import.meta.env.VITE_SKIP_RECAPTCHA === 'true';
    const [offices, setOffices] = useState<Array<{ id: string; name: string; wilaya: string; subtitle?: string | null }>>([]);
    const [selectedOfficeId, setSelectedOfficeId] = useState('');
    const [deliveryDetails, setDeliveryDetails] = useState({ address: '', wilaya: '', city: '', phone: '' });

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL ?? ''}/api/contact/offices`)
            .then(async (res) => {
                if (!res.ok) return;
                const data = await res.json();
                setOffices(Array.isArray(data) ? data : (data.offices || []));
            })
            .catch((error) => console.error('[AggregatedFlightBooking] offices:', error));
    }, []);

    // Auto-fill account info if logged in
    useEffect(() => {
        if (!user) return;
        setPassengers(prev => {
            if (prev.length === 0) return prev;
            const first = prev[0];
            if (first.firstName && first.lastName && first.mail) return prev;
            const updated = [...prev];
            updated[0] = {
                ...first,
                firstName: first.firstName || user.name || '',
                lastName: first.lastName || user.lastName || '',
                mail: first.mail || user.email || '',
                tel: first.tel || user.phone || '',
            };
            return updated;
        });
    }, [user]);

    useEffect(() => {
        if (offer) {
            sessionStorage.removeItem('pendingFlightBooking');
        }
    }, [offer]);

    const isDomestic = offer ? isDomesticAlgeria(offer) : false;
    const travelDate = offer?.legs?.[0]?.segments?.[0]?.departure?.dateTime || offer?.departureDate || new Date().toISOString();

    const passengerCounts = {
        adults: state?.searchParams?.adults ?? (passengers.filter(p => p.paxType === 'ADT').length || 1),
        children: state?.searchParams?.children ?? passengers.filter(p => p.paxType === 'CHD').length,
        infants: state?.searchParams?.infants ?? passengers.filter(p => p.paxType === 'INF').length,
    };

    const validatePassengers = () => {
        const newErrors: Record<number, Record<string, string>> = {};
        let hasError = false;
        passengers.forEach((p, i) => {
            const errs = validatePassenger(p, i === 0, !isDomestic, travelDate);
            if (Object.keys(errs).length > 0) { newErrors[i] = errs; hasError = true; }
        });
        if (hasError) {
            setErrors(newErrors);
            toast({ title: 'Formulaire incomplet', description: 'Veuillez vérifier les champs signalés en rouge.', variant: 'destructive' });
            return false;
        }
        setErrors({});
        return true;
    };

    useEffect(() => {
        if (document.getElementById('recaptcha-script')) return;
        const script = document.createElement('script');
        script.id = 'recaptcha-script';
        script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
        script.async = true;
        document.head.appendChild(script);
    }, []);

    useEffect(() => {
        if (step !== 2 || paymentMethod !== 'satim' || skipRecaptcha) return;
        let isMounted = true;

        const tryRender = () => {
            if (!isMounted) return;
            const grecaptcha = window.grecaptcha;
            if (!grecaptcha || typeof grecaptcha.render !== 'function' || !recaptchaRef.current) {
                setTimeout(tryRender, 300);
                return;
            }
            if (recaptchaWidgetId.current !== null) return;
            try {
                if (typeof grecaptcha.ready === 'function') {
                    grecaptcha.ready(() => {
                        if (!isMounted || !recaptchaRef.current || recaptchaWidgetId.current !== null) return;
                        recaptchaWidgetId.current = grecaptcha.render(recaptchaRef.current, {
                            sitekey: import.meta.env.VITE_RECAPTCHA_SITE_KEY,
                            callback: () => setCaptchaVerified(true),
                            'expired-callback': () => setCaptchaVerified(false),
                        });
                    });
                } else {
                    recaptchaWidgetId.current = grecaptcha.render(recaptchaRef.current, {
                        sitekey: import.meta.env.VITE_RECAPTCHA_SITE_KEY,
                        callback: () => setCaptchaVerified(true),
                        'expired-callback': () => setCaptchaVerified(false),
                    });
                }
            } catch (err) {
                console.warn('reCAPTCHA render error:', err);
            }
        };

        tryRender();

        return () => {
            isMounted = false;
        };
    }, [step, paymentMethod]);

    useEffect(() => {
        setCaptchaVerified(false);
        if (recaptchaWidgetId.current !== null && window.grecaptcha && typeof window.grecaptcha.reset === 'function') {
            try {
                window.grecaptcha.reset(recaptchaWidgetId.current);
            } catch (e) { }
            recaptchaWidgetId.current = null;
        }
    }, [paymentMethod]);

    const handlePaySatim = async () => {
        if (!validatePassengers()) return;

        setBooking(true);
        setBookingError(null);
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
                    setBooking(false);
                    return;
                }
            }

            const result = await bookFlight(offer.fareSourceCode!, toBookingPassengers(passengers), offer.price, 'satim');

            const resolvedData = (result as any)?.data && typeof (result as any).data === 'object'
                ? { ...(result as any).data, ...result }
                : result;

            const bookingId =
                resolvedData?.dbId ||
                resolvedData?.id ||
                resolvedData?.bookingId ||
                resolvedData?._id ||
                resolvedData?.flightBookingId ||
                (result as any)?.dbId ||
                (result as any)?.id ||
                (result as any)?.bookingId ||
                (result as any)?.data?.id ||
                (result as any)?.data?._id ||
                (result as any)?.data?.dbId;

            if (!bookingId) {
                console.error("Book flight response missing booking ID:", result);
                throw new Error("Identifiant de réservation introuvable.");
            }
            setBookingResult({
                ...resolvedData,
                dbId: bookingId,
                id: bookingId,
            });
            const { formUrl } = await initiateFlightSatimPayment(bookingId, captchaToken);
            window.location.href = formUrl;
        } catch (err: any) {
            const rawMsg = err?.message ?? '';
            const detail = (rawMsg && rawMsg !== 'null' && rawMsg !== '[object Object]')
                ? rawMsg
                : 'Erreur lors de la réservation ou du paiement.';
            setBookingError(detail);
            toast({ title: 'Réservation échouée', description: detail, variant: 'destructive' });
        } finally {
            setBooking(false);
        }
    };

    const handlePayOffline = async () => {
        if (!validatePassengers()) return;

        if (paymentMethod === 'agence' && !selectedOfficeId) {
            toast({ title: 'Agence requise', description: 'Veuillez sélectionner une agence pour le paiement.', variant: 'destructive' });
            return;
        }

        if (paymentMethod === 'delivery' && !Object.values(deliveryDetails).every((value) => value.trim())) {
            toast({ title: 'Adresse de livraison requise', description: 'Veuillez renseigner l’adresse, la wilaya, la ville et le téléphone.', variant: 'destructive' });
            return;
        }

        setBooking(true);
        setBookingError(null);
        try {
            const result = await bookFlight(
                offer.fareSourceCode!,
                toBookingPassengers(passengers),
                offer.price,
                paymentMethod === 'delivery' ? 'delivery' : 'agence',
                paymentMethod === 'agence' ? selectedOfficeId : undefined,
                paymentMethod === 'delivery' ? deliveryDetails : undefined,
            );
            const resolvedData = (result as any)?.data && typeof (result as any).data === 'object'
                ? { ...(result as any).data, ...result }
                : result;

            const bookingId =
                resolvedData?.dbId ||
                resolvedData?.id ||
                resolvedData?.bookingId ||
                resolvedData?._id ||
                resolvedData?.flightBookingId ||
                (result as any)?.dbId ||
                (result as any)?.id ||
                (result as any)?.bookingId ||
                (result as any)?.data?.id ||
                (result as any)?.data?._id ||
                (result as any)?.data?.dbId;

            const normalizedResult = {
                ...resolvedData,
                dbId: bookingId,
                id: bookingId,
            };
            setBookingResult(normalizedResult);

            if (offer.fareSourceCode?.startsWith('TK_NDC:')) {
                try {
                    if (bookingId) {
                        const reserved = await orderReserve(bookingId);
                        setReserveInfo((reserved as any)?.data ?? reserved);
                    }
                } catch (reserveErr: any) {
                    toast({
                        title: 'Réservation créée, mais délai de paiement non prolongé',
                        description: 'Le paiement doit être effectué rapidement (délai réduit).',
                        variant: 'destructive',
                    });
                }
            }

            setStep(4);
            toast({
                title: 'Réservation confirmée',
                description: paymentMethod === 'delivery'
                    ? 'Vous serez contacté pour organiser la livraison.'
                    : 'Paiement à régler en agence.',
            });
        } catch (err: any) {
            const detail = err?.message ?? 'Erreur lors de la réservation.';
            setBookingError(detail);
            toast({ title: 'Réservation échouée', description: detail, variant: 'destructive' });
        } finally {
            setBooking(false);
        }
    };

    if (loadingDirectOffer) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#DFECFF] via-[#F0F6FF] to-[#DFECFF]">
                <AppLoading message="Chargement de votre vol..." subMessage="Récupération des détails de l'offre en direct..." />
            </div>
        );
    }

    if (!offer) {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{ background: 'linear-gradient(160deg, #08082e 0%, #0a1550 35%, #0865FE 100%)' }}
            >
                <div className="text-white/80 text-center max-w-md px-4">
                    <p className="font-semibold text-lg">{directOfferError || "Aucun vol sélectionné."}</p>
                    <p className="text-sm text-white/60 mt-1">Le lien a peut-être expiré ou les places ne sont plus disponibles.</p>
                    <Button onClick={() => navigate('/flights')} className="mt-4 bg-[#0865FE] hover:bg-[#0865FE]/90 text-white font-semibold">
                        Rechercher un vol
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#DFECFF] via-[#F0F6FF] to-[#DFECFF]">
            {booking && (
                <AppLoading
                    message="Réservation de votre vol en cours..."
                    subMessage="Traitement de votre commande, veuillez patienter..."
                />
            )}
            <div
                className="max-w-6xl mx-auto px-4 pb-16"
                style={{
                    paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)',
                }}
            >
                {step < 4 && (
                    <button
                        onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/flights')}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-700 hover:text-[#0865FE] hover:border-[#0865FE]/30 font-semibold text-xs shadow-xs hover:shadow-sm mb-6 transition-all cursor-pointer"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Retour aux résultats</span>
                    </button>
                )}

                <div className="mb-8">
                    <BookingStepper current={step} />
                </div>

                <div className="space-y-6">
                    {step === 2 && (
                        <div className="space-y-6">
                            {/* Row 1: flight details + price summary */}
                            <div className="grid lg:grid-cols-[1fr,340px] gap-6 items-start">
                                <div className="space-y-3 bg-white p-4 rounded-sm">
                                    <h2 className="text-[#2E3ECD] text-lg font-bold uppercase tracking-wide">
                                        Détails du vol <span className="text-slate-400 font-normal normal-case text-sm">| Vérifiez votre itinéraire et les détails du tarif</span>
                                    </h2>
                                    <FlightSummaryCard offer={offer} passengers={passengerCounts} />
                                </div>

                                <div className="space-y-4">
                                    <div className="p-5 rounded-2xl bg-white shadow-sm space-y-4">
                                        <h3 className="text-[#0865FE] text-sm font-bold uppercase tracking-wide">Résumé du prix</h3>

                                        <div className="text-sm">
                                            <p className="text-slate-400 mb-1">Passagers</p>
                                            <p className="text-[#0B0F2E] font-medium">
                                                {passengers.length} Passager{passengers.length > 1 ? 's' : ''}
                                            </p>
                                        </div>

                                        <div className="pt-3 border-t border-blue-100 flex items-center justify-between">
                                            <span className="text-slate-500 font-medium text-sm">Total</span>
                                            <span className="text-xl font-bold text-[#0865FE]">
                            {offer.price.toLocaleString('fr-FR')} {offer.currency}
                        </span>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs leading-relaxed">
                                        Les prix peuvent augmenter jusqu'à la finalisation de la réservation.
                                    </div>
                                </div>
                            </div>

                            {/* Row 2: passenger info + payment method */}
                            <div className="grid lg:grid-cols-[1fr,340px] gap-6 items-start">
                                <div className="space-y-4 bg-white p-4 rounded-sm">
                                    <h2 className="text-[#0B0F2E] text-lg font-bold">Informations passagers</h2>
                                    <p className="text-slate-400 text-sm -mt-2">
                                        Les noms doivent correspondre exactement au document de voyage.
                                    </p>
                                    {passengers.map((p, i) => (
                                        <PassengerForm
                                            key={i}
                                            index={i}
                                            data={p}
                                            travelDate={travelDate}
                                            showContactFields={i === 0}
                                            errors={errors[i] ?? {}}
                                            onChange={(updated) => {
                                                setPassengers((prev) => {
                                                    const next = [...prev];
                                                    next[i] = updated;
                                                    return next;
                                                });
                                            }}
                                            requireDocument={!isDomestic}
                                        />
                                    ))}
                                </div>

                                <div className="space-y-4">
                                    <div className="p-5 rounded-2xl bg-white shadow-sm space-y-4">
                                        <h3 className="text-[#0865FE] text-sm font-bold uppercase tracking-wide">Mode de paiement</h3>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                            <button type="button" onClick={() => setPaymentMethod('satim')}
                                                    className="relative rounded-xl border-2 p-3 text-left transition-all duration-200"
                                                    style={{ borderColor: paymentMethod === 'satim' ? '#0865FE' : '#e5e7eb', background: paymentMethod === 'satim' ? 'rgba(8,101,254,0.04)' : '#fff' }}>
                                                {paymentMethod === 'satim' && (
                                                    <span className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#0865FE' }}>
                                    <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                                </span>
                                                )}
                                                <img src="/dhahabiaCIB.png" alt="CIB EDAHABIA" className="h-6 object-contain mb-1" />
                                                <p className="font-semibold text-xs">CIB / EDAHABIA</p>
                                                <p className="text-[11px] text-muted-foreground">Carte bancaire · SATIM</p>
                                            </button>

                                            <button type="button" onClick={() => setPaymentMethod('agence')}
                                                    className="relative rounded-xl border-2 p-3 text-left transition-all duration-200"
                                                    style={{ borderColor: paymentMethod === 'agence' ? '#0865FE' : '#e5e7eb', background: paymentMethod === 'agence' ? 'rgba(8,101,254,0.04)' : '#fff' }}>
                                                {paymentMethod === 'agence' && (
                                                    <span className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#0865FE' }}>
                                    <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                                </span>
                                                )}
                                                <div className="h-6 w-6 rounded-md flex items-center justify-center mb-1" style={{ background: 'linear-gradient(135deg, #0865FE, #3B2F7E)' }}>
                                                    <Briefcase className="w-3.5 h-3.5 text-white" />
                                                </div>
                                                <p className="font-semibold text-xs">Paiement en agence</p>
                                                <p className="text-[11px] text-muted-foreground">Espèces à l'agence</p>
                                            </button>

                                            <button type="button" onClick={() => setPaymentMethod('delivery')}
                                                    className="relative rounded-xl border-2 p-3 text-left transition-all duration-200"
                                                    style={{ borderColor: paymentMethod === 'delivery' ? '#0865FE' : '#e5e7eb', background: paymentMethod === 'delivery' ? 'rgba(8,101,254,0.04)' : '#fff' }}>
                                                {paymentMethod === 'delivery' && (
                                                    <span className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#0865FE' }}>
                                    <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                                </span>
                                                )}
                                                <div className="h-6 w-6 rounded-md flex items-center justify-center mb-1" style={{ background: 'linear-gradient(135deg, #0865FE, #3B2F7E)' }}>
                                                    <Truck className="w-3.5 h-3.5 text-white" />
                                                </div>
                                                <p className="font-semibold text-xs">Livraison à domicile</p>
                                                <p className="text-[11px] text-muted-foreground">Vous serez contacté pour la livraison</p>
                                            </button>
                                        </div>

                                        {paymentMethod === 'satim' && (
                                            <div className="space-y-3 pt-1">
                                                <label className="flex items-start gap-2 cursor-pointer">
                                                    <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)}
                                                           className="mt-0.5 w-4 h-4 accent-[#0865FE] cursor-pointer" />
                                                    <span className="text-xs text-gray-700">
                                    J'accepte les{' '}
                                                        <button type="button" onClick={() => setShowConditions(true)}
                                                                className="text-[#0865FE] underline hover:text-[#0865FE]/80 font-medium">
                                        conditions d'utilisation
                                    </button>
                                </span>
                                                </label>
                                                <div className="flex justify-center">
                                                    <div ref={recaptchaRef} />
                                                </div>
                                            </div>
                                        )}

                                        {paymentMethod === 'agence' && (
                                            <div className="min-w-0 w-full space-y-2 pt-1">
                                                <label htmlFor="booking-office" className="block text-xs leading-relaxed font-semibold text-[#0B0F2E]">
                                                    Choisissez l'agence où vous réglerez votre réservation
                                                </label>
                                                <select
                                                    id="booking-office"
                                                    value={selectedOfficeId}
                                                    onChange={(e) => setSelectedOfficeId(e.target.value)}
                                                    className="block box-border min-w-0 max-w-full w-full truncate rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 focus:border-[#0865FE] focus:outline-none focus:ring-2 focus:ring-[#0865FE]/20"
                                                >
                                                    <option value="">Sélectionnez une agence</option>
                                                    {offices.map((office) => (
                                                        <option key={office.id} value={office.id}>
                                                            {office.name} · {office.wilaya}
                                                        </option>
                                                    ))}
                                                </select>
                                                {!offices.length && (
                                                    <p className="text-xs text-amber-600">Chargement des agences...</p>
                                                )}
                                            </div>
                                        )}

                                        {paymentMethod === 'delivery' && (
                                            <div className="space-y-3 pt-1">
                                                <p className="text-xs font-semibold text-[#0B0F2E]">Adresse de livraison</p>
                                                <input
                                                    type="text"
                                                    autoComplete="street-address"
                                                    placeholder="Adresse complète"
                                                    value={deliveryDetails.address}
                                                    onChange={(e) => setDeliveryDetails((current) => ({ ...current, address: e.target.value }))}
                                                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-[#0865FE] focus:outline-none focus:ring-2 focus:ring-[#0865FE]/20"
                                                />
                                                <div className="grid grid-cols-2 gap-2">
                                                    <input
                                                        type="text"
                                                        autoComplete="address-level1"
                                                        placeholder="Wilaya"
                                                        value={deliveryDetails.wilaya}
                                                        onChange={(e) => setDeliveryDetails((current) => ({ ...current, wilaya: e.target.value }))}
                                                        className="min-w-0 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-[#0865FE] focus:outline-none focus:ring-2 focus:ring-[#0865FE]/20"
                                                    />
                                                    <input
                                                        type="text"
                                                        autoComplete="address-level2"
                                                        placeholder="Ville"
                                                        value={deliveryDetails.city}
                                                        onChange={(e) => setDeliveryDetails((current) => ({ ...current, city: e.target.value }))}
                                                        className="min-w-0 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-[#0865FE] focus:outline-none focus:ring-2 focus:ring-[#0865FE]/20"
                                                    />
                                                </div>
                                                <input
                                                    type="tel"
                                                    autoComplete="tel"
                                                    placeholder="Téléphone pour la livraison"
                                                    value={deliveryDetails.phone}
                                                    onChange={(e) => setDeliveryDetails((current) => ({ ...current, phone: e.target.value }))}
                                                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-[#0865FE] focus:outline-none focus:ring-2 focus:ring-[#0865FE]/20"
                                                />
                                            </div>
                                        )}

                                        {paymentMethod === 'satim' ? (
                                            <Button
                                                onClick={handlePaySatim}
                                                disabled={booking || !termsAccepted || (!skipRecaptcha && !captchaVerified)}
                                                className="w-full h-12 bg-[#0865FE] hover:bg-[#0865FE]/90 text-white font-semibold rounded-xl flex items-center justify-center gap-2"
                                            >
                                                {booking ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                                {booking ? 'Redirection...' : 'Payer maintenant'}
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={handlePayOffline}
                                                disabled={booking || (paymentMethod === 'agence' && !selectedOfficeId)}
                                                className="w-full h-12 bg-[#0865FE] hover:bg-[#0865FE]/90 text-white font-semibold rounded-xl flex items-center justify-center gap-2"
                                            >
                                                {booking ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                                {booking ? 'Enregistrement...' : 'Confirmer la réservation'}
                                            </Button>
                                        )}


                                    </div>

                                    {bookingError && (
                                        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-500 text-sm space-y-1">
                                            <div className="font-semibold">Réservation échouée</div>
                                            <div>{bookingError}</div>
                                            <div className="text-red-400 text-xs mt-1">
                                                Ce vol n'est peut-être plus disponible. Veuillez relancer une recherche.
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

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
                                    <Button onClick={() => { setTermsAccepted(true); setShowConditions(false); }}
                                            className="text-white rounded-full" style={{ background: 'linear-gradient(135deg, #0865FE, #3B2F7E)' }}>
                                        J'accepte
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 4 && bookingResult && (
                        <div className="max-w-3xl mx-auto space-y-6 text-center">

                            <div>
                                <h2 className="text-[#0B0F2E] text-2xl font-bold mb-2">Réservation confirmée !</h2>
                                <p className="text-slate-400 text-sm">Un email de confirmation a été envoyé.</p>
                            </div>

                            <div className="p-5 rounded-2xl bg-white border-2 border-[#0865FE]/20 shadow-sm space-y-3">
                                {bookingResult.bookingRef && (
                                    <div className="text-center">
                                        <div className="text-slate-400 text-xs uppercase tracking-wide mb-1">Référence PNR</div>
                                        <div className="text-3xl font-bold text-[#0865FE] tracking-widest">{bookingResult.bookingRef}</div>
                                    </div>
                                )}

                                {reserveInfo?.paymentTimeLimit && (
                                    <div className="text-center pt-3 border-t border-blue-100">
                                        <div className="text-slate-400 text-xs uppercase tracking-wide mb-1">Délai de paiement</div>
                                        <div className="text-sm font-semibold text-[#0B0F2E]">
                                            {new Date(reserveInfo.paymentTimeLimit).toLocaleString('fr-FR', {
                                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <FlightSummaryCard offer={offer} passengers={passengerCounts} />

                            <div className="flex gap-3">
                                <Button
                                    onClick={() => {
                                        const idToNavigate = bookingResult.dbId || bookingResult.id || (bookingResult as any)._id || bookingResult.bookingRef;
                                        navigate(`/flights/booking/${idToNavigate}`);
                                    }}
                                    className="flex-1 bg-[#0865FE] hover:bg-[#0865FE]/90 text-white font-semibold"
                                >
                                    Voir la réservation
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => navigate('/flights')}
                                    className="flex-1 border-slate-200 text-slate-500 hover:text-[#0865FE] hover:border-[#0865FE]/40"
                                >
                                    Nouvelle recherche
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}