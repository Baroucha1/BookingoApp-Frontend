import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { decodeHotelSearchParams, formatDateRangeFr, nightsBetween } from '@/lib/hotelSearchParams';
import { hotelHasAmenity } from '@/lib/hotelAmenities';
import {
    searchHotels,
    getHotelDetailsBatch,
    type SearchHotelResult,
    HotelFilterState, EMPTY_FILTERS, HotelRow
} from '@/service/hotels/hotels.service';
import type { TravellandaHotelDetails } from '@/service/admin/hotel/staticdataTravellenda.ts';
import HotelsMap, { type MapHotelPoint } from '@/components/hotels/HotelsMap';
import {getPriceBounds} from "@/lib/hotelPricee.ts";
import HotelResultsHero from "@/components/hotels/hotelResult/HotelResultHero.tsx";
import HotelSearchSummary from "@/components/hotels/hotelResult/HotelSearchSummary.tsx";
import HotelFilterPills from "@/components/hotels/hotelResult/filters/HotelFilterPills.tsx";
import HotelSearchLoading from "@/components/hotels/hotelResult/HotelSearchLoading.tsx";
import HotelResultCard from "@/components/hotels/hotelResult/HotelRessultCard.tsx";
import CompactHotelCard from "@/components/hotels/hotelResult/CompactHotelCard.tsx";
import HotelFilters, {HotelFiltersProps} from "@/components/hotels/hotelResult/filters/HotelFilters.tsx";


const RESULTS_PER_PAGE = 8;
const MAX_VISIBLE_PAGES = 5;

