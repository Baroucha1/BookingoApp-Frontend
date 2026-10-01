import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    Star, MapPin, Wifi, ChevronLeft, ChevronRight, Calendar, User, ArrowLeft, X,
    SlidersHorizontal, ArrowUpDown, Check, Waves, Car, Wind, Utensils, RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import HotelSearchLoadingOverlay from '@/components/hotels/HotelSearchLoadingOverlay';
import { decodeHotelSearchParams, formatDateRangeFr, nightsBetween } from '@/lib/hotelSearchParams';
import {
    searchHotels, getHotelDetailsBatch,
    type SearchHotelResult,
} from '@/service/hotels/hotels.service';
import type { TravellandaHotelDetails } from '@/service/admin/hotel/staticdataTravellenda.ts';
import HotelsMap, { type MapHotelPoint } from '@/components/hotels/HotelsMap';
import { useLanguage } from '@/i18n/LanguageContext';

const RESULTS_PER_PAGE = 8;

const AMENITY_KEYWORDS: Record<string, string[]> = {
    'Wi-Fi gratuit': ['wifi', 'wireless', 'internet'],
    'Piscine': ['pool', 'piscine'],
    'Parking': ['parking'],
    'Climatisation': ['air-conditioned', 'air conditioning', 'climatisation'],
    'Restaurant': ['restaurant'],
};

const AMENITY_KEYS: Record<string, string> = {
    'Wi-Fi gratuit': 'hotelWifi',
    'Piscine': 'hotelPool',
    'Parking': 'hotelParking',
    'Climatisation': 'hotelAirCond',
    'Restaurant': 'hotelRestaurant',
};

const AMENITY_ICONS: Record<string, typeof Wifi> = {
    'Wi-Fi gratuit': Wifi,
    'Piscine': Waves,
    'Parking': Car,
    'Climatisation': Wind,
    'Restaurant': Utensils,
};

type SortOption = 'recommended' | 'price-asc' | 'price-desc' | 'stars-desc' | 'stars-asc';

const SORT_OPTIONS: { id: SortOption; labelKey: string; defaultLabel: string; shortKey: string; defaultShort: string }[] = [
    { id: 'recommended', labelKey: 'hotelSortRecommended', defaultLabel: 'Recommandés (par défaut)', shortKey: 'hotelSortRecommended', defaultShort: 'Recommandés' },
    { id: 'price-asc', labelKey: 'hotelSortPriceAsc', defaultLabel: 'Prix : du moins cher au plus cher', shortKey: 'hotelSortPriceAsc', defaultShort: 'Prix croissant' },
    { id: 'price-desc', labelKey: 'hotelSortPriceDesc', defaultLabel: 'Prix : du plus cher au moins cher', shortKey: 'hotelSortPriceDesc', defaultShort: 'Prix décroissant' },
    { id: 'stars-desc', labelKey: 'hotelSortStarsDesc', defaultLabel: 'Étoiles : 5 étoiles d\'abord', shortKey: 'hotelSortStarsDesc', defaultShort: 'Étoiles (5 à 1)' },
    { id: 'stars-asc', labelKey: 'hotelSortStarsAsc', defaultLabel: 'Étoiles : 1 étoile d\'abord', shortKey: 'hotelSortStarsAsc', defaultShort: 'Étoiles (1 à 5)' },
];

function hotelHasAmenity(details: TravellandaHotelDetails | undefined, amenity: string): boolean {
    if (!details?.facilities) return false;
    const keywords = AMENITY_KEYWORDS[amenity] ?? [];
    return details.facilities.some((f) => keywords.some((kw) => f.facilityName.toLowerCase().includes(kw)));
}

