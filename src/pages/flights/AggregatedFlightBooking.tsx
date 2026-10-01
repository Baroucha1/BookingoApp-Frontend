import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Briefcase, Check, Loader2, Truck, X } from 'lucide-react';
import BookingStepper from '@/components/flights/BookingStepper';
import FlightSummaryCard from '@/components/flights/FlightSummaryCard';
import PassengerForm from '@/components/flights/PassengerForm';
import PassportScanner, { type MrzResult } from '@/components/PassportScanner';
import { Button } from '@/components/ui/button';
import { isDomesticAlgeria, type PassengerFormData } from '@/context/FlightContext';
import { useToast } from '@/hooks/use-toast';
import { bookFlight, orderReserve } from '@/service/flights_aggregator/book.service';
import type { OrderReserveResult, PassengerInput, AggregatedSearchParams } from '@/service/flights_aggregator/aggregatedTypes.ts';
import type { DisplayOffer } from '@/service/flights_aggregator/aggregatedNormalize';
import { initiateFlightSatimPayment } from '@/service/payment.service';
import { encodeSearchParams } from '@/service/flights_aggregator/SearchParmsCodec.ts';
import LoyaltyCardFields from "@/components/flights/LoyaltyCardFields.tsx";

const RESULTS_PATH = '/flights/v2';
const PENDING_KEY = 'pendingFlightBooking';

interface BookingState {
    offer: DisplayOffer;
    searchParams?: AggregatedSearchParams | null;
    returnTo?: { pathname: string; search?: string };
}

const mockPassenger = (type: 'ADT' | 'CHD' | 'INF'): PassengerFormData => ({
    paxType: type,
    passengerTitle: 'MR',
    firstName: '',
    lastName: '',
    birthday: '',
    sexe: '',
    typeDoc: 'P',
    passportNumber: '',
    expiryDate: '',
    nationality: 'Algerian',
    mail: '',
    tel: '',
});

function calculateAge(birthday: string, referenceDate: string): number {
    const birth = new Date(birthday);
    const ref = new Date(referenceDate);
    let age = ref.getFullYear() - birth.getFullYear();
    const monthDiff = ref.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && ref.getDate() < birth.getDate())) age--;
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

    if (p.paxType !== 'INF') {
        const fidNumber = (p.fidelityNumber ?? '').replace(/\s+/g, '');
        const fidAirline = (p.fidelityAirline ?? '').trim();
        if (fidNumber) {
            if (!/^[A-Z0-9]{2}$/i.test(fidAirline)) errors.fidelityAirline = 'Code à 2 caractères';
            if (!/^[A-Z0-9]{4,25}$/i.test(fidNumber)) errors.fidelityNumber = 'Numéro invalide';
        }
    }

    if (isFirst) {
        if (!p.mail?.trim()) errors.mail = 'Requis';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.mail)) errors.mail = 'Email invalide';
        if (!p.tel?.trim()) errors.tel = 'Requis';
        else if (!/^(\+213|0)[567]\d{8}$/.test(p.tel)) errors.tel = 'Format: +213XXXXXXXXX';
    }
    return errors;
}

function toBookingPassengers(passengers: PassengerFormData[]): PassengerInput[] {
    return passengers.map((p) => {
        const fidelityNumber = (p.fidelityNumber ?? '').replace(/\s+/g, '');
        const hasCard = p.paxType !== 'INF' && !!fidelityNumber;
        return {
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
            ...(hasCard && {
                fidelityAirline: (p.fidelityAirline ?? '').trim().toUpperCase(),
                fidelityNumber,
            }),
        };
    });
}

