import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
    Star, ArrowLeft, ArrowRight, ShieldCheck, AlertTriangle, Calendar, User,
    Utensils, Check, Search, ArrowUpDown, X, Loader2, Sparkles, Building2,
    Clock, Info, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import NativeBackButton from '@/components/NativeBackButton';
import { cn } from '@/lib/utils';
import AppLoading from '@/components/common/AppLoading';
import { decodeHotelSearchParams, nightsBetween, formatDateRangeFr } from '@/lib/hotelSearchParams';
import { format } from 'date-fns';
import { fr, enUS, ar } from 'date-fns/locale';
import { useLanguage } from '@/i18n/LanguageContext';
import {
    searchHotels, getHotelDetailsBatch,
    type SearchHotelResult, type SearchOption, getHotelPolicies, HotelPolicies,
} from '@/service/hotels/hotels.service';
import type { TravellandaHotelDetails } from '@/service/admin/hotel/staticdataTravellenda.ts';

interface RoomCard {
    roomName: string;
    price: number;
    currency: string;
    bestOption: SearchOption;
}

function formatBoardType(boardType?: string, t?: (k: any) => string) {
    if (!boardType) return t ? t('hotelRoomOnly') : 'Hébergement';
    const lower = boardType.toLowerCase();
    if (lower.includes('breakfast') || lower === 'bb') return t ? t('hotelBreakfastIncluded') : 'Petit-déjeuner inclus';
    if (lower.includes('half board') || lower === 'hb') return t ? t('hotelHalfBoard') : 'Demi-pension';
    if (lower.includes('full board') || lower === 'fb') return t ? t('hotelFullBoard') : 'Pension complète';
    if (lower.includes('all inclusive') || lower === 'ai') return t ? t('hotelAllInclusive') : 'Tout compris';
    if (lower.includes('room only') || lower === 'ro') return t ? t('hotelRoomOnly') : 'Hébergement seul';
    return boardType;
}

function parseCancellationDeadline(deadlineStr?: string | null): Date | null {
    if (!deadlineStr || typeof deadlineStr !== 'string') return null;
    const str = deadlineStr.trim();
    if (!str || str.toLowerCase() === 'n/a' || str.toLowerCase() === 'null') return null;

    const dmy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
    if (dmy) {
        const [, d, m, y, h, min, s] = dmy;
        const date = new Date(Number(y), Number(m) - 1, Number(d), Number(h ?? 23), Number(min ?? 59), Number(s ?? 59));
        if (!isNaN(date.getTime())) return date;
    }

    const isoDate = new Date(str);
    if (!isNaN(isoDate.getTime())) return isoDate;

    return null;
}

function isCancellationDeadlinePassed(deadlineStr?: string | null): boolean {
    if (!deadlineStr || !deadlineStr.trim()) return true;
    const parsed = parseCancellationDeadline(deadlineStr);
    if (!parsed) return true;
    return parsed.getTime() < Date.now();
}

function formatDeadlineDisplay(deadlineStr?: string | null): string {
    if (!deadlineStr || !deadlineStr.trim()) return '';
    const date = parseCancellationDeadline(deadlineStr);
    if (!date) return deadlineStr;
    try {
        const hasTime = deadlineStr.includes(':');
        return format(date, hasTime ? "d MMMM yyyy 'à' HH:mm" : "d MMMM yyyy", { locale: fr });
    } catch {
        return deadlineStr;
    }
}

