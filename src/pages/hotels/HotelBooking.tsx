/*
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
    ArrowLeft, ArrowRight, Check, Plus, Trash2,
    CheckCircle2, Clock, Calendar, Loader2, MapPin,
    Building2, Users, BedDouble, ShieldCheck, AlertTriangle,
    ChevronRight, Edit2, User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import {
    searchHotels, getHotelPolicies, bookHotel,
    type SearchResult, type HotelResult, type HotelOption,
    type PoliciesResult, type BookingRoom, type GuestAdult, type GuestChild,
} from '../../service/hotels.service';

const formatAmount = (amount: number, currency: string) => `${amount.toFixed(2)} ${currency}`;

const STEPS = [
    { id: 1, label: 'Destination' },
    { id: 2, label: 'Chambre & Conditions' },
    { id: 3, label: 'Voyageurs' },
];

// ── Villes de démo (temporaire — à remplacer par GetCities une fois exposé) ──
const DEMO_CITIES = [
    { cityId: 117976, name: 'Londres, Royaume-Uni' },
    { cityId: 129552, name: 'Aberdeen, Royaume-Uni' },
];

type RoomDraft = { numAdults: number; childAges: number[] };

const newRoom = (): RoomDraft => ({ numAdults: 2, childAges: [] });

type GuestDraft = { title: string; firstName: string; lastName: string };
type ChildDraft = { firstName: string; lastName: string };

const HotelBooking = () => {
    const navigate  = useNavigate();
    const { toast } = useToast();
    const { user }  = useAuth();

    const [step, setStep] = useState(1);

    // ── Step 1 : recherche ──────────────────────────────────────────────────
    const [cityId, setCityId]           = useState<number | null>(null);
    const [checkInDate, setCheckInDate] = useState('');
    const [checkOutDate, setCheckOutDate] = useState('');
    const [rooms, setRooms]             = useState<RoomDraft[]>([newRoom()]);
    const [nationality, setNationality] = useState('DZ');
    const [searching, setSearching]     = useState(false);
    const [searchResult, setSearchResult] = useState<SearchResult | null>(null);

    // ── Step 2 : sélection option + policies ────────────────────────────────
    const [selectedHotel, setSelectedHotel]   = useState<HotelResult | null>(null);
    const [selectedOption, setSelectedOption] = useState<HotelOption | null>(null);
    const [policies, setPolicies]             = useState<PoliciesResult | null>(null);
    const [loadingPolicies, setLoadingPolicies] = useState(false);

    // ── Step 3 : voyageurs ───────────────────────────────────────────────────
    const [guestsByRoom, setGuestsByRoom] = useState<Record<string, { adults: GuestDraft[]; children: ChildDraft[] }>>({});
    const [submitting, setSubmitting]     = useState(false);
    const [bookingDone, setBookingDone]   = useState<{ bookingReference: string | null; status: string; pending?: boolean } | null>(null);

    const todayLocal = (() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })();

    // ── Helpers chambres (step 1) ────────────────────────────────────────────
    const addRoom = () => {
        if (rooms.length >= 5) return;
        setRooms(r => [...r, newRoom()]);
    };
    const removeRoom = (idx: number) => setRooms(r => r.filter((_, i) => i !== idx));
    const updateRoom = (idx: number, patch: Partial<RoomDraft>) =>
        setRooms(r => r.map((room, i) => i === idx ? { ...room, ...patch } : room));

    const canSearch = !!cityId && !!checkInDate && !!checkOutDate && rooms.length > 0;

    const handleSearch = async () => {
        if (!canSearch || !cityId) return;
        setSearching(true);
        try {
            const result = await searchHotels({
                cityIds: [cityId],
                checkInDate,
                checkOutDate,
                rooms: rooms.map(r => ({ numAdults: r.numAdults, childAges: r.childAges.length ? r.childAges : undefined })),
                nationality,
                currency: 'EUR',
            });
            setSearchResult(result);
            if (result.hotels.length === 0) {
                toast({ title: 'Aucun résultat', description: 'Aucun hôtel disponible pour ces critères.', variant: 'destructive' });
            }
        } catch (err: any) {
            toast({ title: 'Erreur de recherche', description: err.message, variant: 'destructive' });
        } finally {
            setSearching(false);
        }
    };

    // ── Sélection option → charge les policies ──────────────────────────────
    const selectOption = async (hotel: HotelResult, option: HotelOption) => {
        setSelectedHotel(hotel);
        setSelectedOption(option);
        setPolicies(null);
        setLoadingPolicies(true);
        try {
            const result = await getHotelPolicies(option.optionId);
            setPolicies(result);
            // Init guests vides pour chaque chambre de l'option
            const initialGuests: Record<string, { adults: GuestDraft[]; children: ChildDraft[] }> = {};
            option.rooms.forEach(room => {
                initialGuests[room.roomId] = {
                    adults: Array.from({ length: room.numAdults }, () => ({ title: 'Mr.', firstName: '', lastName: '' })),
                    children: Array.from({ length: room.numChildren }, () => ({ firstName: '', lastName: '' })),
                };
            });
            setGuestsByRoom(initialGuests);
            setStep(2);
        } catch (err: any) {
            toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
        } finally {
            setLoadingPolicies(false);
        }
    };

    const updateGuestAdult = (roomId: string, idx: number, patch: Partial<GuestDraft>) => {
        setGuestsByRoom(prev => ({
            ...prev,
            [roomId]: {
                ...prev[roomId],
                adults: prev[roomId].adults.map((a, i) => i === idx ? { ...a, ...patch } : a),
            },
        }));
    };
    const updateGuestChild = (roomId: string, idx: number, patch: Partial<ChildDraft>) => {
        setGuestsByRoom(prev => ({
            ...prev,
            [roomId]: {
                ...prev[roomId],
                children: prev[roomId].children.map((c, i) => i === idx ? { ...c, ...patch } : c),
            },
        }));
    };

    const guestsComplete = selectedOption
        ? selectedOption.rooms.every(room => {
            const g = guestsByRoom[room.roomId];
            if (!g) return false;
            return g.adults.every(a => a.firstName && a.lastName)
                && g.children.every(c => c.firstName && c.lastName);
        })
        : false;

    const handleBook = async () => {
        if (!selectedOption || !guestsComplete) {
            toast({ title: 'Champs manquants', description: 'Veuillez compléter les informations des voyageurs.', variant: 'destructive' });
            return;
        }
        setSubmitting(true);
        try {
            const roomsPayload: BookingRoom[] = selectedOption.rooms.map(room => {
                const g = guestsByRoom[room.roomId];
                return {
                    roomId: room.roomId,
                    adults: g.adults as GuestAdult[],
                    children: g.children.length ? (g.children as GuestChild[]) : undefined,
                };
            });

            const result = await bookHotel({
                optionId: selectedOption.optionId,
                rooms: roomsPayload,
                hotelId: selectedHotel ? Number(selectedHotel.hotelId) : undefined,
                hotelName: selectedHotel?.name,
                checkInDate,
                checkOutDate,
                boardType: selectedOption.boardType,
            });

            if ('status' in result && result.status === 'PENDING_VERIFICATION') {
                setBookingDone({ bookingReference: null, status: 'PENDING_VERIFICATION', pending: true });
            } else if ('bookingReference' in result) {
                setBookingDone({ bookingReference: result.bookingReference, status: result.status });
            }
        } catch (err: any) {
            toast({ title: 'Erreur de réservation', description: err.message, variant: 'destructive' });
        } finally {
            setSubmitting(false);
        }
    };

    const progressPct = (step / STEPS.length) * 100;

    // ── Écran de confirmation ────────────────────────────────────────────────
    if (bookingDone) {
        return (
            <div className="relative min-h-screen flex items-center justify-center px-4 py-12" style={{ background: '#F4F6FA' }}>
                <div className="text-center max-w-md w-full space-y-5 bg-white rounded-3xl p-10 shadow-xl">
                    <div className="relative w-24 h-24 mx-auto">
                        <span className="absolute inset-0 rounded-full animate-ping" style={{ background: bookingDone.pending ? 'rgba(251,191,36,0.15)' : 'rgba(8,101,254,0.15)' }} />
                        <div className="relative w-24 h-24 rounded-full flex items-center justify-center shadow-xl"
                             style={{ background: bookingDone.pending ? '#F59E0B' : '#0865FE' }}>
                            {bookingDone.pending
                                ? <AlertTriangle className="w-12 h-12 text-white" strokeWidth={2.5} />
                                : <CheckCircle2 className="w-12 h-12 text-white" strokeWidth={2.5} />}
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {bookingDone.pending ? 'Vérification en cours' : 'Réservation confirmée !'}
                    </h1>
                    <p className="text-gray-500 text-sm">
                        {bookingDone.pending
                            ? "La réponse de l'hôtel a pris plus de temps que prévu. Nous vérifions le statut de votre réservation."
                            : `Votre réservation pour ${selectedHotel?.name} a été enregistrée.`}
                    </p>
                    {bookingDone.bookingReference && (
                        <div className="inline-block border-2 border-blue-100 rounded-full px-6 py-2">
                            <span className="font-mono font-bold text-base tracking-wider text-gray-800">{bookingDone.bookingReference}</span>
                        </div>
                    )}
                    <Badge variant="outline" className={cn(
                        'font-semibold px-4 py-1',
                        bookingDone.pending ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    )}>
                        {bookingDone.status}
                    </Badge>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                        <Button onClick={() => navigate('/client')} className="text-white font-semibold rounded-full px-6" style={{ background: '#0865FE' }}>
                            Tableau de bord
                        </Button>
                        <Button variant="outline" onClick={() => window.location.reload()} className="rounded-full px-6">
                            Nouvelle recherche
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-8 lg:py-10" style={{ background: '#F4F6FA' }}>
            <div className="container space-y-4 max-w-3xl mx-auto px-4">

                {/!* ── Stepper header ── *!/}
                <div className="bg-white rounded-2xl px-5 pt-4 pb-5 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">ÉTAPE {step} SUR {STEPS.length}</p>
                            <h2 className="text-xl font-bold text-gray-900 mt-0.5">{STEPS[step - 1].label}</h2>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold" style={{ background: '#EFF6FF', color: '#0865FE' }}>
                            <svg className="w-4 h-4" viewBox="0 0 36 36">
                                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#dbeafe" strokeWidth="3.5" />
                                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#0865FE" strokeWidth="3.5"
                                        strokeDasharray={`${progressPct} 100`} strokeLinecap="round" transform="rotate(-90 18 18)" />
                            </svg>
                            {Math.round(progressPct)}% complété
                        </div>
                    </div>

                    <div className="flex items-center mt-4">
                        {STEPS.map((s, idx) => (
                            <div key={s.id} className="flex items-center flex-1 last:flex-none">
                                <div className="flex flex-col items-center">
                                    <div className={cn(
                                        'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                                        s.id < step && 'text-white shadow-sm',
                                        s.id === step && 'text-white shadow-md scale-110',
                                        s.id > step && 'bg-white text-gray-300 border-2 border-gray-200',
                                    )} style={{ background: s.id <= step ? '#0865FE' : undefined }}>
                                        {s.id < step ? <Check className="w-4 h-4" strokeWidth={3} /> : s.id}
                                    </div>
                                    <span className={cn('text-[11px] mt-1.5 font-semibold',
                                        s.id === step ? 'text-blue-600' : s.id < step ? 'text-blue-400' : 'text-gray-300'
                                    )}>{s.label}</span>
                                </div>
                                {idx < STEPS.length - 1 && (
                                    <div className="flex-1 h-0.5 mx-3 mb-4 rounded-full transition-all"
                                         style={{ background: s.id < step ? '#0865FE' : '#E5E7EB' }} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}>

                        {/!* ══════ STEP 1 — Recherche ══════ *!/}
                        {step === 1 && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-5">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-1">Où souhaitez-vous séjourner ? 🏨</h3>
                                    <p className="text-sm text-gray-400">Recherchez un hôtel selon vos critères</p>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-sm font-semibold text-gray-700">Destination *</Label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {DEMO_CITIES.map(c => (
                                            <button key={c.cityId} onClick={() => setCityId(c.cityId)}
                                                    className="flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all"
                                                    style={{ borderColor: cityId === c.cityId ? '#0865FE' : '#E5E7EB', background: cityId === c.cityId ? 'rgba(8,101,254,0.03)' : '#fff' }}>
                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#EFF6FF' }}>
                                                    <MapPin className="w-4 h-4" style={{ color: '#0865FE' }} />
                                                </div>
                                                <span className="font-semibold text-sm text-gray-800">{c.name}</span>
                                                {cityId === c.cityId && <Check className="w-4 h-4 ml-auto" style={{ color: '#0865FE' }} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-sm font-semibold text-gray-700">Date d'arrivée *</Label>
                                        <input type="date" value={checkInDate} min={todayLocal} onChange={e => setCheckInDate(e.target.value)}
                                               className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-sm font-semibold text-gray-700">Date de départ *</Label>
                                        <input type="date" value={checkOutDate} min={checkInDate || todayLocal} onChange={e => setCheckOutDate(e.target.value)}
                                               className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-sm font-semibold text-gray-700">Nationalité *</Label>
                                    <input value={nationality} onChange={e => setNationality(e.target.value.toUpperCase().slice(0, 2))}
                                           placeholder="DZ" maxLength={2}
                                           className="w-32 h-11 rounded-xl border border-gray-200 px-4 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
                                </div>

                                {/!* Chambres *!/}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm font-semibold text-gray-700">Chambres ({rooms.length}/5)</Label>
                                        <Button variant="outline" size="sm" onClick={addRoom} disabled={rooms.length >= 5}
                                                className="rounded-full text-xs font-semibold h-8 px-3" style={{ borderColor: '#0865FE', color: '#0865FE' }}>
                                            <Plus className="w-3.5 h-3.5 mr-1" /> Ajouter une chambre
                                        </Button>
                                    </div>
                                    {rooms.map((room, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200">
                                            <BedDouble className="w-4 h-4 text-gray-400 shrink-0" />
                                            <span className="text-sm font-semibold text-gray-700 shrink-0">Chambre {idx + 1}</span>
                                            <div className="flex items-center gap-2 ml-auto">
                                                <span className="text-xs text-gray-400">Adultes</span>
                                                <button onClick={() => updateRoom(idx, { numAdults: Math.max(1, room.numAdults - 1) })}
                                                        className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: '#0865FE' }}>−</button>
                                                <span className="w-5 text-center font-bold text-sm">{room.numAdults}</span>
                                                <button onClick={() => updateRoom(idx, { numAdults: Math.min(4, room.numAdults + 1) })}
                                                        className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: '#0865FE' }}>+</button>
                                            </div>
                                            {rooms.length > 1 && (
                                                <button onClick={() => removeRoom(idx)} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-red-50 shrink-0">
                                                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <Button onClick={handleSearch} disabled={!canSearch || searching}
                                        className="w-full h-11 rounded-full font-semibold text-white" style={{ background: '#0865FE' }}>
                                    {searching ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Recherche...</> : <>Rechercher <ArrowRight className="w-4 h-4 ml-2" /></>}
                                </Button>

                                {/!* Résultats *!/}
                                {searchResult && searchResult.hotels.length > 0 && (
                                    <div className="space-y-3 pt-2">
                                        <p className="text-sm font-semibold text-gray-600">{searchResult.hotels.length} hôtel(s) trouvé(s)</p>
                                        {searchResult.hotels.map(hotel => (
                                            <div key={hotel.hotelId} className="rounded-xl border border-gray-200 p-4 space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#EFF6FF' }}>
                                                        <Building2 className="w-5 h-5" style={{ color: '#0865FE' }} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">{hotel.name}</p>
                                                        {hotel.starRating && <p className="text-xs text-gray-400">{hotel.starRating} ★</p>}
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    {hotel.options.map(option => (
                                                        <button key={option.optionId} onClick={() => selectOption(hotel, option)}
                                                                disabled={loadingPolicies}
                                                                className="w-full flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-100 hover:border-blue-300 hover:bg-blue-50/30 transition-all text-left">
                                                            <div>
                                                                <p className="font-semibold text-sm text-gray-800">{option.boardType}</p>
                                                                {option.dealName && <p className="text-xs text-emerald-600 font-medium">{option.dealName}</p>}
                                                            </div>
                                                            <div className="text-right shrink-0">
                                                                <p className="font-bold" style={{ color: '#FFB400' }}>{formatAmount(option.totalPrice, searchResult.currency)}</p>
                                                                <p className="text-[11px] text-gray-400">total séjour</p>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/!* ══════ STEP 2 — Conditions (policies) ══════ *!/}
                        {step === 2 && selectedOption && (
                            <div className="space-y-4">
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="flex">
                                        <div className="w-1 shrink-0" style={{ background: '#0865FE' }} />
                                        <div className="flex-1 p-5 space-y-4">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="font-bold text-gray-900">{selectedHotel?.name}</h3>
                                                    <p className="text-xs text-gray-400 mt-0.5">{selectedOption.boardType}</p>
                                                </div>
                                                <button onClick={() => setStep(1)} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-200 hover:bg-gray-50" style={{ color: '#0865FE' }}>
                                                    <Edit2 className="w-3 h-3" /> Changer
                                                </button>
                                            </div>

                                            {loadingPolicies && (
                                                <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
                                                    <Loader2 className="w-4 h-4 animate-spin" /> Chargement des conditions...
                                                </div>
                                            )}

                                            {policies && (
                                                <>
                                                    <div className="flex items-center gap-2.5 p-3.5 rounded-xl" style={{ background: '#EFF6FF' }}>
                                                        <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: '#0865FE' }} />
                                                        <div>
                                                            <p className="text-xs font-bold" style={{ color: '#0865FE' }}>Annulation gratuite jusqu'au</p>
                                                            <p className="text-xs mt-0.5" style={{ color: '#1d4ed8' }}>{policies.cancellationDeadline}</p>
                                                        </div>
                                                    </div>

                                                    {policies.restrictions.length > 0 && (
                                                        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50">
                                                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                                                            <div className="text-xs text-amber-700">
                                                                {policies.restrictions.join(', ')}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {policies.alerts.length > 0 && (
                                                        <div className="space-y-1.5">
                                                            {policies.alerts.map((alert, i) => (
                                                                <p key={i} className="text-xs text-gray-500 flex items-start gap-2">
                                                                    <span className="mt-1 w-1 h-1 rounded-full bg-gray-400 shrink-0" /> {alert}
                                                                </p>
                                                            ))}
                                                        </div>
                                                    )}

                                                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                                                        <span className="text-sm font-medium text-gray-500">Total à payer</span>
                                                        <span className="text-2xl font-bold" style={{ color: '#FFB400' }}>
                              {formatAmount(policies.totalPrice, policies.currency)}
                            </span>
                                                    </div>

                                                    <Button onClick={() => setStep(3)} className="w-full h-11 rounded-full font-semibold text-white" style={{ background: '#0865FE' }}>
                                                        Continuer <ArrowRight className="w-4 h-4 ml-2" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/!* ══════ STEP 3 — Voyageurs ══════ *!/}
                        {step === 3 && selectedOption && (
                            <div className="space-y-4">
                                {selectedOption.rooms.map((room, roomIdx) => {
                                    const guests = guestsByRoom[room.roomId];
                                    if (!guests) return null;
                                    return (
                                        <div key={room.roomId} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                            <div className="flex">
                                                <div className="w-1 shrink-0" style={{ background: '#0865FE' }} />
                                                <div className="flex-1 p-5 space-y-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#EFF6FF' }}>
                                                            <Users className="w-4 h-4" style={{ color: '#0865FE' }} />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-gray-900">Chambre {roomIdx + 1} — {room.roomName}</h3>
                                                            <p className="text-xs text-gray-400">{room.numAdults} adulte(s){room.numChildren ? `, ${room.numChildren} enfant(s)` : ''}</p>
                                                        </div>
                                                    </div>

                                                    {guests.adults.map((adult, i) => (
                                                        <div key={i} className="grid sm:grid-cols-3 gap-3">
                                                            <div className="space-y-1.5">
                                                                <Label className="text-xs font-semibold text-gray-600">Titre</Label>
                                                                <select value={adult.title} onChange={e => updateGuestAdult(room.roomId, i, { title: e.target.value })}
                                                                        className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm">
                                                                    <option value="Mr.">Mr.</option>
                                                                    <option value="Mrs.">Mrs.</option>
                                                                    <option value="Miss">Miss</option>
                                                                </select>
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <Label className="text-xs font-semibold text-gray-600">Prénom *</Label>
                                                                <input value={adult.firstName} onChange={e => updateGuestAdult(room.roomId, i, { firstName: e.target.value })}
                                                                       placeholder="Prénom"
                                                                       className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm" />
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <Label className="text-xs font-semibold text-gray-600">Nom *</Label>
                                                                <input value={adult.lastName} onChange={e => updateGuestAdult(room.roomId, i, { lastName: e.target.value })}
                                                                       placeholder="Nom"
                                                                       className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm" />
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {guests.children.map((child, i) => (
                                                        <div key={i} className="grid sm:grid-cols-2 gap-3">
                                                            <div className="space-y-1.5">
                                                                <Label className="text-xs font-semibold text-gray-600">Prénom (enfant) *</Label>
                                                                <input value={child.firstName} onChange={e => updateGuestChild(room.roomId, i, { firstName: e.target.value })}
                                                                       placeholder="Prénom"
                                                                       className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm" />
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <Label className="text-xs font-semibold text-gray-600">Nom (enfant) *</Label>
                                                                <input value={child.lastName} onChange={e => updateGuestChild(room.roomId, i, { lastName: e.target.value })}
                                                                       placeholder="Nom"
                                                                       className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm" />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                <div className="rounded-2xl p-5 flex items-center justify-between gap-4" style={{ background: '#0865FE' }}>
                                    <div className="text-white">
                                        <p className="text-xs opacity-75 font-medium">Montant total</p>
                                        <p className="text-3xl font-black mt-0.5">{policies && formatAmount(policies.totalPrice, policies.currency)}</p>
                                    </div>
                                    <button onClick={handleBook} disabled={submitting || !guestsComplete}
                                            className="flex items-center gap-2 bg-white rounded-xl px-5 py-3 shrink-0 hover:bg-gray-50 transition-colors disabled:opacity-40 shadow-lg font-bold"
                                            style={{ color: '#0865FE' }}>
                                        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                        <span>{submitting ? 'Réservation...' : 'Confirmer la réservation'}</span>
                                    </button>
                                </div>
                            </div>
                        )}

                    </motion.div>
                </AnimatePresence>

                {/!* ── Nav buttons ── *!/}
                <div className="flex items-center justify-between gap-3 pb-6">
                    <Button variant="outline" onClick={() => step === 1 ? navigate('/') : setStep(s => s - 1)}
                            className="rounded-full px-5 h-10 font-medium text-gray-600 border-gray-200">
                        <ArrowLeft className="w-4 h-4 mr-2" />{step === 1 ? "Retour à l'accueil" : 'Retour'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default HotelBooking;*/
