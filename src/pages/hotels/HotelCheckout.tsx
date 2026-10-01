// src/pages/hotels/HotelCheckout.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
    User, Users, FileText, ArrowLeft, ArrowRight, Loader2,
    Star, MapPin, Calendar, Moon, ShieldCheck, Check, X, AlertTriangle, Coffee,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
    getHotelPolicies, initiateHotelPayment,
    type SearchOption, type BookingRoomInput, type HotelPolicies,
} from '@/service/hotels/hotels.service';
import { nightsBetween } from '@/lib/hotelSearchParams';
import { formatAmount, translateBoard } from '@/lib/roomFilters';

interface CheckoutState {
    hotelId: string;
    hotelName: string;
    hotelImage: string | null;
    address: string;
    starRating: string | null;
    checkInDate: string;
    checkOutDate: string;
    option: SearchOption;
    confirmedPrice: number | string;
    cancellationPolicy: HotelPolicies['policies'] | null;
}

interface AdultForm { title: 'Mr' | 'Mrs' | 'Miss' | ''; firstName: string; lastName: string; }
interface ChildForm { firstName: string; lastName: string; }
interface RoomForm { adults: AdultForm[]; children: ChildForm[]; }

const PRICE_TOLERANCE = 0.5;

const formatDay = (d: string) => {
    try { return format(parseISO(d), 'EEE d MMM yyyy', { locale: fr }); } catch { return d; }
};

const STEPS = [
    { n: 1, label: 'Détails de la réservation' },
    { n: 2, label: 'Paiement' },
    { n: 3, label: 'Confirmation' },
];