function PriceHistogram({ prices, max, currentMax }: { prices: number[]; max: number; currentMax?: number }) {
    const BUCKETS = 20;
    const bucketSize = (max || 1) / BUCKETS;
    const counts = new Array(BUCKETS).fill(0);
    prices.forEach((p) => {
        const idx = Math.max(0, Math.min(BUCKETS - 1, Math.floor(p / bucketSize)));
        counts[idx]++;
    });
    const maxCount = Math.max(1, ...counts);
    const activeMax = currentMax !== undefined ? currentMax : max;
    return (
        <div className="flex items-end gap-[2px] h-6 mb-1">
            {counts.map((c, i) => {
                const bucketUpper = (i + 1) * bucketSize;
                const isInRange = bucketUpper <= activeMax || (i === 0 && bucketSize * 0.5 <= activeMax);
                const heightPercent = c > 0 ? Math.max(15, (c / maxCount) * 100) : 6;
                return (
                    <div
                        key={i}
                        className={`flex-1 rounded-[1px] transition-all duration-150 ${
                            isInRange ? 'bg-[#1775FF]' : 'bg-slate-200'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                    />
                );
            })}
        </div>
    );
}

function getVisiblePages(current: number, total: number): number[] {
    const maxButtons = 5;
    if (total <= maxButtons) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }
    let start = Math.max(1, current - 2);
    let end = Math.min(total, start + maxButtons - 1);
    if (end - start < maxButtons - 1) {
        start = Math.max(1, end - maxButtons + 1);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

function CompactHotelCard({
    hotel, details, perNight, star, selected, onSelect, onDetails,
}: {
    hotel: SearchHotelResult;
    details?: TravellandaHotelDetails;
    perNight: number;
    star: number;
    selected: boolean;
    onSelect: () => void;
    onDetails: () => void;
}) {
    const { t } = useLanguage();
    return (
        <div
            onClick={onSelect}
            className={`flex gap-3 p-3 rounded-lg cursor-pointer transition-colors ${selected ? 'bg-[#DFECFF]' : 'hover:bg-slate-50'}`}
        >
            <div className="w-20 h-16 shrink-0 rounded-md overflow-hidden bg-slate-100">
                {details?.images?.[0] ? (
                    <img src={details.images[0]} alt="" className="w-full h-full object-cover" />
                ) : null}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex gap-0.5">
                    {Array.from({ length: star }, (_, i) => <Star key={i} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />)}
                </div>
                <div className="text-sm font-semibold text-slate-800 line-clamp-1">{hotel.hotelName}</div>
                <div className="text-xs text-slate-400 line-clamp-1">{details?.address}</div>
                <div className="flex items-center justify-between mt-1">
                    <span className="text-sm font-bold text-[#1775FF]">{Math.round(perNight)} {hotel.options[0]?.currency}</span>
                    <button onClick={(e) => { e.stopPropagation(); onDetails(); }} className="text-xs text-[#1775FF] font-semibold hover:underline">
                        {t('hotelViewDetails')}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function HotelResults() {
    const { t } = useLanguage();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const params = useMemo(() => decodeHotelSearchParams(searchParams), [searchParams]);

    const [loading, setLoading] = useState(true);
    const [results, setResults] = useState<SearchHotelResult[]>([]);
    const [detailsMap, setDetailsMap] = useState<Record<number, TravellandaHotelDetails>>({});
    const [error, setError] = useState<string | null>(null);

    const [priceMax, setPriceMax] = useState<number | null>(null); // null = no filter applied yet
    const [selectedStars, setSelectedStars] = useState<number[]>([]);
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState<SortOption>('recommended');
    const [page, setPage] = useState(1);
    const [showMap, setShowMap] = useState(false);
    const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);

    // Mobile drawer state
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    const [drawerTab, setDrawerTab] = useState<'filters' | 'sort'>('filters');

    useEffect(() => {
        if (!params) { setLoading(false); return; }
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const result = await searchHotels({
                    cityIds: params.hotelIds.length === 0 ? [params.cityId] : undefined,
                    hotelIds: params.hotelIds.length > 0 ? params.hotelIds : undefined,
                    checkInDate: params.checkInDate,
                    checkOutDate: params.checkOutDate,
                    rooms: params.rooms,
                    nationality: params.nationality,
                    availableOnly: params.availableOnly,
                });
                const hotelsList = result?.hotels || [];
                setResults(hotelsList);

                const ids = hotelsList.map((h) => parseInt(h.hotelId, 10)).filter(Boolean);
                if (ids.length > 0) {
                    try {
                        const detailsList = await getHotelDetailsBatch(ids);
                        if (Array.isArray(detailsList)) {
                            const map: Record<string | number, TravellandaHotelDetails> = {};
                            detailsList.forEach((d) => {
                                if (d && d.hotelId) {
                                    map[d.hotelId] = d;
                                    map[String(d.hotelId)] = d;
                                }
                            });
                            setDetailsMap(map);
                        }
                    } catch (detailsErr) {
                        console.warn('Failed to load hotel details batch:', detailsErr);
                    }
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Échec de la recherche');
            } finally {
                setLoading(false);
            }
        })();
    }, [params]);

    if (!params) {
        return (
            <div className="p-16 text-center text-slate-400">
                Paramètres de recherche invalides. <Button variant="link" onClick={() => navigate('/hotels')}>Retour à la recherche</Button>
            </div>
        );
    }

    const nights = nightsBetween(params.checkInDate, params.checkOutDate);
    const totalGuests = (params.rooms || []).reduce((s, r) => s + (r.numAdults || 0) + (r.childAges?.length || 0), 0);

    const withPricing = useMemo(() => {
        return (results || []).map((h) => {
            const validOptions = h.options || [];
            const cheapest = validOptions.length > 0
                ? validOptions.reduce((min, o) => Math.min(min, o.totalPrice), Infinity)
                : Infinity;
            const details = detailsMap[h.hotelId] || detailsMap[parseInt(h.hotelId, 10)];
            const star = details?.starRating ? Math.round(Number(details.starRating)) : (h.starRating ? Math.round(h.starRating) : 0);
            const perNight = Number.isFinite(cheapest) && nights > 0 ? cheapest / nights : 0;
            return { hotel: h, details, cheapestTotal: cheapest, perNight, star, hasOptions: validOptions.length > 0 };
        });
    }, [results, detailsMap, nights]);

    const pricesForRange = useMemo(() => {
        return withPricing
            .filter((w) => w.hasOptions && Number.isFinite(w.perNight) && w.perNight > 0)
            .map((w) => w.perNight);
    }, [withPricing]);

    const dataMaxPrice = useMemo(() => {
        return pricesForRange.length > 0 ? Math.ceil(Math.max(...pricesForRange) / 100) * 100 : 0;
    }, [pricesForRange]);

    const effectivePriceMax = priceMax ?? dataMaxPrice;

    const filtered = useMemo(() => {
        return withPricing.filter((r) => {
            if (!r.hasOptions) return false;
            if (priceMax !== null && r.perNight > priceMax) return false;
            if (selectedStars.length > 0 && !selectedStars.includes(r.star)) return false;
            if (selectedAmenities.length > 0 && !selectedAmenities.every((a) => hotelHasAmenity(r.details, a))) return false;
            return true;
        });
    }, [withPricing, priceMax, selectedStars, selectedAmenities]);

    // Apply sorting
    const sortedAndFiltered = useMemo(() => {
        const list = [...filtered];
        if (sortBy === 'price-asc') {
            list.sort((a, b) => a.perNight - b.perNight);
        } else if (sortBy === 'price-desc') {
            list.sort((a, b) => b.perNight - a.perNight);
        } else if (sortBy === 'stars-desc') {
            list.sort((a, b) => b.star - a.star);
        } else if (sortBy === 'stars-asc') {
            list.sort((a, b) => a.star - b.star);
        }
        return list;
    }, [filtered, sortBy]);

    const activeFilterCount = (priceMax !== null ? 1 : 0) + selectedStars.length + selectedAmenities.length;

    const mapPoints: MapHotelPoint[] = useMemo(() => {
        return sortedAndFiltered
            .filter((r) => r.details?.latitude && r.details?.longitude && !isNaN(Number(r.details.latitude)) && !isNaN(Number(r.details.longitude)))
            .map((r) => ({
                hotelId: r.hotel.hotelId,
                hotelName: r.hotel.hotelName,
                lat: Number(r.details!.latitude),
                lng: Number(r.details!.longitude),
                price: r.perNight,
                currency: r.hotel.options?.[0]?.currency ?? '',
            }));
    }, [sortedAndFiltered]);

    const selectedHotelData = useMemo(() => {
        if (!selectedHotelId) return sortedAndFiltered[0] || null;
        return sortedAndFiltered.find((r) => r.hotel.hotelId === selectedHotelId) || sortedAndFiltered[0] || null;
    }, [sortedAndFiltered, selectedHotelId]);

    const totalPages = Math.max(1, Math.ceil(sortedAndFiltered.length / RESULTS_PER_PAGE));
    const pageResults = sortedAndFiltered.slice((page - 1) * RESULTS_PER_PAGE, page * RESULTS_PER_PAGE);

    const toggleStar = (n: number) => {
        setSelectedStars((prev) => (prev.includes(n) ? prev.filter((s) => s !== n) : [...prev, n]));
        setPage(1);
    };
    const toggleAmenity = (a: string) => {
        setSelectedAmenities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
        setPage(1);
    };
    const resetFilters = () => {
        setPriceMax(null);
        setSelectedStars([]);
        setSelectedAmenities([]);
        setPage(1);
    };

    return (
        <div className="min-h-screen bg-[#F0F6FF] pb-6">
            <div className="relative min-h-[17.5rem] sm:min-h-[19.5rem] overflow-hidden flex flex-col justify-end">
                <img
                    src="/assets/hotels/result.png"
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover scale-105 blur-sm"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/40 to-black/15 z-10 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-[#F0F6FF]/25 z-10 pointer-events-none" />
                <div
                    className="relative z-20 max-w-6xl mx-auto px-4 sm:px-6 w-full flex flex-col justify-center pb-12 sm:pb-14"
                    style={{
                        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 5.5rem)',
                    }}
                >
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white [text-shadow:_0_2px_12px_rgba(0,0,0,0.9),_0_1px_3px_rgba(0,0,0,0.95)]">
                        {t('hotelHeroTitle')}
                    </h1>
                    <p className="text-white/95 text-xs sm:text-sm mt-1.5 font-medium max-w-xl [text-shadow:_0_1px_6px_rgba(0,0,0,0.85)]">
                        {t('hotelHeroSubtitle')}
                    </p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-8 sm:-mt-10 relative z-20">
                <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-slate-200/80 p-1.5 sm:p-3 flex flex-col md:flex-row items-stretch md:items-center divide-y md:divide-y-0 md:divide-x divide-slate-100 gap-0.5 md:gap-0">
                    <button onClick={() => navigate('/hotels')} className="flex-1 min-w-[180px] flex items-center gap-2.5 sm:gap-3.5 px-3 py-2 sm:px-5 sm:py-4 text-start hover:bg-slate-50 transition-colors rounded-xl cursor-pointer">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#1775FF]/10 flex items-center justify-center shrink-0">
                            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-[#1775FF]" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="text-[10px] sm:text-[11px] uppercase tracking-wider font-bold text-slate-400">{t('hotelSearchDestination')}</div>
                            <div className="text-xs sm:text-base font-bold text-slate-800 truncate">
                                {detailsMap[Object.keys(detailsMap)[0] as any]?.cityName || (params.countryCode ? `${t('hotelSearchDestination')} (${params.countryCode})` : t('hotelSearchDestination'))}
                            </div>
                        </div>
                    </button>

                    <button onClick={() => navigate('/hotels')} className="flex-1 min-w-[200px] flex items-center gap-2.5 sm:gap-3.5 px-3 py-2 sm:px-5 sm:py-4 text-start hover:bg-slate-50 transition-colors rounded-xl cursor-pointer">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#FFAA01]/10 flex items-center justify-center shrink-0">
                            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-[#FFAA01]" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="text-[10px] sm:text-[11px] uppercase tracking-wider font-bold text-slate-400">{t('hotelSearchDates')}</div>
                            <div className="text-xs sm:text-base font-bold text-slate-800 truncate">{formatDateRangeFr(params.checkInDate, params.checkOutDate)}</div>
                        </div>
                    </button>

                    <button onClick={() => navigate('/hotels')} className="flex-1 min-w-[180px] flex items-center gap-2.5 sm:gap-3.5 px-3 py-2 sm:px-5 sm:py-4 text-start hover:bg-slate-50 transition-colors rounded-xl cursor-pointer">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="text-[10px] sm:text-[11px] uppercase tracking-wider font-bold text-slate-400">{t('hotelSearchGuestsRooms')}</div>
                            <div className="text-xs sm:text-base font-bold text-slate-800 truncate">
                                {params.rooms.length} {params.rooms.length > 1 ? t('hotelSearchRooms') : t('hotelSearchRoom')} · {totalGuests} {totalGuests > 1 ? t('hotelSearchGuests') : t('hotelSearchGuest')}
                            </div>
                        </div>
                    </button>

                    <div className="p-1.5 sm:p-2.5 flex items-center">
                        <Button className="w-full md:w-auto h-9 sm:h-12 px-5 sm:px-7 bg-[#FFAA01] hover:bg-[#FFAA01]/90 text-[#002161] font-extrabold text-xs sm:text-base rounded-xl sm:rounded-2xl shadow-xs hover:shadow-md transition-all active:scale-95 gap-2 cursor-pointer" onClick={() => navigate('/hotels')}>
                            {t('hotelModify')}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 grid grid-cols-1 lg:grid-cols-[250px,1fr] gap-5">
                {/* Desktop Sidebar Filters */}
                <aside className="hidden lg:block space-y-4">
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-2xs sticky top-20">
                        <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-100">
                            <span className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                                <SlidersHorizontal className="w-3.5 h-3.5 text-[#1775FF]" />
                                {t('hotelFilter')}
                            </span>
                            {activeFilterCount > 0 && (
                                <button
                                    onClick={resetFilters}
                                    className="text-[11px] font-semibold text-[#1775FF] hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                    <RotateCcw className="w-3 h-3" />
                                    {t('hotelReset')}
                                </button>
                            )}
                        </div>

                        {/* Price filter block */}
                        <div className="mb-3.5">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-semibold text-slate-700">{t('hotelPricePerNight')}</span>
                                <span className="text-xs font-bold text-[#1775FF]">
                                    max {effectivePriceMax} {results?.[0]?.options?.[0]?.currency ?? ''}
                                </span>
                            </div>
                            <PriceHistogram prices={pricesForRange} max={dataMaxPrice || 1} currentMax={effectivePriceMax} />
                            <input
                                type="range"
                                min={0}
                                max={dataMaxPrice || 1}
                                value={effectivePriceMax}
                                onChange={(e) => { setPriceMax(Number(e.target.value)); setPage(1); }}
                                className="w-full accent-[#1775FF] h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                            />
                            <div className="flex justify-between text-[10px] text-slate-400 mt-0.5 font-medium">
                                <span>0</span>
                                <span>{dataMaxPrice} {results?.[0]?.options?.[0]?.currency ?? ''}</span>
                            </div>
                        </div>

                        {/* Stars block: Compact chips in 1 row */}
                        <div className="mb-3.5">
                            <div className="text-xs font-semibold text-slate-700 mb-1.5">{t('hotelStars')}</div>
                            <div className="grid grid-cols-5 gap-1">
                                {[5, 4, 3, 2, 1].map((n) => {
                                    const isSelected = selectedStars.includes(n);
                                    return (
                                        <button
                                            key={n}
                                            type="button"
                                            onClick={() => toggleStar(n)}
                                            className={`flex items-center justify-center gap-0.5 py-1 px-1 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                                                isSelected
                                                    ? 'border-amber-400 bg-amber-50 text-amber-900 shadow-2xs ring-1 ring-amber-400'
                                                    : 'border-slate-200 bg-slate-50/60 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                            }`}
                                        >
                                            <span>{n}</span>
                                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Amenities block: Compact chips in 2 columns */}
                        <div>
                            <div className="text-xs font-semibold text-slate-700 mb-1.5">{t('hotelAmenities')}</div>
                            <div className="grid grid-cols-2 gap-1.5">
                                {Object.keys(AMENITY_KEYWORDS).map((a) => {
                                    const Icon = AMENITY_ICONS[a] || Wifi;
                                    const label = AMENITY_KEYS[a] ? t(AMENITY_KEYS[a]) : a;
                                    const isSelected = selectedAmenities.includes(a);
                                    return (
                                        <button
                                            key={a}
                                            type="button"
                                            onClick={() => toggleAmenity(a)}
                                            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-left transition-all cursor-pointer ${
                                                isSelected
                                                    ? 'border-[#1775FF] bg-blue-50/80 text-[#1775FF] font-semibold shadow-2xs'
                                                    : 'border-slate-200 bg-slate-50/60 text-slate-600 hover:bg-slate-100'
                                            }`}
                                        >
                                            <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#1775FF]' : 'text-slate-400'}`} />
                                            <span className="text-[11px] truncate leading-tight">{label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {activeFilterCount > 0 && (
                            <button
                                onClick={resetFilters}
                                className="w-full mt-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                            >
                                {t('hotelClearAll')}
                            </button>
                        )}
                    </div>
                </aside>

                {/* Main Results Column */}
                <div>
                    {/* Mobile Toolbar (Tiroir Filtres & Tri + Carte) */}
                    <div className="lg:hidden mb-3">
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => {
                                    setDrawerTab('filters');
                                    setMobileDrawerOpen(true);
                                }}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer ${
                                    activeFilterCount > 0
                                        ? 'bg-[#1775FF] text-white border-[#1775FF]'
                                        : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50'
                                }`}
                            >
                                <SlidersHorizontal className={`w-3.5 h-3.5 ${activeFilterCount > 0 ? 'text-white' : 'text-[#1775FF]'}`} />
                                <span>{t('hotelFilter')}</span>
                                {activeFilterCount > 0 && (
                                    <span className="w-4 h-4 rounded-full bg-white text-[#1775FF] text-[10px] flex items-center justify-center font-extrabold">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </button>

                            <button
                                onClick={() => {
                                    setDrawerTab('sort');
                                    setMobileDrawerOpen(true);
                                }}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-xs font-bold shadow-2xs transition-all active:scale-95 truncate cursor-pointer ${
                                    sortBy !== 'recommended'
                                        ? 'bg-amber-50 border-amber-300 text-amber-900'
                                        : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50'
                                }`}
                            >
                                <ArrowUpDown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                <span className="truncate">{SORT_OPTIONS.find((o) => o.id === sortBy)?.shortKey ? t(SORT_OPTIONS.find((o) => o.id === sortBy)!.shortKey) : (SORT_OPTIONS.find((o) => o.id === sortBy)?.defaultShort || t('hotelSort'))}</span>
                            </button>

                            <button
                                onClick={() => setShowMap(true)}
                                className="flex items-center justify-center gap-1 py-2 px-2.5 bg-white border border-slate-200/90 rounded-xl text-xs font-bold text-[#1775FF] shadow-2xs active:scale-95 transition-all hover:bg-slate-50 shrink-0 cursor-pointer"
                            >
                                <MapPin className="w-3.5 h-3.5 text-[#1775FF]" />
                                <span className="hidden xs:inline">{t('hotelMap')}</span>
                            </button>
                        </div>
                    </div>

                    {/* Results Topbar info (Desktop + Mobile) */}
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs sm:text-sm font-bold text-slate-700">
                            {t('hotelResultsCount')} <span className="text-[#1775FF]">{sortedAndFiltered.length}</span>
                        </span>

                        <div className="flex items-center gap-3">
                            {/* Desktop Sort select */}
                            <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500">
                                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                                <span className="font-semibold">{t('hotelSort')} :</span>
                                <select
                                    value={sortBy}
                                    onChange={(e) => {
                                        setSortBy(e.target.value as SortOption);
                                        setPage(1);
                                    }}
                                    className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1775FF] cursor-pointer"
                                >
                                    {SORT_OPTIONS.map((opt) => (
                                        <option key={opt.id} value={opt.id}>
                                            {opt.labelKey ? t(opt.labelKey) : opt.defaultLabel}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={() => setShowMap((v) => !v)}
                                className="hidden lg:flex text-xs font-semibold text-[#1775FF] items-center gap-1.5 border border-[#1775FF] rounded-lg px-3 py-1.5 hover:bg-[#DFECFF]/40 cursor-pointer"
                            >
                                <MapPin className="w-3.5 h-3.5" /> {showMap ? t('hotelCloseMap') : t('hotelViewOnMap')}
                            </button>
                        </div>
                    </div>

                    <HotelSearchLoadingOverlay
                        active={loading}
                        checkInDate={params?.checkInDate}
                        checkOutDate={params?.checkOutDate}
                        roomsCount={params?.rooms?.length}
                        guestsCount={(params?.rooms || []).reduce((s, r) => s + (r.numAdults || 0) + (r.childAges?.length || 0), 0)}
                    />

                    {!loading && error && <div className="py-10 text-center text-red-500 text-sm">{error}</div>}

                    {!loading && !error && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {pageResults.map(({ hotel, details, perNight, star }, idx) => (
                                <div
                                    key={`${hotel.hotelId}-${idx}`}
                                    className="group bg-white rounded-2xl border border-slate-100/90 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col justify-between"
                                >
                                    {/* Image container */}
                                    <div className="relative w-full h-48 sm:h-52 overflow-hidden bg-slate-100">
                                        {details?.images?.[0] ? (
                                            <img
                                                src={details.images[0]}
                                                alt={hotel.hotelName}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300 text-xs">
                                                Pas d'image
                                            </div>
                                        )}

                                        {/* Floating Stars badge */}
                                        {star > 0 && (
                                            <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full shadow-sm flex items-center gap-0.5">
                                                {Array.from({ length: star }, (_, i) => (
                                                    <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                                                ))}
                                            </div>
                                        )}

                                        {/* Floating Wi-Fi badge */}
                                        {hotelHasAmenity(details, 'Wi-Fi gratuit') && (
                                            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[11px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                                <Wifi className="w-3 h-3" /> {t('hotelWifi')}
                                            </div>
                                        )}
                                    </div>

                                    {/* Card Content Body */}
                                    <div className="p-4 flex-1 flex flex-col justify-between">
                                        <div>
                                            <h3 className="font-bold text-slate-900 group-hover:text-[#0454E8] text-base leading-snug transition-colors line-clamp-1">
                                                {hotel.hotelName}
                                            </h3>

                                            {details?.address && (
                                                <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1.5 line-clamp-1">
                                                    <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                                                    <span className="truncate">{details.address}</span>
                                                </div>
                                            )}

                                            {/* Amenities tags */}
                                            <div className="flex flex-wrap gap-1.5 mt-3">
                                                {hotelHasAmenity(details, 'Piscine') && (
                                                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">{t('hotelPool')}</span>
                                                )}
                                                {hotelHasAmenity(details, 'Climatisation') && (
                                                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">{t('hotelAirCond')}</span>
                                                )}
                                                {hotelHasAmenity(details, 'Restaurant') && (
                                                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">{t('hotelRestaurant')}</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Card Footer */}
                                        <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                                            <div>
                                                <div className="text-[11px] text-slate-400 font-medium">{t('hotelFromPrice')}</div>
                                                <div className="text-lg font-black text-[#0454E8] leading-tight">
                                                    {Math.round(perNight).toLocaleString('fr-FR')} <span className="text-xs font-semibold text-slate-600">{hotel.options?.[0]?.currency ?? ''}</span>
                                                </div>
                                                <div className="text-[10px] text-slate-400">{t('hotelPerNight')}</div>
                                            </div>

                                            <Button
                                                className="bg-[#FFAA01] hover:bg-[#FFAA01]/90 text-[#002161] font-bold text-xs px-4 py-2 rounded-xl shadow-xs hover:shadow-md transition-all active:scale-95"
                                                onClick={() => navigate(`/hotels/${hotel.hotelId}?${searchParams.toString()}`)}
                                            >
                                                {t('hotelViewDetails')}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {filtered.length === 0 && <div className="py-16 text-center text-slate-400 col-span-2">{t('hotelNoResults')}</div>}
                        </div>
                    )}

                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-1 mt-6">
                            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center disabled:opacity-40 cursor-pointer">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            {getVisiblePages(page, totalPages).map((p) => (
                                <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${p === page ? 'bg-[#1775FF] text-white shadow-2xs' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                    {p}
                                </button>
                            ))}
                            <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center disabled:opacity-40 cursor-pointer">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>


            {/* Map Modal View */}
            {showMap && (
                <div className="fixed inset-0 z-[60] bg-white flex flex-col md:flex-row overflow-hidden animate-in fade-in duration-200">
                    {/* Desktop sidebar list */}
                    <div className="hidden md:flex flex-col w-96 lg:w-[420px] border-r border-slate-100 overflow-y-auto shrink-0 bg-white">
                        <div className="p-4 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur-md z-10 flex items-center justify-between">
                            <span className="text-sm font-bold text-slate-800">
                                {filtered.length} hôtel{filtered.length !== 1 ? 's' : ''} trouvé{filtered.length !== 1 ? 's' : ''}
                            </span>
                            <span className="text-xs text-slate-400">Cliquez pour localiser</span>
                        </div>
                        <div className="p-2 space-y-1">
                            {filtered.map(({ hotel, details, perNight, star }, idx) => (
                                <CompactHotelCard
                                    key={`${hotel.hotelId}-${idx}`}
                                    hotel={hotel}
                                    details={details}
                                    perNight={perNight}
                                    star={star}
                                    selected={selectedHotelId === hotel.hotelId}
                                    onSelect={() => setSelectedHotelId(hotel.hotelId)}
                                    onDetails={() => navigate(`/hotels/${hotel.hotelId}?${searchParams.toString()}`)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Interactive Map (Full screen on mobile, right panel on desktop) */}
                    <div className="flex-1 relative w-full h-full min-h-0 bg-slate-100">
                        <HotelsMap
                            points={mapPoints}
                            selectedHotelId={selectedHotelId}
                            onSelectHotel={(id) => setSelectedHotelId(id)}
                        />

                        {/* Top bar controls */}
                        <div
                            className="absolute left-3 right-3 z-[1000] flex items-center justify-between pointer-events-none"
                            style={{ top: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)' }}
                        >
                            <button
                                onClick={() => setShowMap(false)}
                                className="pointer-events-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-lg rounded-full px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 hover:bg-slate-50 border border-slate-200/80 dark:border-slate-800 active:scale-95 transition-all cursor-pointer"
                            >
                                <ArrowLeft className="w-4 h-4 text-[#0454E8]" />
                                <span>{t('hotelCloseMap')}</span>
                            </button>

                            <div className="pointer-events-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-lg rounded-full px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800 flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-[#FFAA01]" />
                                <span>{filtered.length} {filtered.length > 1 ? t('hotelResultsFound') : t('hotelResultFound')}</span>
                            </div>

                            <button
                                onClick={() => setShowMap(false)}
                                className="pointer-events-auto md:flex hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-lg rounded-full px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 items-center gap-1 hover:bg-slate-50 border border-slate-200/80 dark:border-slate-800 cursor-pointer"
                            >
                                <span>{t('hotelCloseMap')}</span>
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Mobile bottom hotel preview card */}
                        {selectedHotelData && (
                            <div
                                className="md:hidden absolute left-3.5 right-3.5 z-[1000] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl p-3 shadow-2xl border border-slate-200/90 dark:border-slate-800 flex gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200"
                                style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
                            >
                                <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-slate-100 relative">
                                    {selectedHotelData.details?.images?.[0] ? (
                                        <img
                                            src={selectedHotelData.details.images[0]}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                            <MapPin className="w-6 h-6" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                    <div>
                                        <div className="flex items-center justify-between gap-1">
                                            <div className="flex gap-0.5">
                                                {Array.from({ length: selectedHotelData.star }, (_, i) => (
                                                    <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                                                ))}
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedHotelId(null);
                                                }}
                                                className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center text-xs hover:bg-slate-200 cursor-pointer"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white line-clamp-1 mt-0.5">
                                            {selectedHotelData.hotel.hotelName}
                                        </h4>
                                        <p className="text-[11px] text-slate-400 line-clamp-1">
                                            {selectedHotelData.details?.address || ''}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                                        <div>
                                            <div className="text-[10px] text-slate-400 uppercase font-semibold leading-tight">{t('hotelPerNight')}</div>
                                            <div className="text-sm font-black text-[#0454E8]">
                                                {Math.round(selectedHotelData.perNight)} {selectedHotelData.hotel.options[0]?.currency}
                                            </div>
                                        </div>
                                        <Button
                                            onClick={() => navigate(`/hotels/${selectedHotelData.hotel.hotelId}?${searchParams.toString()}`)}
                                            className="h-8 px-3.5 bg-gradient-to-r from-[#1775FF] to-[#0454E8] text-white text-xs font-bold rounded-lg shadow-sm hover:brightness-105 active:scale-95 transition-all cursor-pointer"
                                        >
                                            {t('hotelViewDetails')}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Mobile Bottom Sheet Drawer for Filters & Sort */}
            <Sheet open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
                <SheetContent
                    side="bottom"
                    className="rounded-t-3xl max-h-[80vh] p-0 flex flex-col bg-white border-t border-slate-200 focus:outline-none z-[70]"
                >
                    {/* Drag pill indicator */}
                    <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mt-2.5 mb-1 shrink-0" />

                    <div className="px-4 pt-0.5 pb-2 flex items-center justify-between border-b border-slate-100 shrink-0">
                        <div>
                            <SheetTitle className="text-sm font-bold text-slate-800">
                                {t('hotelFilter')} &amp; {t('hotelSort')}
                            </SheetTitle>
                            <SheetDescription className="text-[11px] text-slate-400">
                                {sortedAndFiltered.length} {sortedAndFiltered.length > 1 ? t('hotelResultsFound') : t('hotelResultFound')}
                            </SheetDescription>
                        </div>
                        {activeFilterCount > 0 && (
                            <button
                                onClick={resetFilters}
                                className="text-[11px] font-semibold text-[#1775FF] hover:underline flex items-center gap-1 mr-6 cursor-pointer"
                            >
                                <RotateCcw className="w-3 h-3" />
                                {t('hotelReset')}
                            </button>
                        )}
                    </div>

                    {/* Tab switch */}
                    <div className="p-2 bg-slate-50/80 border-b border-slate-100 shrink-0">
                        <div className="flex bg-slate-200/80 p-0.5 rounded-xl">
                            <button
                                type="button"
                                onClick={() => setDrawerTab('filters')}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                    drawerTab === 'filters'
                                        ? 'bg-white text-slate-900 shadow-2xs'
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                <SlidersHorizontal className="w-3.5 h-3.5 text-[#1775FF]" />
                                <span>{t('hotelFilter')}</span>
                                {activeFilterCount > 0 && (
                                    <span className="w-3.5 h-3.5 rounded-full bg-[#1775FF] text-white text-[9px] font-bold flex items-center justify-center">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => setDrawerTab('sort')}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                    drawerTab === 'sort'
                                        ? 'bg-white text-slate-900 shadow-2xs'
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                <ArrowUpDown className="w-3.5 h-3.5 text-amber-500" />
                                <span>{t('hotelSort')}</span>
                                {sortBy !== 'recommended' && (
                                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Scrollable content body */}
                    <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
                        {drawerTab === 'sort' ? (
                            <div className="space-y-1.5">
                                {SORT_OPTIONS.map((opt) => {
                                    const isSelected = sortBy === opt.id;
                                    return (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() => {
                                                setSortBy(opt.id);
                                                setPage(1);
                                            }}
                                            className={`w-full flex items-center justify-between py-2 px-3 rounded-xl border text-left transition-all cursor-pointer ${
                                                isSelected
                                                    ? 'border-[#1775FF] bg-[#1775FF]/5 text-[#1775FF] font-bold shadow-2xs'
                                                    : 'border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-medium'
                                            }`}
                                        >
                                            <span className="text-xs">{opt.labelKey ? t(opt.labelKey as any) : opt.defaultLabel}</span>
                                            {isSelected && (
                                                <div className="w-4 h-4 rounded-full bg-[#1775FF] text-white flex items-center justify-center">
                                                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="space-y-3.5">
                                {/* Price Range */}
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{t('hotelMaxPriceNight')}</span>
                                        <span className="text-xs font-bold text-[#1775FF]">
                                            {effectivePriceMax} {results?.[0]?.options?.[0]?.currency ?? ''}
                                        </span>
                                    </div>
                                    <PriceHistogram prices={pricesForRange} max={dataMaxPrice || 1} currentMax={effectivePriceMax} />
                                    <input
                                        type="range"
                                        min={0}
                                        max={dataMaxPrice || 1}
                                        value={effectivePriceMax}
                                        onChange={(e) => {
                                            setPriceMax(Number(e.target.value));
                                            setPage(1);
                                        }}
                                        className="w-full accent-[#1775FF] h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                                    />
                                    <div className="flex justify-between text-[10px] text-slate-400 mt-0.5 font-medium">
                                        <span>0</span>
                                        <span>{dataMaxPrice} {results?.[0]?.options?.[0]?.currency ?? ''}</span>
                                    </div>
                                </div>

                                {/* Star Rating */}
                                <div>
                                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                        {t('hotelStarsRating')}
                                    </div>
                                    <div className="grid grid-cols-5 gap-1.5">
                                        {[5, 4, 3, 2, 1].map((n) => {
                                            const isSelected = selectedStars.includes(n);
                                            return (
                                                <button
                                                    key={n}
                                                    type="button"
                                                    onClick={() => toggleStar(n)}
                                                    className={`flex items-center justify-center gap-0.5 py-1.5 px-1 rounded-lg border transition-all cursor-pointer ${
                                                        isSelected
                                                            ? 'border-amber-400 bg-amber-50 text-amber-900 font-bold shadow-2xs ring-1 ring-amber-400'
                                                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <span className="text-xs font-bold">{n}</span>
                                                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Amenities */}
                                <div>
                                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                        {t('hotelAmenities')}
                                    </div>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {Object.keys(AMENITY_KEYWORDS).map((a) => {
                                            const Icon = AMENITY_ICONS[a] || Wifi;
                                            const isSelected = selectedAmenities.includes(a);
                                            return (
                                                <button
                                                    key={a}
                                                    type="button"
                                                    onClick={() => toggleAmenity(a)}
                                                    className={`flex items-center gap-1.5 p-2 rounded-lg border text-left transition-all cursor-pointer ${
                                                        isSelected
                                                            ? 'border-[#1775FF] bg-blue-50/80 text-[#1775FF] font-semibold shadow-2xs'
                                                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium'
                                                    }`}
                                                >
                                                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#1775FF]' : 'text-slate-400'}`} />
                                                    <span className="text-[11px] truncate">{AMENITY_KEYS[a] ? t(AMENITY_KEYS[a] as any) : a}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer CTA */}
                    <div
                        className="p-3 border-t border-slate-100 bg-white flex items-center gap-2 shrink-0"
                        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)' }}
                    >
                        {activeFilterCount > 0 && (
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                            >
                                {t('hotelClearAll')}
                            </button>
                        )}
                        <Button
                            type="button"
                            onClick={() => setMobileDrawerOpen(false)}
                            className="flex-1 h-10 bg-gradient-to-r from-[#1775FF] to-[#0454E8] text-white font-bold text-xs rounded-xl shadow-xs hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer"
                        >
                            {t('hotelShowHotels')} ({sortedAndFiltered.length})
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}