export default function AggregatedFlightBooking() {
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();

    // ── Restore: router state first, then sessionStorage (reload / login redirect) ──
    const [restoredState] = useState<BookingState | null>(() => {
        const fromRouter = location.state as BookingState | null;
        if (fromRouter?.offer) return fromRouter;
        try {
            const stored = sessionStorage.getItem(PENDING_KEY);
            return stored ? (JSON.parse(stored) as BookingState) : null;
        } catch {
            return null;
        }
    });
    const offer = restoredState?.offer ?? null;
    const searchParams = restoredState?.searchParams ?? null;

    const [step, setStep] = useState<2 | 4>(2);
    const [passengers, setPassengers] = useState<PassengerFormData[]>(() => {
        if (!offer) return [];
        const counts = searchParams ?? { adults: 1, children: 0, infants: 0 };
        return [
            ...Array.from({ length: counts.adults ?? 1 }, () => mockPassenger('ADT')),
            ...Array.from({ length: counts.children ?? 0 }, () => mockPassenger('CHD')),
            ...Array.from({ length: counts.infants ?? 0 }, () => mockPassenger('INF')),
        ];
    });
    const [errors, setErrors] = useState<Record<number, Record<string, string>>>({});
    const [scannerOpenFor, setScannerOpenFor] = useState<number | null>(null);
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

    // ── Effects (all before any early return) ──
    useEffect(() => {
        let cancelled = false;
        fetch(`${import.meta.env.VITE_API_URL ?? ''}/api/contact/offices`)
            .then((res) => {
                if (!res.ok) throw new Error('Impossible de charger les agences');
                return res.json();
            })
            .then((data) => { if (!cancelled) setOffices(data); })
            .catch((error) => console.error('[AggregatedFlightBooking] offices:', error));
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        if (skipRecaptcha || document.getElementById('recaptcha-script')) return;
        const script = document.createElement('script');
        script.id = 'recaptcha-script';
        script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
        script.async = true;
        document.head.appendChild(script);
    }, [skipRecaptcha]);

    // Render the widget while SATIM is selected; the container unmounts when switching method,
    // so the cleanup just forgets the old widget id.
    useEffect(() => {
        if (!offer || step !== 2 || paymentMethod !== 'satim' || skipRecaptcha) return;
        let cancelled = false;
        let timer: ReturnType<typeof setTimeout> | undefined;

        const tryRender = () => {
            if (cancelled) return;
            if (!window.grecaptcha?.render || !recaptchaRef.current) {
                timer = setTimeout(tryRender, 300);
                return;
            }
            if (recaptchaWidgetId.current !== null) return;
            recaptchaWidgetId.current = window.grecaptcha.render(recaptchaRef.current, {
                sitekey: import.meta.env.VITE_RECAPTCHA_SITE_KEY,
                callback: () => setCaptchaVerified(true),
                'expired-callback': () => setCaptchaVerified(false),
            });
        };
        tryRender();

        return () => {
            cancelled = true;
            if (timer) clearTimeout(timer);
            recaptchaWidgetId.current = null;
            setCaptchaVerified(false);
        };
    }, [offer, step, paymentMethod, skipRecaptcha]);

    // ── Back to results ──
    const backToResults = () => {
        // 1. Exact URL the user came from (if the results page passed it)
        if (restoredState?.returnTo) {
            navigate(`${restoredState.returnTo.pathname}${restoredState.returnTo.search ?? ''}`);
            return;
        }
        // 2. Rebuild the results URL from the search criteria — the results page re-runs the search
        if (searchParams) {
            navigate(`${RESULTS_PATH}?${encodeSearchParams(searchParams).toString()}`);
            return;
        }
        // 3. Nothing to rebuild from
        navigate('/flights');
    };

    if (!offer) {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{ background: 'linear-gradient(160deg, #08082e 0%, #0a1550 35%, #0865FE 100%)' }}
            >
                <div className="text-white/60 text-center">
                    <p>Aucun vol sélectionné.</p>
                    <Button onClick={() => navigate('/flights')} className="mt-4 bg-[#0865FE] hover:bg-[#0865FE]/90 text-white">
                        Rechercher un vol
                    </Button>
                </div>
            </div>
        );
    }

    const isDomestic = isDomesticAlgeria(offer);
    const travelDate = offer.legs[0].segments[0].departure.dateTime;

    const defaultLoyaltyAirline = offer.legs[0]?.segments[0]?.carrierCode ?? '';

    const passengerCounts = {
        adults: searchParams?.adults ?? (passengers.filter((p) => p.paxType === 'ADT').length || 1),
        children: searchParams?.children ?? passengers.filter((p) => p.paxType === 'CHD').length,
        infants: searchParams?.infants ?? passengers.filter((p) => p.paxType === 'INF').length,
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

    const resetCaptcha = () => {
        if (skipRecaptcha || recaptchaWidgetId.current === null || !window.grecaptcha) return;
        window.grecaptcha.reset(recaptchaWidgetId.current);
        setCaptchaVerified(false);
    };

    const handlePaySatim = async () => {
        if (!validatePassengers()) return;

        let captchaToken = '';
        if (!skipRecaptcha) {
            captchaToken = window.grecaptcha.getResponse(recaptchaWidgetId.current);
            if (!captchaToken) {
                toast({ title: 'reCAPTCHA requis', description: 'Veuillez valider le reCAPTCHA.', variant: 'destructive' });
                return;
            }
        }

        setBooking(true);
        setBookingError(null);
        try {
            // Reuse the booking if a previous payment attempt failed — avoids duplicate PNRs
            const result = bookingResult ?? await bookFlight(offer.fareSourceCode!, toBookingPassengers(passengers), offer.price);
            setBookingResult(result);

            const { formUrl } = await initiateFlightSatimPayment(result.dbId, captchaToken);
            sessionStorage.removeItem(PENDING_KEY);
            window.location.href = formUrl;
        } catch (err: any) {
            const detail = err?.message ?? 'Erreur lors de la réservation.';
            setBookingError(detail);
            resetCaptcha(); // tokens are single-use
            toast({ title: 'Réservation échouée', description: detail, variant: 'destructive' });
            setBooking(false);
        }
    };

    const handlePayOffline = async () => {
        if (!validatePassengers()) return;
        if (paymentMethod === 'agence' && !selectedOfficeId) {
            toast({ title: 'Agence requise', description: 'Veuillez sélectionner une agence avant de confirmer.', variant: 'destructive' });
            return;
        }
        if (paymentMethod === 'delivery' && !Object.values(deliveryDetails).every((value) => value.trim())) {
            toast({ title: 'Adresse de livraison requise', description: "Veuillez renseigner l'adresse, la wilaya, la ville et le téléphone.", variant: 'destructive' });
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
            setBookingResult(result);

            if (offer.fareSourceCode?.startsWith('TK_NDC:')) {
                try {
                    setReserveInfo(await orderReserve(result.dbId));
                } catch {
                    toast({
                        title: 'Réservation créée, mais délai de paiement non prolongé',
                        description: 'Le paiement doit être effectué rapidement (délai réduit).',
                        variant: 'destructive',
                    });
                }
            }

            sessionStorage.removeItem(PENDING_KEY);
            setStep(4);
            toast({
                title: 'Réservation confirmée',
                description: paymentMethod === 'delivery' ? 'Vous serez contacté pour organiser la livraison.' : 'Paiement à régler en agence.',
            });
        } catch (err: any) {
            const detail = err?.message ?? 'Erreur lors de la réservation.';
            setBookingError(detail);
            toast({ title: 'Réservation échouée', description: detail, variant: 'destructive' });
        } finally {
            setBooking(false);
        }
    };

    const methodCardStyle = (active: boolean) => ({
        borderColor: active ? '#0865FE' : '#e5e7eb',
        background: active ? 'rgba(8,101,254,0.04)' : '#fff',
    });

    const ActiveCheck = () => (
        <span className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center bg-[#0865FE]">
            <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
        </span>
    );

    return (
        <div
            className="min-h-screen bg-cover bg-center bg-fixed"
            style={{
                backgroundImage: `linear-gradient(180deg, rgba(8,101,254,0.05) 0%, rgba(255,255,255,0.6) 60%), url("/assets/flights/booking.webp")`,
                backgroundPosition: 'top center',
                backgroundSize: 'cover',
                backgroundAttachment: 'fixed',
                backgroundRepeat: 'no-repeat',
            }}
        >
            <div className="max-w-6xl mx-auto px-4 pt-24 pb-16">
                {step < 4 && (
                    <button
                        onClick={backToResults}
                        className="text-[#0B0F2E]/70 hover:text-[#0865FE] flex items-center gap-2 text-sm mb-6 transition-colors font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Retour aux résultats
                    </button>
                )}

                <div className="mb-8">
                    <BookingStepper current={step} />
                </div>

                <div className="space-y-6">
                    {step === 2 && (
                        <div className="space-y-6">
                            {/* Row 1: flight details + price summary */}
                            <div className="grid lg:grid-cols-[1fr_340px] gap-6 items-start">
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
                            <div className="grid lg:grid-cols-[1fr_340px] gap-6 items-start">
                                <div className="space-y-4 bg-white p-4 rounded-sm">
                                    <h2 className="text-[#0B0F2E] text-lg font-bold">Informations passagers</h2>
                                    <p className="text-slate-400 text-sm -mt-2">
                                        Les noms doivent correspondre exactement au document de voyage.
                                    </p>
                                    {passengers.map((p, i) => (
                                        <div key={i} className="space-y-2">
                                            <PassengerForm
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


                                            {p.paxType !== 'INF' && (
                                                <LoyaltyCardFields
                                                    airline={p.fidelityAirline ?? ''}
                                                    number={p.fidelityNumber ?? ''}
                                                    defaultAirline={defaultLoyaltyAirline}
                                                    errors={errors[i] ?? {}}
                                                    onChange={(fid) => {
                                                        setPassengers((prev) => {
                                                            const next = [...prev];
                                                            next[i] = { ...next[i], ...fid };
                                                            return next;
                                                        });
                                                    }}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-4">
                                    <div className="p-5 rounded-2xl bg-white shadow-sm space-y-4">
                                        <h3 className="text-[#0865FE] text-sm font-bold uppercase tracking-wide">Mode de paiement</h3>

                                        <div className="grid grid-cols-1 gap-2">
                                            <button type="button" onClick={() => setPaymentMethod('satim')}
                                                    className="relative rounded-xl border-2 p-3 text-left transition-all duration-200"
                                                    style={methodCardStyle(paymentMethod === 'satim')}>
                                                {paymentMethod === 'satim' && <ActiveCheck />}
                                                <img src="/dhahabiaCIB.png" alt="CIB EDAHABIA" className="h-6 object-contain mb-1" />
                                                <p className="font-semibold text-xs">CIB / EDAHABIA</p>
                                                <p className="text-[11px] text-muted-foreground">Carte bancaire · SATIM</p>
                                            </button>

                                            <button type="button" onClick={() => setPaymentMethod('agence')}
                                                    className="relative rounded-xl border-2 p-3 text-left transition-all duration-200"
                                                    style={methodCardStyle(paymentMethod === 'agence')}>
                                                {paymentMethod === 'agence' && <ActiveCheck />}
                                                <div className="h-6 w-6 rounded-md flex items-center justify-center mb-1" style={{ background: 'linear-gradient(135deg, #0865FE, #3B2F7E)' }}>
                                                    <Briefcase className="w-3.5 h-3.5 text-white" />
                                                </div>
                                                <p className="font-semibold text-xs">Paiement en agence</p>
                                                <p className="text-[11px] text-muted-foreground">Espèces à l'agence</p>
                                            </button>

                                            <button type="button" onClick={() => setPaymentMethod('delivery')}
                                                    className="relative rounded-xl border-2 p-3 text-left transition-all duration-200"
                                                    style={methodCardStyle(paymentMethod === 'delivery')}>
                                                {paymentMethod === 'delivery' && <ActiveCheck />}
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
                                                    <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)}
                                                           className="mt-0.5 w-4 h-4 accent-[#0865FE] cursor-pointer" />
                                                    <span className="text-xs text-gray-700">
                                                        J'accepte les{' '}
                                                        <button type="button" onClick={() => setShowConditions(true)}
                                                                className="text-[#0865FE] underline hover:text-[#0865FE]/80 font-medium">
                                                            conditions d'utilisation
                                                        </button>
                                                    </span>
                                                </label>
                                                {!skipRecaptcha && (
                                                    <div className="flex justify-center overflow-x-auto">
                                                        <div ref={recaptchaRef} />
                                                    </div>
                                                )}
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
                                                {!offices.length && <p className="text-xs text-amber-600">Chargement des agences...</p>}
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
                                                    onChange={(e) => setDeliveryDetails((c) => ({ ...c, address: e.target.value }))}
                                                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-[#0865FE] focus:outline-none focus:ring-2 focus:ring-[#0865FE]/20"
                                                />
                                                <div className="grid grid-cols-2 gap-2">
                                                    <input
                                                        type="text"
                                                        autoComplete="address-level1"
                                                        placeholder="Wilaya"
                                                        value={deliveryDetails.wilaya}
                                                        onChange={(e) => setDeliveryDetails((c) => ({ ...c, wilaya: e.target.value }))}
                                                        className="min-w-0 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-[#0865FE] focus:outline-none focus:ring-2 focus:ring-[#0865FE]/20"
                                                    />
                                                    <input
                                                        type="text"
                                                        autoComplete="address-level2"
                                                        placeholder="Ville"
                                                        value={deliveryDetails.city}
                                                        onChange={(e) => setDeliveryDetails((c) => ({ ...c, city: e.target.value }))}
                                                        className="min-w-0 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-[#0865FE] focus:outline-none focus:ring-2 focus:ring-[#0865FE]/20"
                                                    />
                                                </div>
                                                <input
                                                    type="tel"
                                                    autoComplete="tel"
                                                    placeholder="Téléphone pour la livraison"
                                                    value={deliveryDetails.phone}
                                                    onChange={(e) => setDeliveryDetails((c) => ({ ...c, phone: e.target.value }))}
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
                                                {booking && <Loader2 className="w-4 h-4 animate-spin" />}
                                                {booking ? 'Redirection...' : 'Payer maintenant'}
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={handlePayOffline}
                                                disabled={booking || (paymentMethod === 'agence' && !selectedOfficeId)}
                                                className="w-full h-12 bg-[#0865FE] hover:bg-[#0865FE]/90 text-white font-semibold rounded-xl flex items-center justify-center gap-2"
                                            >
                                                {booking && <Loader2 className="w-4 h-4 animate-spin" />}
                                                {booking ? 'Enregistrement...' : 'Confirmer la réservation'}
                                            </Button>
                                        )}
                                    </div>

                                    {bookingError && (
                                        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-500 text-sm space-y-1">
                                            <div className="font-semibold">Réservation échouée</div>
                                            <div>{bookingError}</div>
                                            <div className="text-red-400 text-xs mt-1">
                                                Ce vol n'est peut-être plus disponible.{' '}
                                                <button type="button" onClick={backToResults} className="underline font-medium">
                                                    Retour aux résultats
                                                </button>
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
                                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <FlightSummaryCard offer={offer} passengers={passengerCounts} />

                            <div className="flex flex-col sm:flex-row gap-3">
                                <Button
                                    onClick={() => navigate(`/flights/booking/${bookingResult.dbId}`)}
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
            <PassportScanner
                open={scannerOpenFor !== null}
                onOpenChange={(open) => {
                    if (!open) setScannerOpenFor(null);
                }}
                onResult={(data: MrzResult) => {
                    const passengerIndex = scannerOpenFor;
                    if (passengerIndex === null) return;

                    setPassengers((prev) => prev.map((passenger, index) =>
                        index === passengerIndex
                            ? {
                                ...passenger,
                                firstName: data.firstName || passenger.firstName,
                                lastName: data.lastName || passenger.lastName,
                                birthday: data.birthDate || passenger.birthday,
                                nationality: data.nationality || passenger.nationality,
                                passportNumber: data.passportNumber || passenger.passportNumber,
                                expiryDate: data.passportExpiryDate || passenger.expiryDate,
                            }
                            : passenger
                    ));

                    setErrors((prev) => {
                        const passengerErrors = { ...(prev[passengerIndex] ?? {}) };
                        ['firstName', 'lastName', 'birthday', 'nationality', 'passportNumber', 'expiryDate']
                            .forEach((field) => delete passengerErrors[field]);
                        return { ...prev, [passengerIndex]: passengerErrors };
                    });

                    setScannerOpenFor(null);
                }}
            />
        </div>
    );
}