export default function HotelRoomSelect() {
    const { hotelId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const params = decodeHotelSearchParams(searchParams);
    const { t, language } = useLanguage();
    const dateLocale = language === 'ar' ? ar : language === 'en' ? enUS : fr;

    const [loading, setLoading] = useState(true);
    const [details, setDetails] = useState<TravellandaHotelDetails | null>(null);
    const [searchResult, setSearchResult] = useState<SearchHotelResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Current Step: 1 = Choix de chambre, 2 = Confirmation des conditions
    const [step, setStep] = useState<1 | 2>(1);

    // Selected room
    const [selectedRoom, setSelectedRoom] = useState<RoomCard | null>(null);

    // Policy check state
    const [policiesByOption, setPoliciesByOption] = useState<Record<string, HotelPolicies>>({});
    const [checkingPolicies, setCheckingPolicies] = useState(false);
    const [policyError, setPolicyError] = useState<string | null>(null);

    // Filter & Sort
    const [selectedBoardFilter, setSelectedBoardFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortByPrice, setSortByPrice] = useState<'asc' | 'desc'>('asc');

    // Fetch hotel details and available rooms
    useEffect(() => {
        if (!hotelId) return;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const [detailsResult] = await getHotelDetailsBatch([Number(hotelId)]);
                if (!detailsResult) {
                    setError('Hôtel introuvable');
                } else {
                    setDetails(detailsResult);
                }

                if (params) {
                    try {
                        const result = await searchHotels({
                            hotelIds: [Number(hotelId)],
                            checkInDate: params.checkInDate,
                            checkOutDate: params.checkOutDate,
                            rooms: params.rooms,
                            nationality: params.nationality,
                            availableOnly: params.availableOnly,
                        });
                        setSearchResult(result.hotels[0] ?? null);
                    } catch (searchErr) {
                        console.warn('Erreur recherche chambres hôtel:', searchErr);
                    }
                }
            } catch (err) {
                console.error('Erreur chargement:', err);
                setError(err instanceof Error ? err.message : 'Échec du chargement');
            } finally {
                setLoading(false);
            }
        })();
    }, [hotelId]);

    // Handle policy check when entering Step 2
    const handleSelectRoom = async (room: RoomCard) => {
        setSelectedRoom(room);
        setStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });

        const optionId = room.bestOption.optionId;
        if (!policiesByOption[optionId]) {
            setCheckingPolicies(true);
            setPolicyError(null);
            try {
                const result = await getHotelPolicies(optionId);
                setPoliciesByOption((prev) => ({ ...prev, [optionId]: result }));
            } catch (err) {
                setPolicyError(err instanceof Error ? err.message : 'Échec de la récupération des conditions');
            } finally {
                setCheckingPolicies(false);
            }
        }
    };

    // Proceed to Step 3: Checkout / Remplir informations
    const handleProceedToCheckout = () => {
        if (!details || !selectedRoom) return;
        const option = selectedRoom.bestOption;
        navigate('/hotels/checkout', {
            state: {
                hotelName: details.name,
                hotelImage: details.images?.[0] ?? null,
                address: details.address,
                starRating: details.starRating,
                checkInDate: params?.checkInDate,
                checkOutDate: params?.checkOutDate,
                option,
                cancellationPolicy: policiesByOption[option.optionId]?.policies ?? null,
            },
        });
    };

    if (loading) {
        return <AppLoading message="Chargement des formules disponibles..." />;
    }

    if (error || !details) {
        return (
            <div className="min-h-screen bg-[#F0F6FF] flex items-center justify-center p-6">
                <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-sm space-y-4">
                    <p className="text-red-500 font-semibold">{error ?? 'Hôtel introuvable'}</p>
                    <Button onClick={() => navigate(-1)} className="bg-[#1775FF] text-white rounded-xl">
                        Retour aux résultats
                    </Button>
                </div>
            </div>
        );
    }

    // Process room cards
    const roomCards: RoomCard[] = [];
    if (searchResult) {
        const byRoomName = new Map<string, RoomCard>();
        for (const option of searchResult.options) {
            for (const room of option.rooms) {
                const existing = byRoomName.get(room.roomName);
                if (!existing || room.price < existing.price) {
                    byRoomName.set(room.roomName, {
                        roomName: room.roomName,
                        price: room.price,
                        currency: option.currency,
                        bestOption: option,
                    });
                }
            }
        }
        roomCards.push(...byRoomName.values());
    }

    // Board types counts
    const boardTypeCounts: Record<string, number> = {};
    for (const room of roomCards) {
        const bt = formatBoardType(room.bestOption.boardType);
        boardTypeCounts[bt] = (boardTypeCounts[bt] || 0) + 1;
    }
    const uniqueBoardTypes = Object.keys(boardTypeCounts);

    // Filter & Sort
    let filteredRooms = [...roomCards];
    if (selectedBoardFilter !== 'all') {
        filteredRooms = filteredRooms.filter((r) => formatBoardType(r.bestOption.boardType) === selectedBoardFilter);
    }
    if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        filteredRooms = filteredRooms.filter((r) => r.roomName.toLowerCase().includes(q));
    }
    filteredRooms.sort((a, b) => (sortByPrice === 'desc' ? b.price - a.price : a.price - b.price));

    const nights = params ? nightsBetween(params.checkInDate, params.checkOutDate) : 0;
    const totalAdults = params ? params.rooms.reduce((s, r) => s + r.numAdults, 0) : 0;
    const totalChildren = params ? params.rooms.reduce((s, r) => s + r.childAges.length, 0) : 0;

    // Policies for currently selected room
    const currentPolicies = selectedRoom ? policiesByOption[selectedRoom.bestOption.optionId] : null;
    const cancellationDeadline = currentPolicies?.policies?.cancellationDeadline;
    const isDeadlinePassed = isCancellationDeadlinePassed(cancellationDeadline);
    const deadlineFormatted = formatDeadlineDisplay(cancellationDeadline);

    return (
        <div className="min-h-screen bg-[#F0F6FF] pb-6">









            <div
                className="max-w-4xl mx-auto px-4 space-y-6"
                style={{
                    paddingTop: 'calc(env(safe-area-inset-top, 0px) + 5.5rem)',
                }}
            >
                {/* Hotel Reminder Summary Card */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                        {details.images?.[0] ? (
                            <img
                                src={details.images[0]}
                                alt=""
                                className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-100"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                                <Building2 className="w-7 h-7 text-[#1775FF]" />
                            </div>
                        )}
                        <div>
                            <div className="flex items-center gap-1.5">
                                <h1 className="font-extrabold text-base sm:text-lg text-slate-900 leading-snug">
                                    {details.name}
                                </h1>
                                {details.starRating && (
                                    <span className="flex text-amber-400 text-xs">
                                        {'★'.repeat(Math.min(5, Math.round(Number(details.starRating))))}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{details.address}</p>

                            {params && (
                                <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-600">
                                    <span className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg font-medium">
                                        <Calendar className="w-3.5 h-3.5 text-[#1775FF]" />
                                        {formatDateRangeFr(params.checkInDate, params.checkOutDate)} ({nights} {nights > 1 ? t('hotelNights') : t('hotelNight')})
                                    </span>
                                    <span className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg font-medium">
                                        <User className="w-3.5 h-3.5 text-[#1775FF]" />
                                        {totalAdults} {totalAdults > 1 ? t('hotelSearchAdults') : t('hotelSearchAdults')}{totalChildren > 0 ? `, ${totalChildren} ${totalChildren > 1 ? t('hotelSearchChildren') : t('hotelSearchChildren')}` : ''}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mb-4">
                    <NativeBackButton fallbackTo="/hotels" variant="ghost" />
                </div>
                {/* ÉTAPE 1 : CHOIX DU TYPE DE CHAMBRE                           */}
                {/* ══════════════════════════════════════════════════════════════ */}
                {step === 1 && (
                    <div className="space-y-4 animate-in fade-in duration-200 mt-6 pt-2">
                        {/* Title and Filters Toolbar */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                    <h2 className="text-base sm:text-lg font-bold text-slate-900">
                                        {t('hotelSelectRoomType')}
                                    </h2>
                                    <p className="text-xs text-slate-500">
                                        {t('hotelSelectFormulaDesc')}
                                    </p>
                                </div>
                                {roomCards.length > 0 && (
                                    <span className="text-xs font-bold bg-[#1775FF]/10 text-[#1775FF] px-3.5 py-1.5 rounded-full w-fit">
                                        {filteredRooms.length} {t('hotelFormulasAvailable')}
                                    </span>
                                )}
                            </div>

                            {/* Meal Plan Filter Chips */}
                            {uniqueBoardTypes.length > 1 && (
                                <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 -mx-1 px-1 scrollbar-none">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedBoardFilter('all')}
                                        className={cn(
                                            "text-xs font-bold px-3.5 py-1.5 rounded-full whitespace-nowrap transition-all shrink-0 cursor-pointer shadow-2xs",
                                            selectedBoardFilter === 'all'
                                                ? "bg-[#1775FF] text-white shadow-xs"
                                                : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                                        )}
                                    >
                                        {t('hotelAllFormulas')} ({roomCards.length})
                                    </button>
                                    {uniqueBoardTypes.map((bt) => (
                                        <button
                                            key={bt}
                                            type="button"
                                            onClick={() => setSelectedBoardFilter(bt)}
                                            className={cn(
                                                "text-xs font-bold px-3.5 py-1.5 rounded-full whitespace-nowrap transition-all shrink-0 cursor-pointer shadow-2xs",
                                                selectedBoardFilter === bt
                                                    ? "bg-[#1775FF] text-white shadow-xs"
                                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                                            )}
                                        >
                                            {formatBoardType(bt, t)} ({boardTypeCounts[bt]})
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Search & Sort */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2 border-t border-slate-100">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Rechercher (ex: Standard, Deluxe, Suite...)"
                                        className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#1775FF]/20"
                                    />
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setSortByPrice(sortByPrice === 'asc' ? 'desc' : 'asc')}
                                    className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
                                >
                                    <ArrowUpDown className="w-3.5 h-3.5 text-[#1775FF]" />
                                    <span>{sortByPrice === 'asc' ? t('hotelSortPriceAsc') : t('hotelSortPriceDesc')}</span>
                                </button>
                            </div>
                        </div>

                        {/* Rooms List */}
                        {filteredRooms.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-3">
                                <p className="text-sm text-slate-500">{t('hotelNoRoomMatch')}</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => { setSelectedBoardFilter('all'); setSearchQuery(''); }}
                                    className="rounded-xl text-xs"
                                >
                                    {t('hotelReset')}
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {filteredRooms.map((room) => (
                                    <div
                                        key={room.roomName}
                                        className="bg-white rounded-2xl border border-slate-200/80 hover:border-[#1775FF]/40 shadow-xs hover:shadow-md transition-all flex flex-col justify-between p-5"
                                    >
                                        <div>
                                            <div className="flex items-start justify-between gap-2.5">
                                                <h3 className="font-bold text-sm sm:text-base text-slate-900 leading-snug">
                                                    {room.roomName}
                                                </h3>
                                                <span className="text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-[#0454E8] shrink-0">
                                                    {formatBoardType(room.bestOption.boardType, t)}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-3">
                                                <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg">
                                                    <Utensils className="w-3.5 h-3.5 text-slate-400" />
                                                    <span>{formatBoardType(room.bestOption.boardType, t)}</span>
                                                </div>
                                                {params && (
                                                    <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg">
                                                        <User className="w-3.5 h-3.5 text-slate-400" />
                                                        <span>{totalAdults} {totalAdults > 1 ? t('hotelSearchAdults') : t('hotelSearchAdults')}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                                            <div>
                                                <div className="text-[10px] text-slate-400 font-medium">{t('hotelPriceForStay')}</div>
                                                <div className="text-base sm:text-lg font-black text-[#0454E8] leading-tight">
                                                    {Math.round(room.price).toLocaleString('fr-FR')} <span className="text-xs font-bold text-slate-600">{room.currency}</span>
                                                </div>
                                                {nights > 0 && (
                                                    <div className="text-[10px] text-slate-400">
                                                        {t('hotelForNights')} {nights} {nights > 1 ? t('hotelNights') : t('hotelNight')}
                                                    </div>
                                                )}
                                            </div>

                                            <Button
                                                type="button"
                                                onClick={() => handleSelectRoom(room)}
                                                className="bg-[#FFAA01] hover:bg-[#FFAA01]/90 text-[#002161] font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer"
                                            >
                                                {t('hotelSelectRoom')}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════════ */}
                {/* ÉTAPE 2 : CONFIRMATION DES CONDITIONS                          */}
                {/* ══════════════════════════════════════════════════════════════ */}
                {step === 2 && selectedRoom && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                        {/* Section Title */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                                    {t('hotelRoomConditionsTitle')}
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {t('hotelRoomConditionsDesc')}
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setStep(1)}
                                className="rounded-xl text-xs gap-1 border-slate-200"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                <span>{t('hotelAnotherRoom')}</span>
                            </Button>
                        </div>

                        {/* Chosen Room Recap */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
                            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                {t('hotelSelectedRoom')}
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                                <div>
                                    <h3 className="font-extrabold text-base text-slate-900">
                                        {selectedRoom.roomName}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs font-bold text-[#0454E8] bg-blue-50 px-2.5 py-0.5 rounded-full">
                                            {formatBoardType(selectedRoom.bestOption.boardType, t)}
                                        </span>
                                        <span className="text-xs text-slate-500">
                                            {t('hotelCapacity')} {totalAdults} {totalAdults > 1 ? t('hotelSearchAdults') : t('hotelSearchAdults')}{totalChildren > 0 ? `, ${totalChildren} ${totalChildren > 1 ? t('hotelSearchChildren') : t('hotelSearchChildren')}` : ''}
                                        </span>
                                    </div>
                                </div>

                                <div className="sm:text-right">
                                    <div className="text-xs text-slate-400">{t('hotelTotalStayPrice')}</div>
                                    <div className="text-2xl font-black text-[#0454E8]">
                                        {Math.round(selectedRoom.price).toLocaleString('fr-FR')} <span className="text-sm font-bold text-slate-700">{selectedRoom.currency}</span>
                                    </div>
                                    <div className="text-[11px] text-slate-500">
                                        {t('hotelTaxesIncluded')} ({nights} {nights > 1 ? t('hotelNights') : t('hotelNight')})
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <span className="text-slate-500 block">{t('hotelSearchCheckIn')}</span>
                                    <span className="font-bold text-slate-800">
                                        {params?.checkInDate ? format(new Date(params.checkInDate), 'd MMMM yyyy', { locale: dateLocale }) : '—'}
                                    </span>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <span className="text-slate-500 block">{t('hotelSearchCheckOut')}</span>
                                    <span className="font-bold text-slate-800">
                                        {params?.checkOutDate ? format(new Date(params.checkOutDate), 'd MMMM yyyy', { locale: dateLocale }) : '—'}
                                    </span>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <span className="text-slate-500 block">{t('hotelDuration')}</span>
                                    <span className="font-bold text-slate-800">
                                        {nights} {nights > 1 ? t('hotelNights') : t('hotelNight')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Conditions & Cancellation Policy Card */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-[#1775FF]" />
                                    <span>{t('hotelCancellationPolicyTitle')}</span>
                                </div>
                                {checkingPolicies && (
                                    <span className="flex items-center gap-1.5 text-xs text-blue-600 font-medium animate-pulse">
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        {t('hotelLiveChecking')}
                                    </span>
                                )}
                            </div>

                            {checkingPolicies ? (
                                <div className="py-8 text-center space-y-2">
                                    <Loader2 className="w-6 h-6 animate-spin text-[#1775FF] mx-auto" />
                                    <p className="text-xs text-slate-500">{t('hotelFetchingPolicies')}</p>
                                </div>
                            ) : policyError ? (
                                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                                    <span>{policyError}</span>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Cancellation Status Banner */}
                                    {cancellationDeadline ? (
                                        !isDeadlinePassed ? (
                                            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                                                <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                                <div>
                                                    <div className="font-bold text-emerald-800 text-sm">
                                                        {t('hotelFreeCancellationPossible')}
                                                    </div>
                                                    <div className="text-xs text-emerald-700 mt-0.5">
                                                        {t('hotelFreeCancelUntil')}{' '}
                                                        <span className="font-bold underline">{deadlineFormatted}</span>.
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                                                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                                <div>
                                                    <div className="font-bold text-amber-800 text-sm">
                                                        {t('hotelNonRefundable')}
                                                    </div>
                                                    <div className="text-xs text-amber-700 mt-0.5">
                                                        {t('hotelNonRefundableNotice')}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    ) : (
                                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                                            <Info className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                                            <div>
                                                <div className="font-bold text-slate-800 text-sm">
                                                    {t('hotelStandardPolicy')}
                                                </div>
                                                <div className="text-xs text-slate-600 mt-0.5">
                                                    {t('hotelStandardPolicyDesc')}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Policy lines if available */}
                                    {currentPolicies?.policies?.policies && currentPolicies.policies.policies.length > 0 && (
                                        <div className="space-y-2">
                                            <div className="text-xs font-bold text-slate-700">{t('hotelCancellationFeeScale')}</div>
                                            <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden text-xs">
                                                {currentPolicies.policies.policies.map((p, i) => (
                                                    <div key={i} className="p-3 bg-slate-50/50 flex items-center justify-between">
                                                        <span className="text-slate-600">{t('hotelStartingFrom')} {p.from}</span>
                                                        <span className="font-bold text-slate-800">
                                                            {p.type === 'Percentage' && `${p.value}% ${t('hotelOfAmount')}`}
                                                            {p.type === 'Amount' && `${p.value} ${currentPolicies.policies.currency}`}
                                                            {p.type === 'Nights' && `${p.value} ${t('hotelNightsBilled')}`}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Key points */}
                                    <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                                        <div className="flex items-center gap-2">
                                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                                            <span>{t('hotelInstantConfirmation')}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                                            <span>{t('hotelSatimSecurePayment')}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Bottom Action Footer */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="text-left">
                                <div className="text-xs text-slate-400">{t('hotelTotalNextStep')}</div>
                                <div className="text-2xl font-black text-[#0454E8]">
                                    {Math.round(selectedRoom.price).toLocaleString('fr-FR')}{' '}
                                    <span className="text-sm font-bold text-slate-700">{selectedRoom.currency}</span>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setStep(1)}
                                    className="w-full sm:w-auto border-slate-200 rounded-xl text-xs font-semibold h-11 px-5"
                                >
                                    {t('hotelChangeRoom')}
                                </Button>

                                <Button
                                    type="button"
                                    onClick={handleProceedToCheckout}
                                    disabled={checkingPolicies}
                                    className="w-full sm:w-auto bg-[#FFAA01] hover:bg-[#FFAA01]/90 text-[#002161] font-bold text-xs sm:text-sm h-11 px-6 rounded-xl shadow-xs hover:shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                    <span>{t('hotelFillGuestInfo')}</span>
                                    <ArrowRight className="w-4 h-4 ml-1 shrink-0" />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