function StepIndicator({ current }: { current: number }) {
    return (
        <div className="flex items-center justify-center gap-2 sm:gap-4 py-6 sm:py-8">
            {STEPS.map((s, i) => {
                const active = s.n === current;
                return (
                    <div key={s.n} className="flex items-center gap-2 sm:gap-4">
                        <div className="flex items-center gap-2">
                            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${active ? 'bg-[#1775FF] text-white' : 'bg-slate-200 text-slate-500'}`}>
                                {s.n}
                            </span>
                            <span className={`text-sm ${active ? 'text-slate-800 font-medium' : 'text-slate-400 hidden sm:inline'}`}>{s.label}</span>
                        </div>
                        {i < STEPS.length - 1 && <div className="w-6 sm:w-16 h-px bg-slate-200" />}
                    </div>
                );
            })}
        </div>
    );
}

export default function HotelCheckout() {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const state = location.state as CheckoutState | null;

    const [saving, setSaving] = useState(false);

    // Contact (booker) info — separate from room occupants
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [specialRequest, setSpecialRequest] = useState('');

    // One block per room, exact adult/child counts from the search
    const [rooms, setRooms] = useState<RoomForm[]>(() =>
        state ? state.option.rooms.map((r) => ({
            adults: Array.from({ length: r.numAdults }, () => ({ title: '' as const, firstName: '', lastName: '' })),
            children: Array.from({ length: r.numChildren }, () => ({ firstName: '', lastName: '' })),
        })) : [],
    );

    // Price the user agreed to; updated if the supplier changes it before payment
    const [price, setPrice] = useState<number>(() =>
        state ? Number(state.confirmedPrice ?? state.option.totalPrice) : 0);
    const [priceChange, setPriceChange] = useState<{ from: number; to: number } | null>(null);

    const [termsAccepted, setTermsAccepted] = useState(false);
    const [showConditions, setShowConditions] = useState(false);
    const [captchaVerified, setCaptchaVerified] = useState(false);
    const recaptchaRef = useRef<HTMLDivElement>(null);
    const recaptchaWidgetId = useRef<number | null>(null);
    const skipRecaptcha = import.meta.env.VITE_SKIP_RECAPTCHA === 'true';

    // ⚠️ All hooks must run before the `if (!state)` return below
    const travellersComplete = useMemo(
        () => rooms.every((r) =>
            r.adults.every((a) => a.title !== '' && a.firstName.trim() !== '' && a.lastName.trim() !== '') &&
            r.children.every((c) => c.firstName.trim() !== '' && c.lastName.trim() !== ''),
        ),
        [rooms],
    );

    const hotelId = state?.hotelId ?? searchParams.get('hotelId');

    const backToDetails = (replace = false) => {
        const back = new URLSearchParams(searchParams);
        back.delete('hotelId');
        back.delete('optionId');
        navigate(hotelId ? `/hotels/${hotelId}?${back.toString()}` : '/hotels', { replace });
    };

    // Reload / new tab: router state is gone → back to details for a fresh search
    useEffect(() => {
        if (!state) backToDetails(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state]);

    useEffect(() => {
        if (skipRecaptcha || document.getElementById('recaptcha-script')) return;
        const script = document.createElement('script');
        script.id = 'recaptcha-script';
        script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
        script.async = true;
        document.head.appendChild(script);
    }, [skipRecaptcha]);

    useEffect(() => {
        if (skipRecaptcha || !state) return;
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

        return () => { cancelled = true; if (timer) clearTimeout(timer); };
    }, [skipRecaptcha, state]);

    if (!state) return null; // redirecting

    const { hotelName, hotelImage, address, starRating, checkInDate, checkOutDate, option, cancellationPolicy } = state;
    const nights = nightsBetween(checkInDate, checkOutDate);
    const totalAdults = option.rooms.reduce((s, r) => s + r.numAdults, 0);
    const totalChildren = option.rooms.reduce((s, r) => s + r.numChildren, 0);
    const boardLabel = translateBoard(option.boardType ?? '');
    const showPerRoomPrices = Math.abs(price - option.totalPrice) <= PRICE_TOLERANCE;

    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const isValid = emailValid && travellersComplete;

    const updateAdult = (roomIdx: number, adultIdx: number, field: keyof AdultForm, value: string) => {
        setRooms((prev) => prev.map((r, ri) => ri !== roomIdx ? r : {
            ...r,
            adults: r.adults.map((a, ai) => ai !== adultIdx ? a : { ...a, [field]: value }),
        }));
    };

    const updateChild = (roomIdx: number, childIdx: number, field: keyof ChildForm, value: string) => {
        setRooms((prev) => prev.map((r, ri) => ri !== roomIdx ? r : {
            ...r,
            children: r.children.map((c, ci) => ci !== childIdx ? c : { ...c, [field]: value }),
        }));
    };

    // reCAPTCHA tokens are single-use: once sent to the backend, a new one is needed
    const resetCaptcha = () => {
        if (skipRecaptcha || recaptchaWidgetId.current === null) return;
        window.grecaptcha.reset(recaptchaWidgetId.current);
        setCaptchaVerified(false);
    };

    const submitBooking = async () => {
        if (!isValid) {
            toast.error(!emailValid
                ? 'Un email valide est requis'
                : 'Merci de renseigner tous les voyageurs (civilité, nom, prénom)');
            return;
        }
        if (!termsAccepted) {
            toast.error("Veuillez accepter les conditions d'utilisation");
            return;
        }
        let captchaToken = '';
        if (!skipRecaptcha) {
            captchaToken = window.grecaptcha.getResponse(recaptchaWidgetId.current);
            if (!captchaToken) {
                toast.error('Veuillez valider le reCAPTCHA');
                return;
            }
        }

        setSaving(true);

        // 1. Re-check the offer: time has passed while the form was filled in
        try {
            const fresh = await getHotelPolicies(option.optionId);
            const freshPrice = Number(fresh.price);
            if (Math.abs(freshPrice - price) > PRICE_TOLERANCE) {
                setPriceChange({ from: price, to: freshPrice });
                setPrice(freshPrice);
                toast.warning('Le prix a changé. Vérifiez le nouveau montant avant de payer.');
                setSaving(false);
                return;
            }
        } catch {
            toast.error("Cette offre n'est plus disponible.", {
                action: { label: 'Voir les offres', onClick: () => backToDetails() },
            });
            setSaving(false);
            return;
        }

        // 2. Initiate payment
        try {
            const bookingRooms: BookingRoomInput[] = option.rooms.map((r, i) => ({
                roomId: r.roomId,
                adults: rooms[i].adults.map((a) => ({
                    title: a.title as 'Mr' | 'Mrs' | 'Miss',
                    firstName: a.firstName.trim(),
                    lastName: a.lastName.trim(),
                })),
                children: rooms[i].children.map((c) => ({ firstName: c.firstName.trim(), lastName: c.lastName.trim() })),
            }));

            // Lead guest = first adult of the first room
            const lead = rooms[0].adults[0];

            const payment = await initiateHotelPayment({
                optionId: option.optionId,
                rooms: bookingRooms,
                contact: { email, firstName: lead.firstName.trim(), lastName: lead.lastName.trim(), phone: phone || undefined },
                hotelId: hotelId ? Number(hotelId) : undefined, // adjust if your API expects a string
                hotelName,
                checkInDate,
                checkOutDate,
                boardType: option.boardType,
                totalPrice: price, // confirmed price — the backend must still re-verify it
                currency: option.currency,
                captchaToken,
                // specialRequest: specialRequest.trim() || undefined, ← add if your API supports it
            });

            // orderId isn't carried inside bookingToken — stash it for SatimResult
            sessionStorage.setItem(`hotel_satim_orderId_${payment.bookingToken}`, payment.orderId);
            window.location.href = payment.formUrl;
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Échec de la réservation');
            resetCaptcha();
            setSaving(false);
        }
    };

    const stars = starRating ? Math.round(Number(starRating)) : 0;

    return (
        <div className="min-h-screen bg-[#F0F6FF]">
            {/* Header */}
            <div className="relative h-36 sm:h-40 overflow-hidden">
                {hotelImage && <img src={hotelImage} alt="" className="absolute inset-0 w-full h-full object-cover" />}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-[#F0F6FF] z-10" />
                <div className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 h-full flex items-center gap-4">
                    {hotelImage && <img src={hotelImage} alt="" className="hidden sm:block w-20 h-20 rounded-xl object-cover border-2 border-white shadow-lg" />}
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-lg sm:text-xl font-bold text-white drop-shadow">{hotelName}</h1>
                            {stars > 0 && (
                                <span className="flex gap-0.5">
                                    {Array.from({ length: stars }, (_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                                </span>
                            )}
                        </div>
                        <div className="flex items-start gap-1 text-sm text-white/90 mt-1">
                            <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" /> <span className="line-clamp-1">{address}</span>
                        </div>
                        {boardLabel && (
                            <span className="inline-flex items-center gap-1 mt-2 text-xs bg-white/90 text-[#1775FF] px-2 py-1 rounded-full font-medium">
                                <Coffee className="w-3 h-3" /> {boardLabel}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6">
                <StepIndicator current={1} />

                <div className="grid grid-cols-1 md:grid-cols-[1fr_340px] gap-6 pb-12">
                    {/* Form */}
                    <div className="bg-white rounded-xl border border-slate-100 p-4 sm:p-6 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <User className="w-5 h-5 text-[#1775FF]" />
                            <span className="font-bold text-lg text-slate-800">Vos informations</span>
                        </div>
                        <p className="text-sm text-slate-500 mb-5">Merci de renseigner les informations de contact et de chaque voyageur.</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                            <div>
                                <label className="text-xs text-slate-500">Email *</label>
                                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="exemple@domaine.com" className="mt-1" />
                                {email && !emailValid && <p className="text-[11px] text-red-500 mt-1">Adresse email invalide</p>}
                            </div>
                            <div>
                                <label className="text-xs text-slate-500">N° de téléphone (optionnel)</label>
                                <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Numéro de téléphone" className="mt-1" />
                            </div>
                        </div>

                        {option.rooms.map((r, roomIdx) => (
                            <div key={roomIdx} className="border-t border-slate-100 pt-5 mb-2">
                                <div className="flex items-center gap-2 mb-1">
                                    <Users className="w-4 h-4 text-[#1775FF]" />
                                    <span className="text-sm font-semibold text-slate-700">
                                        {option.rooms.length > 1 && `Chambre ${roomIdx + 1} · `}{r.roomName}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 mb-3">
                                    {r.numAdults} adulte{r.numAdults > 1 ? 's' : ''}
                                    {r.numChildren > 0 ? `, ${r.numChildren} enfant${r.numChildren > 1 ? 's' : ''}` : ''}
                                </p>

                                {rooms[roomIdx].adults.map((a, adultIdx) => (
                                    <div key={adultIdx} className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 sm:mb-2 items-center">
                                        <select
                                            value={a.title}
                                            onChange={(e) => updateAdult(roomIdx, adultIdx, 'title', e.target.value)}
                                            className="col-span-2 sm:col-span-1 h-9 border border-slate-200 rounded-md text-sm px-2 bg-white"
                                            aria-label={`Civilité adulte ${adultIdx + 1}`}
                                        >
                                            <option value="">Civilité</option>
                                            <option value="Mr">M.</option>
                                            <option value="Mrs">Mme</option>
                                            <option value="Miss">Mlle</option>
                                        </select>
                                        <Input
                                            placeholder="Prénom"
                                            value={a.firstName}
                                            onChange={(e) => updateAdult(roomIdx, adultIdx, 'firstName', e.target.value.slice(0, 50))}
                                        />
                                        <Input
                                            placeholder="Nom"
                                            value={a.lastName}
                                            onChange={(e) => updateAdult(roomIdx, adultIdx, 'lastName', e.target.value.slice(0, 50))}
                                            className="sm:col-span-2"
                                        />
                                    </div>
                                ))}

                                {rooms[roomIdx].children.map((c, childIdx) => (
                                    <div key={childIdx} className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 sm:mb-2 items-center">
                                        <span className="col-span-2 sm:col-span-1 text-xs text-slate-400">Enfant {childIdx + 1}</span>
                                        <Input
                                            placeholder="Prénom"
                                            value={c.firstName}
                                            onChange={(e) => updateChild(roomIdx, childIdx, 'firstName', e.target.value.slice(0, 50))}
                                        />
                                        <Input
                                            placeholder="Nom"
                                            value={c.lastName}
                                            onChange={(e) => updateChild(roomIdx, childIdx, 'lastName', e.target.value.slice(0, 50))}
                                            className="sm:col-span-2"
                                        />
                                    </div>
                                ))}
                            </div>
                        ))}

                        <div className="border-t border-slate-100 pt-5">
                            <div className="flex items-center gap-2 mb-1">
                                <FileText className="w-4 h-4 text-[#1775FF]" />
                                <span className="text-sm font-semibold text-slate-700">Informations complémentaires</span>
                            </div>
                            <label className="text-xs text-slate-500">Demande spéciale (optionnel)</label>
                            <Textarea
                                value={specialRequest}
                                onChange={(e) => setSpecialRequest(e.target.value)}
                                placeholder="Ex : lit bébé, chambre non fumeur, vue sur la ville..."
                                className="mt-1"
                                rows={3}
                            />
                        </div>

                        <div className="border-t border-slate-100 pt-5 mt-2">
                            <div className="text-sm font-semibold text-slate-700 mb-3">Mode de paiement</div>

                            <div className="relative rounded-xl border-2 border-[#1775FF] bg-[#1775FF]/[0.04] p-3 mb-4">
                                <span className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center bg-[#1775FF]">
                                    <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                                </span>
                                <img src="/dhahabiaCIB.png" alt="CIB EDAHABIA" className="h-6 object-contain mb-1" />
                                <p className="font-semibold text-xs">CIB / EDAHABIA</p>
                                <p className="text-[11px] text-slate-500">Carte bancaire · SATIM</p>
                            </div>

                            {priceChange && (
                                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 shrink-0" />
                                    <span>
                                        Le prix a été mis à jour par l'hôtel :{' '}
                                        <s>{formatAmount(priceChange.from, option.currency)}</s> →{' '}
                                        <strong>{formatAmount(priceChange.to, option.currency)}</strong>.
                                        Cliquez à nouveau sur « Payer » pour accepter ce montant.
                                    </span>
                                </div>
                            )}

                            <label className="flex items-start gap-2 cursor-pointer mb-3">
                                <input
                                    type="checkbox"
                                    checked={termsAccepted}
                                    onChange={(e) => setTermsAccepted(e.target.checked)}
                                    className="mt-0.5 w-4 h-4 accent-[#1775FF] cursor-pointer"
                                />
                                <span className="text-xs text-slate-700">
                                    J'accepte les{' '}
                                    <button type="button" onClick={() => setShowConditions(true)} className="text-[#1775FF] underline font-medium">
                                        conditions d'utilisation
                                    </button>
                                </span>
                            </label>

                            {!skipRecaptcha && <div className="flex justify-center mb-4 overflow-x-auto"><div ref={recaptchaRef} /></div>}

                            <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
                                <button onClick={() => backToDetails()} className="text-sm text-slate-500 flex items-center justify-center gap-1 hover:text-slate-700">
                                    <ArrowLeft className="w-4 h-4" /> Retour aux chambres
                                </button>
                                <Button
                                    onClick={submitBooking}
                                    disabled={!isValid || saving || !termsAccepted || (!skipRecaptcha && !captchaVerified)}
                                    className="w-full sm:w-auto h-11 bg-[#F5A623] hover:bg-[#F5A623]/90 text-[#0B2A5C] font-bold gap-2"
                                >
                                    {saving
                                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Traitement...</>
                                        : <>Payer {formatAmount(price, option.currency)} <ArrowRight className="w-4 h-4" /></>}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Summary — shown first on mobile so the user sees what they're paying for */}
                    <aside className="order-first md:order-none">
                        <div className="bg-white rounded-xl border border-slate-100 p-5 space-y-4 md:sticky md:top-4">
                            <div className="font-bold text-slate-800">Récapitulatif de votre réservation</div>

                            <div className="flex gap-3 items-start">
                                {hotelImage && <img src={hotelImage} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />}
                                <div className="min-w-0">
                                    <div className="font-semibold text-sm">{hotelName}</div>
                                    {stars > 0 && (
                                        <span className="flex gap-0.5 my-0.5">
                                            {Array.from({ length: stars }, (_, i) => <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                                        </span>
                                    )}
                                    <div className="text-xs text-slate-400 flex items-start gap-1">
                                        <MapPin className="w-3 h-3 shrink-0 mt-0.5" /> <span className="line-clamp-2">{address}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm border-t border-slate-100 pt-3">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="flex items-center gap-2 text-slate-500"><Calendar className="w-4 h-4" /> Arrivée</span>
                                    <span className="font-medium text-slate-800 capitalize">{formatDay(checkInDate)}</span>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <span className="flex items-center gap-2 text-slate-500"><Calendar className="w-4 h-4" /> Départ</span>
                                    <span className="font-medium text-slate-800 capitalize">{formatDay(checkOutDate)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-600"><Moon className="w-4 h-4 text-slate-400" /> {nights} nuit{nights > 1 ? 's' : ''}</div>
                                <div className="flex items-center gap-2 text-slate-600">
                                    <Users className="w-4 h-4 text-slate-400" />
                                    {option.rooms.length} chambre{option.rooms.length > 1 ? 's' : ''} · {totalAdults} adulte{totalAdults > 1 ? 's' : ''}
                                    {totalChildren > 0 && `, ${totalChildren} enfant${totalChildren > 1 ? 's' : ''}`}
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-3 space-y-2">
                                {option.rooms.map((r, i) => (
                                    <div key={i} className="text-sm flex justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="font-medium">{r.roomName}</div>
                                            <div className="text-xs text-slate-400">
                                                {r.numAdults} adulte(s){r.numChildren > 0 && `, ${r.numChildren} enfant(s)`}
                                            </div>
                                        </div>
                                        {showPerRoomPrices && (
                                            <div className="font-semibold whitespace-nowrap">{formatAmount(r.price, option.currency)}</div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-slate-100 pt-3 flex items-center justify-between font-bold text-lg">
                                <span>Total</span>
                                <span>{formatAmount(price, option.currency)}</span>
                            </div>
                            <div className="text-xs text-slate-400 text-right -mt-2">pour {nights} nuit{nights > 1 ? 's' : ''}</div>

                            {cancellationPolicy && (
                                <div className="rounded-lg border border-slate-100 p-3 text-xs space-y-1">
                                    <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                                        <ShieldCheck className="w-3.5 h-3.5 text-[#1775FF]" /> Annulation
                                    </div>
                                    <div className="text-slate-500">
                                        Gratuite jusqu'au <span className="font-medium text-slate-800">{cancellationPolicy.cancellationDeadline || '—'}</span>
                                    </div>
                                    {cancellationPolicy.alerts.length > 0 && (
                                        <div className="text-amber-700 flex items-start gap-1 pt-1">
                                            <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" /> {cancellationPolicy.alerts.join(' · ')}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="bg-slate-50 rounded-lg p-3 flex items-start gap-2">
                                <ShieldCheck className="w-4 h-4 text-[#1775FF] shrink-0 mt-0.5" />
                                <div>
                                    <div className="text-xs font-semibold text-slate-700">Paiement sécurisé</div>
                                    <div className="text-[11px] text-slate-400">Vous allez être redirigé vers la page de paiement sécurisée SATIM.</div>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>

                {showConditions && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold">Conditions d'utilisation</h2>
                                <button onClick={() => setShowConditions(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="text-sm text-gray-600 leading-relaxed space-y-3 max-h-80 overflow-y-auto">
                                <p>En procédant à ce paiement, vous acceptez nos conditions d'utilisation et les conditions générales de paiement en ligne établies par notre partenaire bancaire (CIB / EDAHABIA).</p>
                                <p>Le montant est traité de manière sécurisée via <strong>SATIM I-PAY</strong>.</p>
                                <p>Pour tout problème de paiement, contactez le numéro gratuit SATIM <strong>3020</strong>.</p>
                            </div>
                            <div className="flex justify-end">
                                <Button onClick={() => { setTermsAccepted(true); setShowConditions(false); }} className="text-white rounded-full bg-[#1775FF] hover:bg-[#1775FF]/90">
                                    J'accepte
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}