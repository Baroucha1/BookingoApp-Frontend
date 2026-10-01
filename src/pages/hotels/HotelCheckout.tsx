// src/pages/hotels/HotelCheckout.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    User, Users, FileText, ArrowLeft, ArrowRight, Loader2,
    Star, MapPin, Calendar, Moon, ShieldCheck, Check, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import NativeBackButton from '@/components/NativeBackButton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import AppLoading from '@/components/common/AppLoading';
import {
    getHotelPolicies, initiateHotelPayment,
    type SearchOption, type BookingRoomInput,
} from '@/service/hotels/hotels.service';
import { nightsBetween } from '@/lib/hotelSearchParams';
import { useLanguage } from '@/i18n/LanguageContext';

interface CheckoutState {
    hotelName: string;
    hotelImage: string | null;
    address: string;
    starRating: string | null;
    checkInDate: string;
    checkOutDate: string;
    option: SearchOption;
}

interface AdultForm { title: 'Mr' | 'Mrs' | 'Miss' | ''; firstName: string; lastName: string; }
interface ChildForm { firstName: string; lastName: string; }
interface RoomForm { adults: AdultForm[]; children: ChildForm[]; }

export default function HotelCheckout() {
    const { state } = useLocation() as { state: CheckoutState | null };
    const navigate = useNavigate();
    const { t } = useLanguage();

    const [saving, setSaving] = useState(false);

    // ── Contact (booker) info — separate from room occupants ───────────────
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [specialRequest, setSpecialRequest] = useState('');

    // ── Traveller forms: exactly one block per room, exactly numAdults +
    // numChildren fields — count is fixed by what was chosen in search, no
    // manual add/remove, so there's no way to under-fill a slot silently. ──
    const [rooms, setRooms] = useState<RoomForm[]>(() =>
        state ? state.option.rooms.map((r) => ({
            adults: Array.from({ length: r.numAdults }, () => ({ title: '' as const, firstName: '', lastName: '' })),
            children: Array.from({ length: r.numChildren }, () => ({ firstName: '', lastName: '' })),
        })) : []
    );

    const [termsAccepted, setTermsAccepted] = useState(false);
    const [showConditions, setShowConditions] = useState(false);
    const [captchaVerified, setCaptchaVerified] = useState(false);
    const recaptchaRef = useRef<HTMLDivElement>(null);
    const recaptchaWidgetId = useRef<number | null>(null);
    const skipRecaptcha = import.meta.env.VITE_SKIP_RECAPTCHA === 'true';

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
        let isMounted = true;
        const tryRender = () => {
            if (!isMounted) return;
            if (!window.grecaptcha || typeof window.grecaptcha.render !== 'function' || !recaptchaRef.current) {
                setTimeout(tryRender, 300);
                return;
            }
            if (recaptchaWidgetId.current !== null) return;
            try {
                recaptchaWidgetId.current = window.grecaptcha.render(recaptchaRef.current, {
                    sitekey: import.meta.env.VITE_RECAPTCHA_SITE_KEY,
                    callback: () => setCaptchaVerified(true),
                    'expired-callback': () => setCaptchaVerified(false),
                });
            } catch (e) {
                // Ignore if already rendered
            }
        };

        if (window.grecaptcha?.ready) {
            window.grecaptcha.ready(tryRender);
        } else {
            tryRender();
        }

        return () => {
            isMounted = false;
        };
    }, [skipRecaptcha]);

    if (!state) {
        return (
            <div className="p-16 text-center text-slate-400">
                Aucune réservation en cours.
                <Button variant="link" onClick={() => navigate('/hotels')}>Retour à la recherche</Button>
            </div>
        );
    }

    if (saving) {
        return (
            <AppLoading
                message="Préparation de votre paiement..."
                subMessage="Redirection vers la passerelle sécurisée SATIM..."
            />
        );
    }

    const { hotelName, hotelImage, address, starRating, checkInDate, checkOutDate, option } = state;
    const nights = nightsBetween(checkInDate, checkOutDate);
    const totalAdults = option.rooms.reduce((s, r) => s + r.numAdults, 0);
    const totalChildren = option.rooms.reduce((s, r) => s + r.numChildren, 0);

    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    // Every adult needs title+firstName+lastName, every child needs both names.
    // Nothing to "forget to add" anymore — the fields already exist, they
    // just might be empty, which this catches before submit.
    const travellersComplete = useMemo(
        () => rooms.every((r) =>
            r.adults.every((a) => a.title !== '' && a.firstName.trim() !== '' && a.lastName.trim() !== '') &&
            r.children.every((c) => c.firstName.trim() !== '' && c.lastName.trim() !== '')
        ),
        [rooms]
    );

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

    const submitBooking = async () => {
        if (!isValid) {
            toast.error(!emailValid
                ? t('hotelEmailRequired')
                : t('hotelFillAllTravelers'));
            return;
        }
        if (!termsAccepted) {
            toast.error(t('hotelAcceptTermsRequired'));
            return;
        }
        let captchaToken = '';
        if (!skipRecaptcha) {
            if (typeof window.grecaptcha?.getResponse === 'function' && recaptchaWidgetId.current !== null) {
                captchaToken = window.grecaptcha.getResponse(recaptchaWidgetId.current);
            }
            if (!captchaToken) {
                toast.error(t('hotelRecaptchaRequired'));
                return;
            }
        }

        setSaving(true);
        try {
            try {
                await getHotelPolicies(option.optionId);
            } catch (err) {
                toast.error(`${t('hotelPoliciesConfirmFailed')}: ${err instanceof Error ? err.message : ''}`);
                setSaving(false);
                return;
            }

            const bookingRooms: BookingRoomInput[] = option.rooms.map((r, i) => ({
                roomId: r.roomId,
                adults: rooms[i].adults.map((a) => ({ title: a.title as 'Mr' | 'Mrs' | 'Miss', firstName: a.firstName.trim(), lastName: a.lastName.trim() })),
                children: rooms[i].children.map((c) => ({ firstName: c.firstName.trim(), lastName: c.lastName.trim() })),
            }));

            // Primary contact identity is taken from the first adult of the
            // first room — that's who's actually leading the booking.
            const lead = rooms[0].adults[0];

            const payment = await initiateHotelPayment({
                optionId: option.optionId,
                rooms: bookingRooms,
                contact: { email, firstName: lead.firstName.trim(), lastName: lead.lastName.trim(), phone: phone || undefined },
                hotelId: undefined, hotelName, checkInDate, checkOutDate,
                boardType: option.boardType, totalPrice: option.totalPrice, currency: option.currency,
                captchaToken,
            });

            // orderId isn't carried inside bookingToken — stash it so
            // SatimResult can send it back alongside bt on confirm.
            sessionStorage.setItem(`hotel_satim_orderId_${payment.bookingToken}`, payment.orderId);
            sessionStorage.setItem('hotel_satim_last_token', payment.bookingToken);

            window.location.href = payment.formUrl;
        } catch (err) {
            toast.error(err instanceof Error ? err.message : t('hotelBookingFailed'));
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F0F6FF]">
            <div
                className="relative overflow-hidden"
                style={{
                    paddingTop: 'calc(env(safe-area-inset-top, 0px) + 5rem)',
                    paddingBottom: '2.5rem',
                }}
            >
                {hotelImage && <img src={hotelImage} alt="" className="absolute inset-0 w-full h-full object-cover" />}
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-[#F0F6FF] z-10" />
                <div className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6">
                    <NativeBackButton label={t('previous')} fallbackTo="/hotels" className="mb-4" />


                    <div className="flex items-center gap-4">
                        {hotelImage && (
                            <img
                                src={hotelImage}
                                alt=""
                                className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border-2 border-white/90 shadow-lg shrink-0"
                            />
                        )}
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-lg sm:text-xl font-bold text-white drop-shadow">{hotelName}</h1>
                                {starRating && (
                                    <span className="flex gap-0.5">
                                        {Array.from({ length: Math.round(Number(starRating)) }, (_, i) => (
                                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                        ))}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1 text-xs sm:text-sm text-white/90 mt-1">
                                <MapPin className="w-3.5 h-3.5 shrink-0" />
                                <span className="line-clamp-1">{address}</span>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                <span className="text-xs bg-white/90 text-[#1775FF] px-2.5 py-1 rounded-full font-medium">
                                    {option.boardType}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">

                <div className="grid grid-cols-1 md:grid-cols-[1fr,340px] gap-6 pb-12">
                    <div className="bg-white rounded-xl border border-slate-100 p-6">
                        <div className="flex items-center gap-2 mb-1">
                            <User className="w-5 h-5 text-[#1775FF]" />
                            <span className="font-bold text-lg text-slate-800">{t('hotelYourInfo')}</span>
                        </div>
                        <p className="text-sm text-slate-500 mb-5">{t('hotelFillContactGuests')}</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                            <div>
                                <label className="text-xs text-slate-500 font-medium">{t('email')} *</label>
                                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="exemple@domaine.com" className="mt-1 w-full" />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 font-medium">{t('phone')}</label>
                                <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t('phone')} className="mt-1 w-full" />
                            </div>
                        </div>

                        {/* One block per room, exact adult/child count from search — nothing to add or forget */}
                        {option.rooms.map((r, roomIdx) => (
                            <div key={r.roomId} className="border-t border-slate-100 pt-5 mb-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <Users className="w-4 h-4 text-[#1775FF]" />
                                    <span className="text-sm font-semibold text-slate-700">{r.roomName}</span>
                                </div>
                                <p className="text-xs text-slate-400 mb-3">
                                    {r.numAdults} {r.numAdults > 1 ? t('hotelSearchAdults') : t('hotelSearchAdults')}{r.numChildren > 0 ? `, ${r.numChildren} ${r.numChildren > 1 ? t('hotelSearchChildren') : t('hotelSearchChildren')}` : ''}
                                </p>

                                {rooms[roomIdx].adults.map((a, adultIdx) => (
                                    <div key={adultIdx} className="bg-slate-50/80 p-3 rounded-xl mb-3 space-y-2 sm:space-y-0 sm:grid sm:grid-cols-4 sm:gap-2 sm:items-center">
                                        <div className="w-full">
                                            <label className="text-[11px] text-slate-400 sm:hidden block mb-1">{t('hotelCivility')}</label>
                                            <select
                                                value={a.title}
                                                onChange={(e) => updateAdult(roomIdx, adultIdx, 'title', e.target.value)}
                                                className="h-10 w-full border border-slate-200 rounded-md text-sm px-2 bg-white"
                                            >
                                                <option value="">{t('hotelCivility')}</option>
                                                <option value="Mr">{t('hotelMr')}</option>
                                                <option value="Mrs">{t('hotelMrs')}</option>
                                                <option value="Miss">{t('hotelMiss')}</option>
                                            </select>
                                        </div>
                                        <div className="w-full sm:col-span-1">
                                            <label className="text-[11px] text-slate-400 sm:hidden block mb-1">{t('hotelFirstName')}</label>
                                            <Input placeholder={t('hotelFirstName')} value={a.firstName} onChange={(e) => updateAdult(roomIdx, adultIdx, 'firstName', e.target.value.slice(0, 50))} className="w-full h-10 bg-white" />
                                        </div>
                                        <div className="w-full sm:col-span-2">
                                            <label className="text-[11px] text-slate-400 sm:hidden block mb-1">{t('hotelLastName')}</label>
                                            <Input placeholder={t('hotelLastName')} value={a.lastName} onChange={(e) => updateAdult(roomIdx, adultIdx, 'lastName', e.target.value.slice(0, 50))} className="w-full h-10 bg-white" />
                                        </div>
                                    </div>
                                ))}

                                {rooms[roomIdx].children.map((c, childIdx) => (
                                    <div key={childIdx} className="bg-slate-50/80 p-3 rounded-xl mb-3 space-y-2 sm:space-y-0 sm:grid sm:grid-cols-4 sm:gap-2 sm:items-center">
                                        <div className="text-xs font-semibold text-slate-600 sm:col-span-1">
                                            {t('hotelSearchChildren')} {childIdx + 1}
                                        </div>
                                        <div className="w-full sm:col-span-1">
                                            <label className="text-[11px] text-slate-400 sm:hidden block mb-1">{t('hotelChildFirstName')}</label>
                                            <Input placeholder={t('hotelChildFirstName')} value={c.firstName} onChange={(e) => updateChild(roomIdx, childIdx, 'firstName', e.target.value.slice(0, 50))} className="w-full h-10 bg-white" />
                                        </div>
                                        <div className="w-full sm:col-span-2">
                                            <label className="text-[11px] text-slate-400 sm:hidden block mb-1">{t('hotelChildLastName')}</label>
                                            <Input placeholder={t('hotelChildLastName')} value={c.lastName} onChange={(e) => updateChild(roomIdx, childIdx, 'lastName', e.target.value.slice(0, 50))} className="w-full h-10 bg-white" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}

                        <div className="border-t border-slate-100 pt-5">
                            <div className="flex items-center gap-2 mb-1">
                                <FileText className="w-4 h-4 text-[#1775FF]" />
                                <span className="text-sm font-semibold text-slate-700">{t('hotelAdditionalInfo')}</span>
                            </div>
                            <label className="text-xs text-slate-500">{t('hotelSpecialRequest')}</label>
                            <Textarea value={specialRequest} onChange={(e) => setSpecialRequest(e.target.value)} placeholder={t('hotelSpecialRequestPlaceholder')} className="mt-1" rows={3} />
                        </div>

                        <div className="border-t border-slate-100 pt-5 mt-2">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-sm font-semibold text-slate-700">{t('hotelPaymentMethod')}</span>
                            </div>

                            <div className="relative rounded-xl border-2 p-3 mb-4" style={{ borderColor: '#1775FF', background: 'rgba(23,117,255,0.04)' }}>
                                <span className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#1775FF' }}>
                                    <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                                </span>
                                <img src="/dhahabiaCIB.png" alt="CIB EDAHABIA" className="h-6 object-contain mb-1" />
                                <p className="font-semibold text-xs">CIB / EDAHABIA</p>
                                <p className="text-[11px] text-slate-500">{t('hotelBankCardSatim')}</p>
                            </div>

                            <label className="flex items-start gap-2 cursor-pointer mb-3">
                                <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#1775FF] cursor-pointer" />
                                <span className="text-xs text-slate-700">
                                    {t('hotelAcceptTerms')}{' '}
                                    <button type="button" onClick={() => setShowConditions(true)} className="text-[#1775FF] underline font-medium">
                                        {t('hotelTermsOfUse')}
                                    </button>
                                </span>
                            </label>

                            {!skipRecaptcha && <div className="flex justify-center mb-4"><div ref={recaptchaRef} /></div>}

                            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/hotels')}
                                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    <span>{t('previous')}</span>
                                </button>
                                <Button
                                    onClick={submitBooking}
                                    disabled={!isValid || saving || !termsAccepted || (!skipRecaptcha && !captchaVerified)}
                                    className="bg-[#F5A623] hover:bg-[#F5A623]/90 text-[#0B2A5C] font-bold gap-2"
                                >
                                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('hotelProcessingPayment')}</> : <>{t('payNow')} <ArrowRight className="w-4 h-4" /></>}
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-100 p-5 h-fit space-y-4">
                        <div className="font-bold text-slate-800">{t('hotelBookingRecap')}</div>
                        <div className="flex gap-3 items-start">
                            {hotelImage && <img src={hotelImage} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />}
                            <div>
                                <div className="font-semibold text-sm">{hotelName}</div>
                                {starRating && (
                                    <span className="flex gap-0.5 my-0.5">
                                        {Array.from({ length: Math.round(Number(starRating)) }, (_, i) => <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                                    </span>
                                )}
                                <div className="text-xs text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3" /> {address}</div>
                            </div>
                        </div>
                        <div className="space-y-2 text-sm border-t border-slate-100 pt-3">
                            <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-400" /> {t('hotelSearchCheckIn')}<br />{checkInDate}</div>
                            <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-400" /> {t('hotelSearchCheckOut')}<br />{checkOutDate}</div>
                            <div className="flex items-center gap-2"><Moon className="w-4 h-4 text-slate-400" /> {nights} {nights > 1 ? t('hotelNights') : t('hotelNight')}</div>
                            <div className="flex items-center gap-2"><Users className="w-4 h-4 text-slate-400" /> {option.rooms.length} {option.rooms.length > 1 ? t('hotelSearchRooms') : t('hotelSearchRoom').toLowerCase()} · {totalAdults + totalChildren} {totalAdults + totalChildren > 1 ? t('hotelSearchAdults') : t('hotelSearchAdults')}</div>
                        </div>
                        <div className="border-t border-slate-100 pt-3 space-y-2">
                            {option.rooms.map((r, i) => (
                                <div key={i} className="text-sm">
                                    <div className="font-medium">{r.roomName}</div>
                                    <div className="text-xs text-slate-400">{r.numAdults} {r.numAdults > 1 ? t('hotelSearchAdults') : t('hotelSearchAdults')}{r.numChildren > 0 && `, ${r.numChildren} ${r.numChildren > 1 ? t('hotelSearchChildren') : t('hotelSearchChildren')}`}</div>
                                    <div className="text-right font-semibold">{r.price} {option.currency}</div>
                                </div>
                            ))}
                        </div>
                        <div className="border-t border-slate-100 pt-3 flex items-center justify-between font-bold text-lg">
                            <span>Total</span>
                            <span>{option.totalPrice} {option.currency}</span>
                        </div>
                        <div className="text-xs text-slate-400 text-right -mt-2">({t('hotelForNights')} {nights} {nights > 1 ? t('hotelNights') : t('hotelNight')})</div>
                        <div className="bg-slate-50 rounded-lg p-3 flex items-start gap-2">
                            <ShieldCheck className="w-4 h-4 text-[#1775FF] shrink-0 mt-0.5" />
                            <div>
                                <div className="text-xs font-semibold text-slate-700">{t('hotelSatimSecurePayment')}</div>
                                <div className="text-[11px] text-slate-400">{t('hotelSecurePaymentRedirect')}</div>
                            </div>
                        </div>
                    </div>
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
                                <Button onClick={() => { setTermsAccepted(true); setShowConditions(false); }} className="text-white rounded-full" style={{ background: '#1775FF' }}>
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