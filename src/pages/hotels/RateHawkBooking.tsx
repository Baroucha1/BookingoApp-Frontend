import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin, Calendar, ArrowRight, ArrowLeft, Star, Wifi, Check, X,
    Building2, Utensils, Wind, ParkingCircle, Dumbbell, Sparkles,
} from 'lucide-react';
import {
    searchHotels,
    searchHotelsByIds,
    getHotelpage,
    getHotelsContent,
    prebook,
    bookHotel,
    searchDestinations,
    type RateHawkHotelResult,
    type RateHawkHotelpageResult,
    type RateHawkRate,
    type RateHawkHotelContent,
    type RateHawkRoomGuests,
    type DestinationSuggestion,
} from '@/service/ratehawk.service';
import { useAuth } from '@/hooks/useAuth';
import BookingStepper from '@/components/hotels/BookingStepper';
import RoomsSelector from '@/components/hotels/RoomsSelector';

const STEPS = [
    { label: 'Destination' },
    { label: 'Hôtels' },
    { label: 'Chambre & Tarif' },
    { label: 'Voyageurs' },
];

const SANDBOX_REGIONS = [
    { regionId: 6053839, name: 'Région sandbox (vérifiée)' },
    { regionId: 2011, name: 'Région sandbox 2011' },
    { regionId: 2395, name: 'Région sandbox 2395' },
    { regionId: 2734, name: 'Région sandbox 2734' },
];

const NATIONALITIES = [
    { code: 'us', label: 'États-Unis' },
    { code: 'dz', label: 'Algérie' },
    { code: 'fr', label: 'France' },
    { code: 'gb', label: 'Royaume-Uni' },
    { code: 'ae', label: 'Émirats arabes unis' },
];

const AMENITY_ICONS: Record<string, any> = {
    'Wifi': Wifi, 'Air conditioning': Wind, 'Parking': ParkingCircle,
    'Fitness facilities': Dumbbell, 'Gym': Dumbbell,
};

const MAX_RESULTS_DISPLAYED = 30;
const CONTENT_BATCH_SIZE = 100; // API limit: max 100 ids per /content request

