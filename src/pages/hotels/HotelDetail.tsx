// src/pages/hotels/HotelDetail.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
    Star, MapPin, Wifi, Utensils, Waves, Wind, Dumbbell, ParkingCircle,
    Wine, PlaneTakeoff, ChevronLeft, ChevronRight, Loader2, ArrowLeft, X, RefreshCw, AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { decodeHotelSearchParams, formatDateRangeFr, nightsBetween } from '@/lib/hotelSearchParams';
import {
    searchHotels, getHotelDetailsBatch, getHotelPolicies,
    type SearchHotelResult, type HotelPolicies,
} from '@/service/hotels/hotels.service';
import type { TravellandaHotelDetails } from '@/service/admin/hotel/staticdataTravellenda.ts';
import {
    buildRoomOffers, getAvailableRoomFilters, matchesRoomFilter, formatAmount, type RoomOffer,
} from '@/lib/roomFilters';
import RoomFilterPills from '@/components/hotels/hotelDetail/RoomFilterPills';
import RoomOfferCard from '@/components/hotels/hotelDetail/RoomOfferCard';
import BookingConfirmDialog from '@/components/hotels/hotelDetail/BookingConfirmDialog';

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
    if (!facilities) return [];
    return AMENITY_ICONS.filter((a) =>
        facilities.some((f) => a.keywords.some((kw) => f.facilityName.toLowerCase().includes(kw))),
    );
}

