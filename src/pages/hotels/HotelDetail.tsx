import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
    Star, MapPin, Wifi, Utensils, Waves, Wind, Dumbbell, ParkingCircle,
    Wine, PlaneTakeoff, ChevronLeft, ChevronRight, ArrowLeft, X, ShieldCheck,
    Calendar, Check, User, Building2, ExternalLink, ArrowRight,
    Search, ArrowUpDown, Sparkles, Bed, Loader2, AlertTriangle, Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import NativeBackButton from '@/components/NativeBackButton';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from '@/components/ui/dialog';
import AppLoading from '@/components/common/AppLoading';
import { cn } from '@/lib/utils';
import { decodeHotelSearchParams, nightsBetween } from '@/lib/hotelSearchParams';
import { format } from 'date-fns';
import { fr, enUS, ar } from 'date-fns/locale';
import { useLanguage } from '@/i18n/LanguageContext';
import {
    searchHotels, getHotelDetailsBatch, getHotelPolicies,
    type SearchHotelResult, type SearchOption, type HotelPolicies,
} from '@/service/hotels/hotels.service';
import type { TravellandaHotelDetails } from '@/service/admin/hotel/staticdataTravellenda.ts';

const AMENITY_ICONS: { label: string; icon: typeof Wifi; keywords: string[] }[] = [
    { label: 'Wi-Fi gratuit', icon: Wifi, keywords: ['wifi', 'wireless', 'internet'] },
    { label: 'Piscine', icon: Waves, keywords: ['pool', 'piscine'] },
    { label: 'Restaurant', icon: Utensils, keywords: ['restaurant'] },
    { label: 'Spa', icon: Wine, keywords: ['spa'] },
    { label: 'Climatisation', icon: Wind, keywords: ['air-conditioned', 'air conditioning', 'climatisation'] },
    { label: 'Salle de sport', icon: Dumbbell, keywords: ['gym', 'fitness'] },
    { label: 'Parking', icon: ParkingCircle, keywords: ['parking'] },
    { label: 'Navette aéroport', icon: PlaneTakeoff, keywords: ['airport shuttle', 'navette'] },
];

function matchedAmenities(facilities: { facilityName: string }[] | undefined) {
    if (!facilities || !Array.isArray(facilities)) return [];
    return AMENITY_ICONS.filter((a) =>
        facilities.some((f) => a.keywords.some((kw) => f?.facilityName?.toLowerCase()?.includes(kw)))
    );
}

interface RoomCard {
    roomName: string;
    boardType: string;
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

export default function HotelDetail() {
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

    const [carouselOpen, setCarouselOpen] = useState(false);
    const [carouselIndex, setCarouselIndex] = useState(0);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedBoardFilter, setSelectedBoardFilter] = useState('all');
    const [sortByPrice, setSortByPrice] = useState<'asc' | 'desc'>('asc');