export default function RateHawkBooking() {
    const { user } = useAuth();

    const [stepIndex, setStepIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ── Step 1 — search form ────────────────────────────────────────────────
    const [destinationQuery, setDestinationQuery] = useState('');
    const [destination, setDestination] = useState<DestinationSuggestion | null>(null);
    const [suggestions, setSuggestions] = useState<DestinationSuggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [useSandboxRegion, setUseSandboxRegion] = useState(SANDBOX_REGIONS[0].regionId);
    const [checkin, setCheckin] = useState('2026-10-22');
    const [checkout, setCheckout] = useState('2026-10-25');
    const [nationality, setNationality] = useState('us');
    const [rooms, setRooms] = useState<RateHawkRoomGuests[]>([{ adults: 2, childrenAges: [] }]);
    const searchBoxRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = setTimeout(() => {
            if (destinationQuery.length >= 2 && !destination) {
                searchDestinations(destinationQuery).then((res) => {
                    setSuggestions(res);
                    setShowSuggestions(true);
                });
            } else {
                setShowSuggestions(false);
            }
        }, 250);
        return () => clearTimeout(handler);
    }, [destinationQuery, destination]);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ── Step 2 — results (enriched with content) ────────────────────────────
    const [hotels, setHotels] = useState<RateHawkHotelResult[]>([]);
    const [totalFound, setTotalFound] = useState(0);
    const [contentMap, setContentMap] = useState<Record<string, RateHawkHotelContent>>({});

    // ── Step 3 — hotelpage / rate selection ─────────────────────────────────
    const [selectedHotel, setSelectedHotel] = useState<RateHawkHotelpageResult | null>(null);
    const [selectedHotelId, setSelectedHotelId] = useState<string>('');
    const [selectedRate, setSelectedRate] = useState<RateHawkRate | null>(null);
    const [priceChanged, setPriceChanged] = useState(false);

    // ── Step 4 — guests ──────────────────────────────────────────────────────
    const [guestName, setGuestName] = useState({ firstName: '', lastName: '' });

    const [bookingResult, setBookingResult] = useState<{ bookingId: string } | null>(null);

    const rateHawkGuests = rooms.map((r) => ({ adults: r.adults, children: r.childrenAges }));
    const nights = checkin && checkout ? Math.max(1, Math.round((+new Date(checkout) - +new Date(checkin)) / 86400000)) : 0;

    /**
     * Fetches static content (name, images, amenities) for a batch of hotels,
     * chunked into groups of 100 to respect the Content API's per-request limit.
     */
    async function enrichWithContent(results: RateHawkHotelResult[]) {
        try {
            const ids = results.map((h) => h.id);
            const merged: Record<string, RateHawkHotelContent> = {};

            for (let i = 0; i < ids.length; i += CONTENT_BATCH_SIZE) {
                const batch = ids.slice(i, i + CONTENT_BATCH_SIZE);
                const map = await getHotelsContent(batch);
                Object.assign(merged, map);
            }

            setContentMap(merged);
        } catch {
            // Content enrichment is best-effort — search still works without it
        }
    }

    async function handleSearch() {
        if (!destination && !useSandboxRegion) {
            setError('Merci de sélectionner une destination.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const results = await searchHotels({
                regionId: destination?.regionId ?? useSandboxRegion,
                regionName: destination?.name ?? 'Sandbox',
                checkin, checkout,
                rooms: rateHawkGuests,
                residency: nationality,
            });
            setTotalFound(results.length);
            const limited = results.slice(0, MAX_RESULTS_DISPLAYED);
            setHotels(limited);
            setStepIndex(1);
            enrichWithContent(limited);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleTestHotelSearch() {
        setLoading(true);
        setError(null);
        try {
            const results = await searchHotelsByIds([10004834], {
                checkin, checkout, rooms: rateHawkGuests, residency: nationality,
            });
            setTotalFound(results.length);
            setHotels(results);
            setStepIndex(1);
            await enrichWithContent(results);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleSelectHotel(hotelId: string) {
        setLoading(true);
        setError(null);
        try {
            const page = await getHotelpage(hotelId, {
                checkin, checkout, rooms: rateHawkGuests, residency: nationality,
            });
            setSelectedHotel(page);
            setSelectedHotelId(hotelId);
            setStepIndex(2);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleSelectRate(rate: RateHawkRate) {
        setLoading(true);
        setError(null);
        try {
            const result = await prebook(rate.bookHash);
            setPriceChanged(result.priceChanged);
            setSelectedRate({ ...rate, bookHash: result.bookHash, price: result.newPrice ?? rate.price });
            setStepIndex(3);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleConfirmBooking() {
        if (!selectedHotel || !selectedRate) return;
        setLoading(true);
        setError(null);
        try {
            const result = await bookHotel({
                hotelId: selectedHotelId,
                bookHash: selectedRate.bookHash,
                orderId: `bookingo_${Date.now()}`,
                rooms: rooms.map((r) => ({
                    adults: r.adults,
                    children: r.childrenAges,
                    adultsDetails: [{ firstName: guestName.firstName, lastName: guestName.lastName }],
                    childrenDetails: r.childrenAges.map(() => ({ firstName: 'Child', lastName: guestName.lastName })),
                })),
                checkin, checkout,
                boardType: selectedRate.boardType,
                totalPrice: selectedRate.price,
                currency: selectedRate.currency,
                payment: { type: 'deposit' },
            });

            if (result.status === 'confirmed') {
                setBookingResult({ bookingId: result.bookingId });
            } else {
                setError(`Réservation échouée : ${result.reason}`);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    function resetAll() {
        setStepIndex(0);
        setDestination(null);
        setDestinationQuery('');
        setHotels([]);
        setTotalFound(0);
        setContentMap({});
        setSelectedHotel(null);
        setSelectedRate(null);
        setBookingResult(null);
        setGuestName({ firstName: '', lastName: '' });
    }

    function getContent(hotelId: string): RateHawkHotelContent | undefined {
        return contentMap[hotelId] || contentMap[String(hotelId)];
    }

    if (bookingResult) {
        return (
            <div className="max-w-xl mx-auto py-16 px-4 text-center">
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-5">
                        <Check size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Réservation confirmée !</h2>
                    <p className="text-gray-500 mb-1">{selectedHotel?.name}</p>
                    <p className="text-sm text-gray-400 mb-6">Référence : {bookingResult.bookingId}</p>
                    <button onClick={resetAll} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition">
                        Nouvelle recherche
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-10 px-4">
            <BookingStepper steps={STEPS} currentStep={stepIndex} />

            <AnimatePresence>
                {error && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-3 mb-4 flex items-center justify-between text-sm">
                        {error}
                        <button onClick={() => setError(null)}><X size={16} /></button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">

                {/* ── Step 1: Search ─────────────────────────────────────────────── */}
                {stepIndex === 0 && (
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Où souhaitez-vous séjourner ? 🏨</h3>
                        <p className="text-sm text-gray-400 mb-6">Recherchez un hôtel selon vos critères</p>

                        <div className="space-y-5">
                            <div ref={searchBoxRef} className="relative">
                                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Destination *</label>
                                <div className="relative">
                                    <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" />
                                    <input
                                        value={destination ? `${destination.name}, ${destination.country}` : destinationQuery}
                                        onChange={(e) => { setDestination(null); setDestinationQuery(e.target.value); }}
                                        onFocus={() => destinationQuery.length >= 2 && setShowSuggestions(true)}
                                        placeholder="Ville, hôtel, région…"
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                                    />
                                </div>
                                {showSuggestions && suggestions.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden">
                                        {suggestions.map((s) => (
                                            <button key={s.regionId} onClick={() => { setDestination(s); setShowSuggestions(false); }}
                                                    className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-blue-50 text-left transition">
                                                <MapPin size={14} className="text-gray-400" />
                                                <span className="text-sm text-gray-800">{s.name}, {s.country}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                <p className="text-xs text-gray-400 mt-1">
                                    💡 Sandbox : l'autocomplétion ne trouve que 5 hôtels de démo. Utilisez plutôt la sélection de région ci-dessous ou le bouton de test.
                                </p>
                            </div>

                            {!destination && (
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Ou choisir une région sandbox</label>
                                    <select
                                        value={useSandboxRegion}
                                        onChange={(e) => setUseSandboxRegion(Number(e.target.value))}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none transition"
                                    >
                                        {SANDBOX_REGIONS.map((r) => (
                                            <option key={r.regionId} value={r.regionId}>{r.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Date d'arrivée *</label>
                                    <div className="relative">
                                        <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" />
                                        <input type="date" value={checkin} onChange={(e) => setCheckin(e.target.value)}
                                               className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Date de départ *</label>
                                    <div className="relative">
                                        <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" />
                                        <input type="date" value={checkout} onChange={(e) => setCheckout(e.target.value)}
                                               className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition" />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Nationalité *</label>
                                <select
                                    value={nationality}
                                    onChange={(e) => setNationality(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none transition"
                                >
                                    {NATIONALITIES.map((n) => (
                                        <option key={n.code} value={n.code}>{n.label}</option>
                                    ))}
                                </select>
                            </div>

                            <RoomsSelector rooms={rooms} onChange={setRooms} />

                            <button
                                onClick={handleSearch}
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3.5 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-60"
                            >
                                {loading ? 'Recherche…' : (<>Rechercher <ArrowRight size={18} /></>)}
                            </button>

                            <div className="pt-2 border-t">
                                <button onClick={handleTestHotelSearch} disabled={loading} className="text-sm text-blue-600 underline hover:text-blue-800 transition">
                                    🧪 Tester avec l'hôtel sandbox certifié (Conrad Los Angeles)
                                </button>
                                <p className="text-xs text-gray-400 mt-1">Flow complet search → book → cancel vérifié fonctionnel sur cet hôtel.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Step 2: Results (enriched) ──────────────────────────────────── */}
                {stepIndex === 1 && (
                    <div>
                        <button onClick={() => setStepIndex(0)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition">
                            <ArrowLeft size={16} /> Modifier la recherche
                        </button>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{totalFound} hôtel(s) trouvé(s)</h3>
                        {totalFound > hotels.length && (
                            <p className="text-xs text-gray-400 mb-4">Affichage des {hotels.length} premiers résultats.</p>
                        )}
                        <div className="space-y-3">
                            {hotels.map((hotel) => {
                                const content = getContent(hotel.id);
                                const displayImage = content?.images?.[0] || hotel.image;
                                const displayName = content?.name || hotel.name;
                                const displayAddress = content?.address || hotel.address;
                                const displayStars = content?.starRating ?? hotel.starRating;
                                const topAmenities: string[] = content?.amenities?.[0]?.amenities?.slice(0, 3) || [];

                                return (
                                    <motion.div key={hotel.id} whileHover={{ y: -2 }}
                                                className="flex gap-4 border border-gray-100 rounded-xl p-3 hover:shadow-md transition cursor-pointer"
                                                onClick={() => handleSelectHotel(hotel.id)}>
                                        <img
                                            src={displayImage}
                                            alt={displayName}
                                            className="w-32 h-24 object-cover rounded-lg flex-shrink-0 bg-gray-100"
                                            onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-gray-900 truncate">{displayName}</h4>
                                            <p className="text-xs text-gray-400 truncate">{displayAddress}</p>
                                            <div className="flex items-center gap-0.5 mt-1">
                                                {Array.from({ length: Math.round(Number(displayStars) || 0) }).map((_, i) => (
                                                    <Star key={i} size={13} className="fill-amber-400 text-amber-400" />
                                                ))}
                                            </div>
                                            {topAmenities.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                                    {topAmenities.map((a) => {
                                                        const Icon = AMENITY_ICONS[a] || Sparkles;
                                                        return (
                                                            <span key={a} className="inline-flex items-center gap-1 text-[11px] text-gray-500 bg-gray-50 rounded-full px-2 py-0.5">
                                <Icon size={10} /> {a}
                              </span>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-400">
                                                <Utensils size={12} /> {hotel.boardType}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end justify-between flex-shrink-0">
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-gray-900">{hotel.lowestPrice} {hotel.currency}</p>
                                                <p className="text-xs text-gray-400">total séjour</p>
                                            </div>
                                            <span className="text-xs font-medium text-blue-600 flex items-center gap-1">
                        Voir les tarifs <ArrowRight size={12} />
                      </span>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ── Step 3: Hotelpage / rate selection (enriched) ───────────────── */}
                {stepIndex === 2 && selectedHotel && (() => {
                    const content = getContent(selectedHotelId);
                    return (
                        <div>
                            <button onClick={() => setStepIndex(1)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition">
                                <ArrowLeft size={16} /> Retour aux résultats
                            </button>

                            <div className="flex items-center gap-1 mb-1">
                                {Array.from({ length: Math.round(Number(content?.starRating) || 0) }).map((_, i) => (
                                    <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                                ))}
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">{content?.name || selectedHotel.name}</h3>
                            <p className="text-sm text-gray-400 mb-4 flex items-center gap-1">
                                <Building2 size={13} /> {content?.address || selectedHotel.address}
                            </p>

                            {content?.images && content.images.length > 0 && (
                                <div className="flex gap-2 overflow-x-auto mb-5 pb-1">
                                    {content.images.slice(0, 8).map((img, i) => (
                                        <img key={i} src={img} alt="" className="w-32 h-24 object-cover rounded-lg flex-shrink-0 bg-gray-100" />
                                    ))}
                                </div>
                            )}

                            {content?.amenities && content.amenities.length > 0 && (
                                <div className="mb-5">
                                    <h4 className="text-sm font-semibold text-gray-800 mb-2">Équipements</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {content.amenities.slice(0, 4).flatMap((group: any) =>
                                                group.amenities.slice(0, 4).map((a: string) => {
                                                    const Icon = AMENITY_ICONS[a] || Sparkles;
                                                    return (
                                                        <span key={a} className="inline-flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 rounded-full px-3 py-1">
                            <Icon size={12} /> {a}
                          </span>
                                                    );
                                                })
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3">
                                {selectedHotel.rates.map((rate) => (
                                    <div key={rate.bookHash} className="flex items-center justify-between border border-gray-100 rounded-xl p-4 hover:border-blue-200 transition">
                                        <div>
                                            <p className="font-semibold text-gray-900">{rate.roomName}</p>
                                            <p className="text-sm text-gray-400">{rate.boardType}</p>
                                            <span className={`inline-flex items-center gap-1 text-xs font-medium mt-1.5 px-2 py-0.5 rounded-full ${rate.refundable ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {rate.refundable ? <Check size={11} /> : <X size={11} />}
                                                {rate.refundable ? 'Annulation gratuite' : 'Non remboursable'}
                      </span>
                                            {rate.cancellationDeadline && (
                                                <p className="text-xs text-gray-400 mt-1">avant le {rate.cancellationDeadline}</p>
                                            )}
                                        </div>
                                        <div className="text-right flex-shrink-0 ml-4">
                                            <p className="text-xl font-bold text-gray-900">{rate.price} {rate.currency}</p>
                                            <button onClick={() => handleSelectRate(rate)} disabled={loading}
                                                    className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-60">
                                                Choisir
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })()}

                {/* ── Step 4: Guests + summary ────────────────────────────────────── */}
                {stepIndex === 3 && selectedRate && selectedHotel && (
                    <div>
                        <button onClick={() => setStepIndex(2)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition">
                            <ArrowLeft size={16} /> Retour aux tarifs
                        </button>

                        {priceChanged && (
                            <div className="bg-amber-50 text-amber-800 border border-amber-200 rounded-xl p-3 text-sm mb-5">
                                ⚠️ Le prix a été mis à jour : {selectedRate.price} {selectedRate.currency}
                            </div>
                        )}

                        <div className="grid md:grid-cols-5 gap-6">
                            <div className="md:col-span-3">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Voyageur principal</h3>
                                <p className="text-xs text-gray-400 mb-3">💡 En sandbox, utilisez "Ratehawk" comme nom de famille pour les tests.</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <input placeholder="Prénom" value={guestName.firstName}
                                           onChange={(e) => setGuestName({ ...guestName, firstName: e.target.value })}
                                           className="px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition" />
                                    <input placeholder="Nom" value={guestName.lastName}
                                           onChange={(e) => setGuestName({ ...guestName, lastName: e.target.value })}
                                           className="px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition" />
                                </div>
                                {!user && <p className="text-sm text-red-600 mt-3">Connectez-vous pour finaliser la réservation.</p>}
                            </div>

                            <div className="md:col-span-2">
                                <div className="bg-gray-50 rounded-xl p-4 sticky top-4">
                                    <h4 className="font-semibold text-gray-900 mb-3">Résumé</h4>
                                    <p className="text-sm font-medium text-gray-800">{selectedHotel.name}</p>
                                    <p className="text-xs text-gray-400 mb-3">{selectedRate.roomName} · {selectedRate.boardType}</p>
                                    <div className="text-sm text-gray-500 space-y-1 mb-3">
                                        <div className="flex justify-between"><span>Check-in</span><span>{checkin}</span></div>
                                        <div className="flex justify-between"><span>Check-out</span><span>{checkout}</span></div>
                                        <div className="flex justify-between"><span>{nights} nuit(s)</span><span>{rooms.length} chambre(s)</span></div>
                                    </div>
                                    <div className="border-t border-gray-200 pt-3 flex justify-between font-bold text-gray-900">
                                        <span>Total</span>
                                        <span>{selectedRate.price} {selectedRate.currency}</span>
                                    </div>
                                    <button
                                        onClick={handleConfirmBooking}
                                        disabled={loading || !guestName.firstName || !guestName.lastName || !user}
                                        className="w-full mt-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
                                    >
                                        {loading ? 'Confirmation…' : 'Confirmer la réservation'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}