export default function HotelDetail() {
    const { hotelId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const searchQuery = searchParams.toString();
    const params = useMemo(() => decodeHotelSearchParams(searchParams), [searchParams]);

    // Static hotel details
    const [details, setDetails] = useState<TravellandaHotelDetails | null>(null);
    const [detailsLoading, setDetailsLoading] = useState(true);
    const [detailsError, setDetailsError] = useState<string | null>(null);

    // Live offers (fresh search)
    const [searchResult, setSearchResult] = useState<SearchHotelResult | null>(null);
    const [offersLoading, setOffersLoading] = useState(!!params);
    const [offersError, setOffersError] = useState<string | null>(null);
    const [reloadToken, setReloadToken] = useState(0);

    // Room filters
    const [roomFilters, setRoomFilters] = useState<string[]>([]);

    // Booking confirmation
    const [policiesByOption, setPoliciesByOption] = useState<Record<string, HotelPolicies>>({});
    const [dialogOffer, setDialogOffer] = useState<RoomOffer | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [checkingOption, setCheckingOption] = useState<string | null>(null);
    const [policyError, setPolicyError] = useState<string | null>(null);
    const latestPolicyRequest = useRef<string | null>(null);

    // Gallery
    const [carouselOpen, setCarouselOpen] = useState(false);
    const [carouselIndex, setCarouselIndex] = useState(0);

    useEffect(() => {
        if (!hotelId) return;
        let cancelled = false;
        setDetailsLoading(true);
        setDetailsError(null);
        getHotelDetailsBatch([Number(hotelId)])
            .then(([d]) => { if (!cancelled) setDetails(d ?? null); })
            .catch((err) => { if (!cancelled) setDetailsError(err instanceof Error ? err.message : 'Échec du chargement'); })
            .finally(() => { if (!cancelled) setDetailsLoading(false); });
        return () => { cancelled = true; };
    }, [hotelId]);

    // Fresh search every time the page opens, the URL changes, or the user refreshes
    useEffect(() => {
        const p = decodeHotelSearchParams(new URLSearchParams(searchQuery));
        if (!hotelId || !p) { setOffersLoading(false); return; }

        let cancelled = false;
        setOffersLoading(true);
        setOffersError(null);
        setPoliciesByOption({}); // option IDs from a previous search are no longer valid

        searchHotels({
            hotelIds: [Number(hotelId)],
            checkInDate: p.checkInDate,
            checkOutDate: p.checkOutDate,
            rooms: p.rooms,
            nationality: p.nationality,
            availableOnly: p.availableOnly,
        })
            .then((r) => { if (!cancelled) setSearchResult(r.hotels[0] ?? null); })
            .catch((err) => { if (!cancelled) setOffersError(err instanceof Error ? err.message : 'Échec de la recherche'); })
            .finally(() => { if (!cancelled) setOffersLoading(false); });

        return () => { cancelled = true; };
    }, [hotelId, searchQuery, reloadToken]);

    const offers = useMemo(() => (searchResult ? buildRoomOffers(searchResult.options) : []), [searchResult]);
    const availableFilters = useMemo(() => getAvailableRoomFilters(offers), [offers]);
    const visibleOffers = offers.filter((o) => roomFilters.every((id) => matchesRoomFilter(o, id)));

    const fetchPolicies = useCallback(async (optionId: string) => {
        latestPolicyRequest.current = optionId;
        setCheckingOption(optionId);
        setPolicyError(null);
        try {
            const result = await getHotelPolicies(optionId);
            setPoliciesByOption((prev) => ({ ...prev, [optionId]: result }));
        } catch (err) {
            if (latestPolicyRequest.current === optionId) {
                setPolicyError(err instanceof Error ? err.message : 'Échec de la vérification');
            }
        } finally {
            if (latestPolicyRequest.current === optionId) setCheckingOption(null);
        }
    }, []);

    const reserve = (offer: RoomOffer) => {
        setDialogOffer(offer);
        setPolicyError(null);
        setDialogOpen(true);
        if (!policiesByOption[offer.option.optionId]) fetchPolicies(offer.option.optionId);
    };

    const refreshSearch = () => {
        setDialogOpen(false);
        setReloadToken((n) => n + 1);
    };

    const backToResults = () => {
        navigate(params ? `/hotels/results?${searchQuery}` : '/hotels');
    };

    if (detailsLoading) {
        return (
            <div className="p-20 text-center text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /> Chargement...
            </div>
        );
    }
    if (detailsError || !details) {
        return (
            <div className="p-20 text-center text-red-500">
                {detailsError ?? 'Hôtel introuvable'}
                <div><Button variant="link" onClick={backToResults}>Retour</Button></div>
            </div>
        );
    }

    const amenities = matchedAmenities(details.facilities);
    const cheapest = offers[0] ?? null;
    const nights = params ? nightsBetween(params.checkInDate, params.checkOutDate) : 0;
    const dateLabel = params ? formatDateRangeFr(params.checkInDate, params.checkOutDate) : '';

    const confirmBooking = () => {
        if (!dialogOffer || !hotelId) return;
        const policies = policiesByOption[dialogOffer.option.optionId];
        if (!policies) return;

        // Search params stay in the checkout URL: back/reload can always rebuild the flow
        const qs = new URLSearchParams(searchParams);
        qs.set('hotelId', hotelId);
        qs.set('optionId', dialogOffer.option.optionId);

        navigate(`/hotels/checkout?${qs.toString()}`, {
            state: {
                hotelId,
                hotelName: details.name,
                hotelImage: details.images[0] ?? null,
                address: details.address,
                starRating: details.starRating,
                checkInDate: params?.checkInDate,
                checkOutDate: params?.checkOutDate,
                option: dialogOffer.option,
                confirmedPrice: policies.price,
                cancellationPolicy: policies.policies,
            },
        });
    };

    return (
        <div className="min-h-screen bg-[#F0F6FF]">
            <div className="relative h-64 sm:h-72 overflow-hidden">
                <img src="/assets/hotels/detail.png" alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-[#F0F6FF] z-10" />

                <div className="relative z-20 max-w-6xl mx-auto px-4 sm:px-6 h-full flex flex-col justify-end pb-6">
                    <button onClick={backToResults} className="flex items-center gap-1 text-sm text-white font-semibold mb-3 w-fit hover:underline">
                        <ArrowLeft className="w-4 h-4" /> Retour aux résultats
                    </button>

                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-xl sm:text-2xl font-bold text-white drop-shadow">{details.name}</h1>
                        {details.starRating && (
                            <span className="flex gap-0.5">
                                {Array.from({ length: Math.round(Number(details.starRating)) }, (_, i) => (
                                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                                ))}
                            </span>
                        )}
                    </div>
                    <div className="flex items-start gap-1 text-sm text-white/90 mt-1">
                        <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" /> <span className="line-clamp-2">{details.address}</span>
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

            <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6">
                    <div className="space-y-6 min-w-0">
                        {/* Gallery */}
                        <div className="grid grid-cols-3 gap-2 rounded-xl overflow-hidden h-56 sm:h-72">
                            <button onClick={() => { setCarouselIndex(0); setCarouselOpen(true); }} className="col-span-2 row-span-2 relative">
                                {details.images[0] ? (
                                    <img src={details.images[0]} alt="" className="w-full h-full object-cover" />
                                ) : <div className="w-full h-full bg-slate-100" />}
                                <span className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">1 / {details.images.length}</span>
                            </button>
                            {details.images.slice(1, 5).map((url, i) => (
                                <button key={i} onClick={() => { setCarouselIndex(i + 1); setCarouselOpen(true); }} className="relative">
                                    <img src={url} alt="" loading="lazy" className="w-full h-full object-cover" />
                                    {i === 3 && details.images.length > 5 && (
                                        <span className="absolute inset-0 bg-black/50 text-white text-sm font-semibold flex items-center justify-center">
                                            +{details.images.length - 5} photos
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="bg-white rounded-xl border border-slate-100 p-5">
                            <div className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                                <Star className="w-4 h-4 text-[#1775FF]" /> Description de l'hôtel
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed">{details.description}</p>
                        </div>

                        {/* Rooms */}
                        <div className="bg-white rounded-xl border border-slate-100 p-5">
                            <div className="flex items-center justify-between gap-2 mb-3">
                                <div className="font-semibold text-slate-800">Les chambres disponibles</div>
                                {params && !offersLoading && (
                                    <button onClick={refreshSearch} className="text-xs text-[#1775FF] flex items-center gap-1 hover:underline">
                                        <RefreshCw className="w-3.5 h-3.5" /> Actualiser
                                    </button>
                                )}
                            </div>

                            {!params && (
                                <div className="text-sm text-slate-400 py-4">
                                    Sélectionnez des dates depuis la recherche pour voir les chambres et les prix disponibles.
                                </div>
                            )}

                            {params && offersLoading && (
                                <div className="py-8 flex items-center justify-center gap-2 text-sm text-slate-400">
                                    <Loader2 className="w-4 h-4 animate-spin" /> Recherche des meilleures offres…
                                </div>
                            )}

                            {params && !offersLoading && offersError && (
                                <div className="py-4 text-sm text-red-500 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" /> {offersError}
                                    <button onClick={refreshSearch} className="underline">Réessayer</button>
                                </div>
                            )}

                            {params && !offersLoading && !offersError && (
                                <>
                                    <RoomFilterPills
                                        filters={availableFilters}
                                        selected={roomFilters}
                                        onToggle={(id) => setRoomFilters((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))}
                                        onClear={() => setRoomFilters([])}
                                    />

                                    {offers.length === 0 && (
                                        <div className="text-sm text-slate-400 py-4">Aucune chambre disponible pour ces dates.</div>
                                    )}

                                    {offers.length > 0 && visibleOffers.length === 0 && (
                                        <div className="text-sm text-slate-400 py-4">
                                            Aucune chambre ne correspond à ces filtres.{' '}
                                            <button onClick={() => setRoomFilters([])} className="text-[#1775FF] underline">Effacer les filtres</button>
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        {visibleOffers.map((offer) => (
                                            <RoomOfferCard
                                                key={offer.key}
                                                offer={offer}
                                                checking={checkingOption === offer.option.optionId}
                                                onReserve={() => reserve(offer)}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Reviews (coming soon) */}
                        <div className="bg-white rounded-xl border border-slate-100 p-5 relative overflow-hidden">
                            <div className="font-semibold text-slate-800 mb-3">Avis des voyageurs</div>
                            <div className="blur-sm pointer-events-none select-none">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="text-3xl font-bold text-slate-800">4.5<span className="text-sm text-slate-400">/5</span></div>
                                    <div className="text-xs text-slate-400">(324 avis)</div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                    <div className="bg-slate-50 rounded-lg p-3">Sophie L. — "Hôtel magnifique, service impeccable."</div>
                                    <div className="bg-slate-50 rounded-lg p-3">Karim B. — "Le spa est un vrai plus."</div>
                                </div>
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center bg-white/40">
                                <span className="bg-[#1775FF] text-white text-sm font-semibold px-4 py-2 rounded-full shadow">Bientôt disponible</span>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl border border-slate-100 p-5">
                            {offersLoading ? (
                                <div className="flex items-center gap-2 text-sm text-slate-400"><Loader2 className="w-4 h-4 animate-spin" /> Chargement des prix…</div>
                            ) : cheapest ? (
                                <>
                                    <div className="text-[11px] text-slate-400">À partir de</div>
                                    <div className="text-2xl font-bold text-slate-800">{formatAmount(cheapest.price, cheapest.currency)}</div>
                                    <div className="text-[11px] text-slate-400 mb-3">pour {nights} nuit{nights > 1 ? 's' : ''}</div>
                                </>
                            ) : (
                                <div className="text-sm text-slate-400 mb-3">Sélectionnez des dates pour voir les prix</div>
                            )}
                            <div className="text-xs text-slate-500 mt-3 space-y-1">
                                <div>✓ Confirmation immédiate</div>
                                <div>✓ Conditions affichées avant paiement</div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-100 p-5">
                            <div className="font-semibold text-slate-800 mb-3">Informations principales</div>
                            <div className="text-sm text-slate-600">
                                Type d'hébergement<br />
                                <span className="font-medium text-slate-800">Hôtel{details.starRating ? ` ${details.starRating} étoiles` : ''}</span>
                            </div>
                        </div>

                        {amenities.length > 0 && (
                            <div className="bg-white rounded-xl border border-slate-100 p-5">
                                <div className="font-semibold text-slate-800 mb-3">Équipements de l'hôtel</div>
                                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                                    {amenities.map(({ label, icon: Icon }) => (
                                        <div key={label} className="flex items-center gap-1.5">
                                            <Icon className="w-3.5 h-3.5 text-[#1775FF]" /> {label}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {details.latitude && details.longitude && (
                            <div className="bg-white rounded-xl border border-slate-100 p-5">
                                <div className="font-semibold text-slate-800 mb-3">Localisation</div>
                                <div className="rounded-lg overflow-hidden mb-2 h-32">
                                    <iframe
                                        title="location"
                                        width="100%"
                                        height="100%"
                                        style={{ border: 0 }}
                                        loading="lazy"
                                        src={`https://www.google.com/maps?q=${details.latitude},${details.longitude}&z=15&output=embed`}
                                    />
                                </div>
                                <div className="text-xs text-slate-500">{details.address}</div>
                                <a
                                href={`https://www.google.com/maps?q=${details.latitude},${details.longitude}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-[#1775FF] hover:underline"
                                >
                                Voir sur la carte →
                            </a>
                            </div>
                            )}
                    </div>
                </div>

                <button onClick={() => navigate('/hotels')} className="w-full mt-8 mb-10 rounded-xl overflow-hidden relative min-h-28 text-left">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#1775FF] to-[#0B2A5C]" />
                    <div className="relative z-10 h-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-5">
                        <div>
                            <div className="text-white font-bold">Votre prochain voyage commence ici</div>
                            <div className="text-white/80 text-sm">Découvrez des milliers d'hébergements dans le monde entier</div>
                        </div>
                        <span className="bg-[#F5A623] text-[#0B2A5C] font-bold text-sm px-4 py-2 rounded-lg shrink-0 w-fit">
                            Explorer plus d'hôtels
                        </span>
                    </div>
                </button>
            </div>

            <BookingConfirmDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                offer={dialogOffer}
                policies={dialogOffer ? policiesByOption[dialogOffer.option.optionId] ?? null : null}
                loading={!!dialogOffer && checkingOption === dialogOffer.option.optionId}
                error={policyError}
                hotelName={details.name}
                dateLabel={dateLabel}
                nights={nights}
                onRetry={() => dialogOffer && fetchPolicies(dialogOffer.option.optionId)}
                onRefreshSearch={refreshSearch}
                onConfirm={confirmBooking}
            />

            <Dialog open={carouselOpen} onOpenChange={setCarouselOpen}>
                <DialogContent className="max-w-4xl bg-black border-0 p-0">
                    <DialogTitle className="sr-only">Photos de {details.name}</DialogTitle>
                    <div className="relative h-[70vh]">
                        <img src={details.images[carouselIndex]} alt="" className="w-full h-full object-contain" />
                        <button onClick={() => setCarouselOpen(false)} className="absolute top-3 right-3 text-white bg-black/50 rounded-full p-2">
                            <X className="w-4 h-4" />
                        </button>
                        <button onClick={() => setCarouselIndex((i) => (i === 0 ? details.images.length - 1 : i - 1))} className="absolute left-3 top-1/2 -translate-y-1/2 text-white bg-black/50 rounded-full p-2">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button onClick={() => setCarouselIndex((i) => (i === details.images.length - 1 ? 0 : i + 1))} className="absolute right-3 top-1/2 -translate-y-1/2 text-white bg-black/50 rounded-full p-2">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                        <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded-full">
                            {carouselIndex + 1} / {details.images.length}
                        </span>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}