    // Selected room for condition verification modal
    const [selectedRoom, setSelectedRoom] = useState<RoomCard | null>(null);
    const [policiesByOption, setPoliciesByOption] = useState<Record<string, HotelPolicies>>({});
    const [checkingPolicies, setCheckingPolicies] = useState(false);
    const [policyError, setPolicyError] = useState<string | null>(null);

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
                        console.warn('Erreur recherche disponibilités:', searchErr);
                    }
                }
            } catch (err) {
                console.error('Erreur chargement détails hôtel:', err);
                setError(err instanceof Error ? err.message : 'Échec du chargement');
            } finally {
                setLoading(false);
            }
        })();
    }, [hotelId]);

    if (loading) {
        return <AppLoading message={t('hotelDetailLoading')} />;
    }
    if (error || !details) {
        return <div className="p-20 text-center text-red-500">{error ?? t('hotelNotFound')}</div>;
    }

    const hotelImages = Array.isArray(details.images) ? details.images : [];
    const amenities = matchedAmenities(details.facilities);
    const cheapestOverall = searchResult
        ? Math.min(...searchResult.options.map((o) => o.totalPrice))
        : null;

    const roomCards: RoomCard[] = [];
    if (searchResult) {
        const byKey = new Map<string, RoomCard>();
        for (const option of searchResult.options) {
            for (const room of option.rooms) {
                const key = `${room.roomName}__${option.boardType}`;
                const existing = byKey.get(key);
                if (!existing || option.totalPrice < existing.price) {
                    byKey.set(key, {
                        roomName: room.roomName,
                        boardType: option.boardType,
                        price: option.totalPrice,
                        currency: option.currency,
                        bestOption: option,
                    });
                }
            }
        }
        roomCards.push(...byKey.values());
    }

    // Board types counts
    const boardTypeCounts: Record<string, number> = {};
    for (const room of roomCards) {
        const bt = formatBoardType(room.boardType);
        boardTypeCounts[bt] = (boardTypeCounts[bt] || 0) + 1;
    }
    const uniqueBoardTypes = Object.keys(boardTypeCounts);

    // Filter & Sort
    let filteredRooms = [...roomCards];
    if (selectedBoardFilter !== 'all') {
        filteredRooms = filteredRooms.filter((r) => formatBoardType(r.boardType) === selectedBoardFilter);
    }
    if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        filteredRooms = filteredRooms.filter((r) => r.roomName.toLowerCase().includes(q));
    }
    filteredRooms.sort((a, b) => (sortByPrice === 'desc' ? b.price - a.price : a.price - b.price));

    const nights = params ? nightsBetween(params.checkInDate, params.checkOutDate) : 0;
    const totalAdults = params ? params.rooms.reduce((s, r) => s + r.numAdults, 0) : 0;
    const totalChildren = params ? params.rooms.reduce((s, r) => s + r.childAges.length, 0) : 0;
    const totalRooms = params ? params.rooms.length : 0;

    const currentPolicies = selectedRoom ? policiesByOption[selectedRoom.bestOption.optionId] : null;
    const cancellationDeadline = currentPolicies?.policies?.cancellationDeadline;
    const isDeadlinePassed = isCancellationDeadlinePassed(cancellationDeadline);
    const deadlineFormatted = formatDeadlineDisplay(cancellationDeadline);

    const handleSelectRoom = async (room: RoomCard) => {
        setSelectedRoom(room);
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

    const handleProceedToCheckout = () => {
        if (!details || !selectedRoom) return;
        const option = selectedRoom.bestOption;
        navigate('/hotels/checkout', {
            state: {
                hotelId: details.id ?? (hotelId ? Number(hotelId) : undefined),
                hotelName: details.name,
                hotelImage: details.images?.[0] ?? null,
                address: details.address,
                starRating: details.starRating,
                checkInDate: params?.checkInDate,
                checkOutDate: params?.checkOutDate,
                option,
                confirmedPrice: policiesByOption[option.optionId]?.price ? Number(policiesByOption[option.optionId].price) : option.totalPrice,
                cancellationPolicy: policiesByOption[option.optionId]?.policies ?? null,
            },
        });
    };

    const mapQuery = details.latitude && details.longitude
        ? `${details.latitude},${details.longitude}`
        : encodeURIComponent(details.address || details.name);
    const mapUrl = `https://www.google.com/maps?q=${mapQuery}&z=15&output=embed`;
    const mapExternalUrl = details.latitude && details.longitude
        ? `https://www.google.com/maps?q=${details.latitude},${details.longitude}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(details.address || details.name)}`;


    return (
        <div className="min-h-screen bg-[#F0F6FF] pb-6">
            <div className="relative h-80 sm:h-96 overflow-hidden">
                <img src={'/assets/hotels/detail.png'} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/25 to-[#F0F6FF] z-10 pointer-events-none" />

                <div
                    className="relative z-20 max-w-6xl mx-auto px-4 sm:px-6 h-full flex flex-col justify-between pb-6"
                    style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 5.5rem)' }}
                >
                    <div className="flex items-center">
                        <NativeBackButton variant="none" fallbackTo="/hotels" />
                    </div>

                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-white drop-shadow">{details.name}</h1>
                            {details.starRating && (
                                <span className="flex gap-0.5">
                                    {Array.from({ length: Math.round(Number(details.starRating)) }, (_, i) => (
                                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                                    ))}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-white/90 mt-1">
                            <MapPin className="w-3.5 h-3.5" /> {details.address}
                        </div>

                        {amenities.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                                {amenities.map(({ label, icon: Icon }) => (
                                    <span key={label} className="flex items-center gap-1 text-xs bg-white/90 text-[#1775FF] px-2 py-1 rounded-full font-medium">
                                        <Icon className="w-3.5 h-3.5" /> {label}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-24 sm:pb-12">
                {/* SECTION SUPÉRIEURE : Galerie & Description à gauche, Prix + Infos + Carte à droite */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Colonne Gauche : Photos & Description (Desktop) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Galerie photos */}
                        <div className="grid grid-cols-3 gap-2 rounded-2xl overflow-hidden h-72 sm:h-80 shadow-xs">
                            <button
                                type="button"
                                onClick={() => { setCarouselIndex(0); setCarouselOpen(true); }}
                                className="col-span-2 row-span-2 relative group overflow-hidden cursor-pointer"
                            >
                                {hotelImages[0] ? (
                                    <img
                                        src={hotelImages[0]}
                                        alt=""
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                                        {t('hotelNoImage')}
                                    </div>
                                )}
                                <span className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-xs text-white text-xs font-semibold px-2.5 py-1 rounded-lg">
                                    1 / {hotelImages.length}
                                </span>
                            </button>
                            {hotelImages.slice(1, 5).map((url, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => { setCarouselIndex(i + 1); setCarouselOpen(true); }}
                                    className="relative group overflow-hidden cursor-pointer"
                                >
                                    <img
                                        src={url}
                                        alt=""
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                    {i === 3 && hotelImages.length > 5 && (
                                        <span className="absolute inset-0 bg-black/60 backdrop-blur-xs text-white text-sm font-bold flex items-center justify-center">
                                            +{hotelImages.length - 5} {t('hotelPhotos')}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Description (Desktop) */}
                        <div className="hidden lg:block bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
                            <div className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                                <Star className="w-4 h-4 text-[#1775FF]" />
                                <span>{t('hotelAboutProperty')}</span>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                                {details.description || t('hotelNoDescription')}
                            </p>
                        </div>
                    </div>

                    {/* Colonne Droite : Prix à partir de, Informations principales, Localisation (Map) */}
                    <div className="space-y-4">
                        {/* 1. Prix à partir de */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                            {cheapestOverall !== null ? (
                                <>
                                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                        {t('hotelFromPrice')}
                                    </div>
                                    <div className="flex items-baseline gap-1.5 mt-1">
                                        <span className="text-3xl font-black text-[#0454E8]">
                                            {Math.round(cheapestOverall).toLocaleString('fr-FR')}
                                        </span>
                                        <span className="text-base font-bold text-slate-700">
                                            {searchResult?.options[0]?.currency}
                                        </span>
                                    </div>
                                    <div className="text-xs text-slate-500 mt-0.5">
                                        {nights > 0 ? `${t('hotelForNights')} ${nights} ${nights > 1 ? t('hotelNights') : t('hotelNight')}` : t('hotelPerStay')}
                                    </div>

                                    <Button
                                        type="button"
                                        onClick={() => {
                                            const el = document.getElementById('chambres-disponibles');
                                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                                        }}
                                        className="mt-4 w-full bg-[#1775FF] hover:bg-[#125ecc] text-white text-sm font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98] cursor-pointer"
                                    >
                                        <span>{t('hotelSeeAvailableRooms')}</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </Button>
                                </>
                            ) : (
                                <div className="text-sm text-slate-500 py-2">
                                    {t('hotelSelectDatesForPrices')}
                                </div>
                            )}

                            <div className="text-xs text-slate-600 mt-4 pt-3.5 border-t border-slate-100 space-y-1.5">
                                <div className="flex items-center gap-2 text-emerald-600 font-semibold">
                                    <Check className="w-3.5 h-3.5" />
                                    <span>{t('hotelImmediateConfirmation')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-3.5 h-3.5 text-[#1775FF]" />
                                    <span>{t('hotelSecurePayment')}</span>
                                </div>
                            </div>
                        </div>

                        {/* 2. Informations principales */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                            <div className="font-bold text-slate-900 mb-3.5 flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-[#1775FF]" />
                                <span>{t('hotelKeyInfo')}</span>
                            </div>
                            <div className="space-y-3 text-xs">
                                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                                    <span className="text-slate-500">{t('hotelAccommodation')}</span>
                                    <span className="font-bold text-slate-800">
                                        {t('hotelTypeHotel')}{details.starRating ? ` • ${details.starRating}★` : ''}
                                    </span>
                                </div>

                                {params ? (
                                    <>
                                        <div className="flex items-start justify-between pb-2.5 border-b border-slate-100">
                                            <span className="text-slate-500 flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                <span>{t('hotelSearchDates')}</span>
                                            </span>
                                            <div className="text-right">
                                                <div className="font-bold text-slate-800">
                                                    {format(new Date(params.checkInDate), 'd MMM', { locale: dateLocale })} → {format(new Date(params.checkOutDate), 'd MMM yyyy', { locale: dateLocale })}
                                                </div>
                                                <div className="text-[11px] text-slate-500 font-medium">
                                                    {nights} {nights > 1 ? t('hotelNights') : t('hotelNight')}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-start justify-between">
                                            <span className="text-slate-500 flex items-center gap-1.5">
                                                <User className="w-3.5 h-3.5 text-slate-400" />
                                                <span>{t('hotelSearchGuestsRooms')}</span>
                                            </span>
                                            <div className="text-right">
                                                <div className="font-bold text-slate-800">
                                                    {totalAdults} {totalAdults > 1 ? t('hotelSearchAdults') : t('hotelSearchAdults')}
                                                    {totalChildren > 0 ? `, ${totalChildren} ${totalChildren > 1 ? t('hotelSearchChildren') : t('hotelSearchChildren')}` : ''}
                                                </div>
                                                <div className="text-[11px] text-slate-500 font-medium">
                                                    {totalRooms} {totalRooms > 1 ? t('hotelSearchRooms') : t('hotelSearchRoom').toLowerCase()}
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-slate-400 italic">
                                        {t('hotelSearchDates')}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 3. Localisation / Carte */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                            <div className="font-bold text-slate-900 mb-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-[#1775FF]" />
                                    <span>{t('hotelDetailLocation')}</span>
                                </div>
                                <a
                                    href={mapExternalUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs text-[#1775FF] font-semibold hover:underline flex items-center gap-1"
                                >
                                    <span>{t('hotelEnlargeMap')}</span>
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                            <div className="rounded-xl overflow-hidden mb-2.5 h-36 border border-slate-100 shadow-inner">
                                <iframe
                                    title="location"
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    loading="lazy"
                                    src={mapUrl}
                                />
                            </div>
                            <div className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                                {details.address}
                            </div>
                        </div>

                        {/* Description (Mobile only, right below map) */}
                        <div className="block lg:hidden bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                            <div className="font-bold text-slate-900 mb-2.5 flex items-center gap-2">
                                <Star className="w-4 h-4 text-[#1775FF]" />
                                <span>{t('hotelAboutProperty')}</span>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                                {details.description || t('hotelNoDescription')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* SECTION : Disponibilités & Choix des Chambres (Style Booking.com) */}
                <div id="chambres-disponibles" className="mt-8 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-8 shadow-xs scroll-mt-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1775FF]/10 text-[#1775FF] text-xs font-bold mb-2">
                                <Building2 className="w-3.5 h-3.5" />
                                <span>{t('hotelAvailabilityAndBooking')}</span>
                            </div>
                            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                                {t('hotelAvailableRoomTypes')}
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-500 mt-1">
                                {t('hotelChooseRoomSubtitle')}
                            </p>
                        </div>
                        {roomCards.length > 0 && (
                            <span className="text-xs font-bold bg-emerald-50 text-emerald-700 px-3.5 py-1.5 rounded-full w-fit">
                                {filteredRooms.length} {t('hotelOffersAvailable')}
                            </span>
                        )}
                    </div>

                    {/* Meal Plan Filter Chips */}
                    {uniqueBoardTypes.length > 1 && (
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-4 -mx-1 px-1 scrollbar-none">
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
                                {t('hotelAllMealPlans')} ({roomCards.length})
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
                                    {bt} ({boardTypeCounts[bt]})
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Search & Sort */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-4 pb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t('hotelFilterRoomsPlaceholder')}
                                className="w-full pl-9 pr-8 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#1775FF]/20"
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
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
                        >
                            <ArrowUpDown className="w-3.5 h-3.5 text-[#1775FF]" />
                            <span>{sortByPrice === 'asc' ? t('hotelSortPriceAsc') : t('hotelSortPriceDesc')}</span>
                        </button>
                    </div>

                    {/* Rooms List */}
                    {filteredRooms.length === 0 ? (
                        <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-8 text-center space-y-3">
                            <p className="text-sm text-slate-500">{t('hotelNoRoomsFound')}</p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => { setSelectedBoardFilter('all'); setSearchQuery(''); }}
                                className="rounded-xl text-xs cursor-pointer"
                            >
                                {t('hotelResetFilters')}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredRooms.map((room, idx) => (
                                <div
                                    key={`${room.roomName}-${idx}`}
                                    className="bg-white rounded-2xl border border-slate-200/90 hover:border-[#1775FF]/50 shadow-xs hover:shadow-md transition-all p-5 flex flex-col md:flex-row md:items-center justify-between gap-5"
                                >
                                    <div className="space-y-2 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                                                {room.roomName}
                                            </h3>
                                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-[#0454E8]">
                                                {formatBoardType(room.boardType)}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                                            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg">
                                                <Utensils className="w-3.5 h-3.5 text-slate-400" />
                                                <span>{formatBoardType(room.boardType)}</span>
                                            </div>
                                            {params && (
                                                <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg">
                                                    <User className="w-3.5 h-3.5 text-slate-400" />
                                                    <span>{totalAdults} {t('hotelSearchAdults')}{totalChildren > 0 ? `, ${totalChildren} ${t('hotelSearchChildren')}` : ''}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                                                <Check className="w-3.5 h-3.5" />
                                                <span>{t('hotelImmediateConfirmation')}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex sm:flex-row md:flex-col items-center sm:items-center md:items-end justify-between md:justify-center gap-4 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
                                        <div className="text-left md:text-right">
                                            <div className="text-[11px] text-slate-400 font-medium">{t('hotelPriceForStay')}</div>
                                            <div className="text-xl sm:text-2xl font-black text-[#0454E8] leading-tight">
                                                {Math.round(room.price).toLocaleString('fr-FR')} <span className="text-xs font-bold text-slate-700">{room.currency}</span>
                                            </div>
                                            {nights > 0 && (
                                                <div className="text-[10px] text-slate-400">
                                                    ~ {Math.round(room.price / nights).toLocaleString('fr-FR')} {room.currency} / {t('hotelNight')} ({nights} {nights > 1 ? t('hotelNights') : t('hotelNight')})
                                                </div>
                                            )}
                                        </div>

                                        <Button
                                            type="button"
                                            onClick={() => handleSelectRoom(room)}
                                            className="bg-[#FFAA01] hover:bg-[#FFAA01]/90 text-[#002161] font-bold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                                        >
                                            <span>{t('hotelBook')}</span>
                                            <ArrowRight className="w-4 h-4 ml-0.5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Barre flottante mobile pour sélection rapide de chambre
            {cheapestOverall !== null && (
                <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-4 py-3 flex items-center justify-between shadow-lg">
                    <div>
                        <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                            À partir de
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-lg font-black text-[#0454E8]">
                                {Math.round(cheapestOverall).toLocaleString('fr-FR')}
                            </span>
                            <span className="text-xs font-bold text-slate-700">
                                {searchResult?.options[0]?.currency}
                            </span>
                        </div>
                    </div>
                    <Button
                        type="button"
                        onClick={() => navigate(`/hotels/${hotelId}/rooms?${searchParams.toString()}`)}
                        className="bg-[#1775FF] hover:bg-[#125ecc] text-white font-bold text-xs px-5 py-2.5 h-10 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                        <span>Choisir une chambre</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                </div>
            )} */}

            <Dialog open={carouselOpen} onOpenChange={setCarouselOpen}>
                <DialogContent className="max-w-4xl bg-black border-0 p-0">
                    <DialogTitle className="sr-only">{t('hotelPhotoGallery')}</DialogTitle>
                    <div className="relative h-[70vh]">
                        {hotelImages[carouselIndex] && (
                            <img src={hotelImages[carouselIndex]} alt="" className="w-full h-full object-contain" />
                        )}
                        <button onClick={() => setCarouselOpen(false)} className="absolute top-3 right-3 text-white bg-black/50 rounded-full p-2 cursor-pointer">
                            <X className="w-4 h-4" />
                        </button>
                        <button onClick={() => setCarouselIndex((i) => (i === 0 ? hotelImages.length - 1 : i - 1))} className="absolute left-3 top-1/2 -translate-y-1/2 text-white bg-black/50 rounded-full p-2 cursor-pointer">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button onClick={() => setCarouselIndex((i) => (i === details.images.length - 1 ? 0 : i + 1))} className="absolute right-3 top-1/2 -translate-y-1/2 text-white bg-black/50 rounded-full p-2 cursor-pointer">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                        <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded-full">
                            {hotelImages.length > 0 ? `${carouselIndex + 1} / ${hotelImages.length}` : '0 / 0'}
                        </span>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal de vérification des conditions avant réservation */}
            <Dialog open={!!selectedRoom} onOpenChange={(open) => { if (!open) setSelectedRoom(null); }}>
                <DialogContent className="max-w-xl max-h-[96vh] overflow-y-auto p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-slate-100 shadow-2xl">
                    <DialogHeader className="text-left space-y-0.5 pb-2.5 border-b border-slate-100">
                        <div className="flex items-center gap-2 text-[#0454E8]">
                                        <DialogTitle className="text-base sm:text-lg font-extrabold text-slate-900">
                                {t('hotelModalVerifyTitle')}
                            </DialogTitle>
                        </div>
                        <DialogDescription className="text-xs text-slate-500">
                            {t('hotelModalVerifySubtitle')}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedRoom && (
                        <div className="space-y-3 pt-1">
                            {/* Récapitulatif de la formule sélectionnée */}
                            <div className="bg-[#F0F6FF]/60 rounded-2xl p-3 sm:p-3.5 border border-blue-100 space-y-2">
                                <div className="flex items-center justify-between gap-3 pb-2 border-b border-blue-200/50">
                                    <div className="min-w-0">
                                        <h3 className="font-extrabold text-sm sm:text-base text-slate-900 leading-tight truncate">
                                            {selectedRoom.roomName}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[11px] font-bold text-[#0454E8] bg-white px-2 py-0.5 rounded-full border border-blue-200/60 shadow-xs shrink-0">
                                                {formatBoardType(selectedRoom.boardType)}
                                            </span>
                                            {params && (
                                                <span className="text-[11px] text-slate-600 truncate">
                                                    {totalAdults} {t('hotelSearchAdults')}{totalChildren > 0 ? `, ${totalChildren} ${t('hotelSearchChildren')}` : ''}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="text-right shrink-0">
                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{t('hotelTotalStay')}</div>
                                        <div className="text-lg sm:text-xl font-black text-[#0454E8] leading-tight">
                                            {Math.round(selectedRoom.price).toLocaleString('fr-FR')}{' '}
                                            <span className="text-xs font-bold text-slate-700">{selectedRoom.currency}</span>
                                        </div>
                                        <div className="text-[10px] text-slate-400">{t('hotelTaxesIncluded')}</div>
                                    </div>
                                </div>

                                {/* Arrivée et Départ sur la même ligne */}
                                <div className="bg-white px-3 py-2 rounded-xl border border-blue-100 flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <Calendar className="w-3.5 h-3.5 text-[#0454E8] shrink-0" />
                                        <span className="text-slate-400 text-[11px]">{t('hotelFromDate')}</span>
                                        <span className="font-bold text-slate-800 text-[11px] sm:text-xs">
                                            {params?.checkInDate ? format(new Date(params.checkInDate), 'd MMM yyyy', { locale: dateLocale }) : '—'}
                                        </span>
                                    </div>
                                    <span className="text-slate-300 font-bold px-1 text-xs">→</span>
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <span className="text-slate-400 text-[11px]">{t('hotelToDate')}</span>
                                        <span className="font-bold text-slate-800 text-[11px] sm:text-xs">
                                            {params?.checkOutDate ? format(new Date(params.checkOutDate), 'd MMM yyyy', { locale: dateLocale }) : '—'}
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-bold bg-blue-50 text-[#0454E8] px-2 py-0.5 rounded-md shrink-0 ml-1">
                                        {nights} {nights > 1 ? t('hotelNights') : t('hotelNight')}
                                    </span>
                                </div>
                            </div>

                            {/* Bloc Politique d'annulation & conditions en direct */}
                            <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-3.5 shadow-xs space-y-3">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                    <div className="font-extrabold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                                        <ShieldCheck className="w-4 h-4 text-[#1775FF]" />
                                        <span>{t('hotelCancellationPolicyTitle')}</span>
                                    </div>
                                    {checkingPolicies && (
                                        <span className="flex items-center gap-1 text-[11px] text-blue-600 font-medium animate-pulse">
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            {t('hotelVerifying')}
                                        </span>
                                    )}
                                </div>

                                {checkingPolicies ? (
                                    <div className="py-4 text-center space-y-1.5">
                                        <Loader2 className="w-5 h-5 animate-spin text-[#1775FF] mx-auto" />
                                        <p className="text-xs text-slate-500">{t('hotelFetchingPolicies')}</p>
                                    </div>
                                ) : policyError ? (
                                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                                            <span>{policyError}</span>
                                        </div>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleSelectRoom(selectedRoom)}
                                            className="text-xs h-7 rounded-lg cursor-pointer"
                                        >
                                            {t('hotelRetry')}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-2.5">
                                        {/* Badge d'annulation */}
                                        {cancellationDeadline ? (
                                            !isDeadlinePassed ? (
                                                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5">
                                                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                                    <div>
                                                        <div className="font-bold text-emerald-800 text-xs sm:text-sm">
                                                            {t('hotelFreeCancellationPossible')}
                                                        </div>
                                                        <div className="text-[11px] text-emerald-700 mt-0.5">
                                                            {t('hotelFreeCancelUntil')}{' '}
                                                            <span className="font-bold underline">{deadlineFormatted}</span>.
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5">
                                                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                                    <div>
                                                        <div className="font-bold text-amber-800 text-xs sm:text-sm">
                                                            {t('hotelNonRefundableNotice')}
                                                        </div>
                                                        <div className="text-[11px] text-amber-700 mt-0.5">
                                                            {deadlineFormatted}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        ) : (
                                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                                                <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                                                <div>
                                                    <div className="font-bold text-slate-800 text-xs sm:text-sm">
                                                        {t('hotelStandardPolicy')}
                                                    </div>
                                                    <div className="text-[11px] text-slate-600 mt-0.5">
                                                        {t('hotelStandardPolicyDesc')}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Barème des frais d'annulation si présent */}
                                        {currentPolicies?.policies?.policies && currentPolicies.policies.policies.length > 0 && (
                                            <div className="space-y-1.5">
                                                <div className="text-[11px] font-bold text-slate-700">{t('hotelCancellationFeeScale')}</div>
                                                <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden text-[11px]">
                                                    {currentPolicies.policies.policies.map((p, i) => (
                                                        <div key={i} className="px-3 py-1.5 bg-slate-50/50 flex items-center justify-between">
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

                                        {/* Reassurance points */}
                                        <div className="pt-1.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                                            <div className="flex items-center gap-1.5">
                                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                <span>{t('hotelInstantConfirmation')}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                <span>{t('hotelSatimSecurePayment')}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Actions footer */}
                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setSelectedRoom(null)}
                                    className="border-slate-200 text-slate-700 rounded-xl text-xs font-semibold h-10 px-4 cursor-pointer shrink-0"
                                >
                                    {t('hotelChange')}
                                </Button>

                                <Button
                                    type="button"
                                    onClick={handleProceedToCheckout}
                                    disabled={checkingPolicies}
                                    className="flex-1 sm:flex-initial bg-[#FFAA01] hover:bg-[#FFAA01]/90 text-[#002161] font-bold text-xs sm:text-sm h-10 px-5 rounded-xl shadow-xs hover:shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                    <span>{t('hotelFillGuestInfo')}</span>
                                    <ArrowRight className="w-4 h-4 shrink-0" />
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}