export default function HotelResults() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const params = useMemo(() => decodeHotelSearchParams(searchParams), [searchParams]);

    const [loading, setLoading] = useState(true);
    const [results, setResults] = useState<SearchHotelResult[]>([]);
    const [detailsMap, setDetailsMap] = useState<Record<number, TravellandaHotelDetails>>({});
    const [error, setError] = useState<string | null>(null);

    const [filters, setFilters] = useState<HotelFilterState>(EMPTY_FILTERS);
    const [page, setPage] = useState(1);
    const [showMap, setShowMap] = useState(false);
    const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);

    useEffect(() => {

        if (!params) { setLoading(false); return; }
        let cancelled = false;

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
                if (cancelled) return;
                setResults(result.hotels);

                const ids = result.hotels.map((h) => parseInt(h.hotelId, 10)).filter(Boolean);
                if (ids.length > 0) {
                    const detailsList = await getHotelDetailsBatch(ids);
                    const map: Record<number, TravellandaHotelDetails> = {};
                    detailsList.forEach((d) => { map[d.hotelId] = d; });
                    setDetailsMap(map);
                }
            } catch (err) {
                if (!cancelled) setError(err instanceof Error ? err.message : 'Échec de la recherche');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
    }, [params]);

    if (!params) {
        return (
            <div className="p-16 text-center text-slate-400">
                Paramètres de recherche invalides.{' '}
                <Button variant="link" onClick={() => navigate('/hotels')}>Retour à la recherche</Button>
            </div>
        );
    }

    const nights = nightsBetween(params.checkInDate, params.checkOutDate);
    const totalGuests = params.rooms.reduce((s, r) => s + r.numAdults + r.childAges.length, 0);
    const currency = results[0]?.options[0]?.currency ?? '';

    const withPricing: HotelRow[] = results.map((h) => {
        const cheapest = h.options.reduce((min, o) => Math.min(min, o.totalPrice), Infinity);
        const details = detailsMap[parseInt(h.hotelId, 10)];
        const star = details?.starRating
            ? Math.round(Number(details.starRating))
            : (h.starRating ? Math.round(h.starRating) : 0);
        return { hotel: h, details, cheapestTotal: cheapest, perNight: cheapest / nights, star };
    });

    const pricesForRange = withPricing.map((w) => w.perNight).filter((p) => Number.isFinite(p));
    const priceBounds = getPriceBounds(pricesForRange);

    const filtered = withPricing.filter((r) => {
        if (filters.priceRange) {
            const [lo, hi] = filters.priceRange;
            if (r.perNight < lo) return false;
            // Upper thumb at the max means "and above"
            if (hi < priceBounds[1] && r.perNight > hi) return false;
        }
        if (filters.stars.length > 0 && !filters.stars.includes(r.star)) return false;
        if (filters.amenities.length > 0 && !filters.amenities.every((a) => hotelHasAmenity(r.details, a))) return false;
        return true;
    });

    const mapPoints: MapHotelPoint[] = filtered
        .filter((r) => r.details?.latitude && r.details?.longitude)
        .map((r) => ({
            hotelId: r.hotel.hotelId,
            hotelName: r.hotel.hotelName,
            lat: r.details!.latitude,
            lng: r.details!.longitude,
            price: r.perNight,
            currency: r.hotel.options[0]?.currency ?? '',
        }));

    const totalPages = Math.max(1, Math.ceil(filtered.length / RESULTS_PER_PAGE));
    const pageResults = filtered.slice((page - 1) * RESULTS_PER_PAGE, page * RESULTS_PER_PAGE);
    const firstVisible = Math.max(1, Math.min(page - 2, totalPages - MAX_VISIBLE_PAGES + 1));
    const visiblePages = Array.from({ length: Math.min(MAX_VISIBLE_PAGES, totalPages) }, (_, i) => firstVisible + i);

    const goToDetails = (hotelId: string) => navigate(`/hotels/${hotelId}?${searchParams.toString()}`);

    const filterProps: HotelFiltersProps = {
        prices: pricesForRange,
        priceBounds,
        filters,
        onChange: (next) => { setFilters(next); setPage(1); },
        currency,
    };

    return (
        <div className="min-h-screen bg-[#F0F6FF]">
            <HotelResultsHero />

            <HotelSearchSummary
                destinationLabel={params.cityName || undefined}
                dateLabel={formatDateRangeFr(params.checkInDate, params.checkOutDate)}
                roomsCount={params.rooms.length}
                totalGuests={totalGuests}
                onEdit={() => navigate(`/hotels?${searchParams.toString()}`)}
            />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
                <aside className="hidden lg:block">
                    <div className="sticky top-4">
                        <HotelFilters {...filterProps} />
                    </div>
                </aside>

                <div className="min-w-0">
                    <HotelFilterPills {...filterProps} className="lg:hidden mb-3" />

                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <span className="text-sm font-semibold text-slate-700">
                            Résultats de recherche : {filtered.length} hôtel{filtered.length !== 1 ? 's' : ''}
                        </span>
                        <button
                            onClick={() => setShowMap((v) => !v)}
                            className="text-xs font-semibold text-[#1775FF] flex items-center gap-1 border border-[#1775FF] rounded-lg px-3 py-1.5 hover:bg-[#DFECFF]/40"
                        >
                            <MapPin className="w-3.5 h-3.5" /> {showMap ? 'Fermer la carte' : 'Voir sur la carte'}
                        </button>
                    </div>

                    {loading && <HotelSearchLoading />}

                    {!loading && error && <div className="py-10 text-center text-red-500 text-sm">{error}</div>}

                    {!loading && !error && (
                        <div className="space-y-3">
                            {pageResults.map(({ hotel, details, perNight, star }, idx) => (
                                <HotelResultCard
                                    key={`${hotel.hotelId}-${idx}`}
                                    hotel={hotel}
                                    details={details}
                                    perNight={perNight}
                                    star={star}
                                    onDetails={() => goToDetails(hotel.hotelId)}
                                />
                            ))}
                            {filtered.length === 0 && (
                                <div className="py-16 text-center text-slate-400">Aucun hôtel ne correspond à ces critères.</div>
                            )}
                        </div>
                    )}

                    {totalPages > 1 && (
                        <div className="flex flex-wrap items-center justify-center gap-1 mt-6">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage((p) => p - 1)}
                                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center disabled:opacity-40"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            {visiblePages.map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPage(p)}
                                    className={`w-8 h-8 rounded-lg text-sm ${p === page ? 'bg-[#1775FF] text-white' : 'border border-slate-200 text-slate-600'}`}
                                >
                                    {p}
                                </button>
                            ))}
                            <button
                                disabled={page === totalPages}
                                onClick={() => setPage((p) => p + 1)}
                                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center disabled:opacity-40"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {showMap && (
                <div className="fixed inset-0 z-50 bg-white flex flex-col-reverse md:flex-row">
                    <div className="h-[40vh] md:h-auto w-full md:max-w-sm border-t md:border-t-0 md:border-r border-slate-100 overflow-y-auto">
                        <div className="p-4 border-b border-slate-100 sticky top-0 bg-white z-10">
                            <span className="text-sm font-semibold text-slate-700">
                                {filtered.length} hôtel{filtered.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                        <div className="p-2">
                            {filtered.map(({ hotel, details, perNight, star }, idx) => (
                                <CompactHotelCard
                                    key={`${hotel.hotelId}-${idx}`}
                                    hotel={hotel}
                                    details={details}
                                    perNight={perNight}
                                    star={star}
                                    selected={selectedHotelId === hotel.hotelId}
                                    onSelect={() => setSelectedHotelId(hotel.hotelId)}
                                    onDetails={() => goToDetails(hotel.hotelId)}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 relative min-h-0">
                        <HotelsMap points={mapPoints} selectedHotelId={selectedHotelId} onSelectHotel={(id) => setSelectedHotelId(id)} />
                        <button
                            onClick={() => setShowMap(false)}
                            className="absolute top-4 right-4 z-[1000] bg-white shadow-lg rounded-lg px-4 py-2 text-sm font-semibold flex items-center gap-2 hover:bg-slate-50"
                        >
                            Fermer la carte <span className="text-lg leading-none">×</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}