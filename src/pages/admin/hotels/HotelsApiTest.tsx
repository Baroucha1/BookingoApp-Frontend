// src/pages/admin/hotels/HotelsApiTest.tsx
import { useEffect, useState } from 'react';
import { Loader2, Search, Star, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
    getTravellandaCountries, getTravellandaCities, getTravellandaHotels, getTravellandaHotelDetails,
    type TravellandaCountry, type TravellandaCity, type TravellandaHotel, type TravellandaHotelDetails,
} from '@/service/admin/hotel/staticdataTravellenda.ts';
import {
    searchHotels, getHotelPolicies, type SearchHotelResult, type SearchOption, type HotelPolicies,
    getHotelDetailsBatch, type BookingRoomInput, type BookHotelResult, type PendingVerification,
    type BookingGuestAdult, type BookingGuestChild,
} from '@/service/hotels/hotels.service';

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
    return (
        <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="pl-8 h-8 text-xs"
            />
        </div>
    );
}

const HotelsApiTest = () => {
    // Countries
    const [countries, setCountries] = useState<TravellandaCountry[]>([]);
    const [countriesLoading, setCountriesLoading] = useState(true);
    const [countryFilter, setCountryFilter] = useState('');
    const [selectedCountry, setSelectedCountry] = useState<TravellandaCountry | null>(null);

    // Cities
    const [cities, setCities] = useState<TravellandaCity[]>([]);
    const [citiesLoading, setCitiesLoading] = useState(false);
    const [cityFilter, setCityFilter] = useState('');
    const [selectedCity, setSelectedCity] = useState<TravellandaCity | null>(null);

    // Hotels
    const [hotels, setHotels] = useState<TravellandaHotel[]>([]);
    const [hotelsLoading, setHotelsLoading] = useState(false);
    const [hotelFilter, setHotelFilter] = useState('');

    // Hotel details dialog
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [details, setDetails] = useState<TravellandaHotelDetails | null>(null);
    const [checkInDate, setCheckInDate] = useState<Date | undefined>();
    const [checkOutDate, setCheckOutDate] = useState<Date | undefined>();
    const [checkInOpen, setCheckInOpen] = useState(false);
    const [checkOutOpen, setCheckOutOpen] = useState(false);

    const toApiDate = (d?: Date) => (d ? format(d, 'yyyy-MM-dd') : '');

    const [searchForm, setSearchForm] = useState({
        nationality: 'DZ', numAdults: 2,
    });
    const [searchHotelIds, setSearchHotelIds] = useState<number[]>([]);
    const [searching, setSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<SearchHotelResult[]>([]);
    const [searchErrors, setSearchErrors] = useState<{ code: string; message: string }[]>([]);
    const [policiesOpen, setPoliciesOpen] = useState(false);
    const [policiesLoading, setPoliciesLoading] = useState(false);
    const [policies, setPolicies] = useState<HotelPolicies | null>(null);
    const [hotelDetailsMap, setHotelDetailsMap] = useState<Record<number, TravellandaHotelDetails>>({});
    const [selectedResultHotel, setSelectedResultHotel] = useState<SearchHotelResult | null>(null);
    const [resultDetailsOpen, setResultDetailsOpen] = useState(false);
    const [policyError, setPolicyError] = useState<{ optionId: string; code: string; message: string } | null>(null);

    const [carouselIndex, setCarouselIndex] = useState(0);

    const [bookingOpen, setBookingOpen] = useState(false);
    const [bookingSaving, setBookingSaving] = useState(false);
    const [bookingHotel, setBookingHotel] = useState<SearchHotelResult | null>(null);
    const [bookingOption, setBookingOption] = useState<SearchOption | null>(null);
    const [bookingReference, setBookingReference] = useState('');
    const [guestRooms, setGuestRooms] = useState<BookingRoomInput[]>([]);
    const [bookingResult, setBookingResult] = useState<BookHotelResult | PendingVerification | null>(null);



    const handleCheckIn = (date: Date | undefined) => {
        setCheckInDate(date);
        setCheckInOpen(false);
        // If check-out is now before (or same as) the new check-in, clear it —
        // forces the user to pick a valid return date instead of silently
        // sending an invalid range.
        if (date && checkOutDate && checkOutDate <= date) {
            setCheckOutDate(undefined);
        }
    };

    const handleCheckOut = (date: Date | undefined) => {
        setCheckOutDate(date);
        setCheckOutOpen(false);
    };

    useEffect(() => {
        (async () => {
            try {
                setCountries(await getTravellandaCountries());
            } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Échec du chargement des pays');
            } finally {
                setCountriesLoading(false);
            }
        })();
    }, []);

    const selectCountry = async (country: TravellandaCountry) => {
        setSelectedCountry(country);
        setSelectedCity(null);
        setHotels([]);
        setCities([]);
        setCitiesLoading(true);
        try {
            setCities(await getTravellandaCities(country.code));
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Échec du chargement des villes');
        } finally {
            setCitiesLoading(false);
        }
    };

    const selectCity = async (city: TravellandaCity) => {
        setSelectedCity(city);
        setHotelsLoading(true);
        try {
            setHotels(await getTravellandaHotels(city.cityId));
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Échec du chargement des hôtels');
        } finally {
            setHotelsLoading(false);
        }
    };

    const openDetails = async (hotel: TravellandaHotel) => {
        setDetailsOpen(true);
        setDetailsLoading(true);
        setDetails(null);
        try {
            setDetails(await getTravellandaHotelDetails(hotel.hotelId));
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Échec du chargement des détails');
            setDetailsOpen(false);
        } finally {
            setDetailsLoading(false);
        }
    };

    // Optional hotel narrowing — clicking a browsed hotel toggles it into the
// search's hotelIds instead of always searching the whole city.
    const toggleSearchHotel = (hotelId: number) => {
        setSearchHotelIds((prev) =>
            prev.includes(hotelId) ? prev.filter((id) => id !== hotelId) : [...prev, hotelId]
        );
    };

    const runSearch = async () => {
        if (!selectedCity && searchHotelIds.length === 0) {
            toast.error('Sélectionnez une ville ou au moins un hôtel');
            return;
        }

        setSearching(true);
        setSearchResults([]);
        setSearchErrors([]);
        try {
            const result = await searchHotels({
                cityIds: searchHotelIds.length === 0 && selectedCity ? [selectedCity.cityId] : undefined,
                hotelIds: searchHotelIds.length > 0 ? searchHotelIds : undefined,
                checkInDate: toApiDate(checkInDate),
                checkOutDate: toApiDate(checkOutDate),
                rooms: [{ numAdults: searchForm.numAdults }],
                nationality: searchForm.nationality,
                availableOnly: true,
            });
            setSearchResults(result.hotels);
            setSearchErrors(result.errors);
            if (result.hotels.length === 0) toast.info('Aucun résultat');

            // Batch-fetch static details (images, description) for card display —
            // separate from live search data, just for visuals.
            const ids = result.hotels.map((h) => parseInt(h.hotelId, 10)).filter(Boolean);
            if (ids.length > 0) {
                const detailsList = await getHotelDetailsBatch(ids);
                const map: Record<number, TravellandaHotelDetails> = {};
                detailsList.forEach((d) => {
                    map[d.hotelId] = d;
                });
                setHotelDetailsMap(map);
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Échec de la recherche');
        } finally {
            setSearching(false);
        }
    };

    const openResultDetails = (hotel: SearchHotelResult) => {
        setSelectedResultHotel(hotel);
        setCarouselIndex(0);
        setResultDetailsOpen(true);
    };

    const openPolicies = async (option: SearchOption) => {
        setPoliciesOpen(true);
        setPoliciesLoading(true);
        setPolicies(null);
        setPolicyError(null);
        try {
            setPolicies(await getHotelPolicies(option.optionId));
        } catch (err) {
            // ...unchanged...
        } finally {
            setPoliciesLoading(false);
        }
    };

    const retryPolicies = (option: SearchOption) => openPolicies(option);

    const filteredCountries = countries.filter((c) => c.name.toLowerCase().includes(countryFilter.toLowerCase()));
    const filteredCities = cities.filter((c) => c.cityName.toLowerCase().includes(cityFilter.toLowerCase()));
    const filteredHotels = hotels.filter((h) => h.hotelName.toLowerCase().includes(hotelFilter.toLowerCase()));
    const openBooking = (hotel: SearchHotelResult, option: SearchOption) => {
        setBookingHotel(hotel);
        setBookingOption(option);
        setBookingResult(null);
        setBookingReference(`BOOK-${Date.now()}`);
        // Build empty guest slots matching exactly the room/adult/child counts
        // returned by the search option — this is what Travellanda expects back.
        setGuestRooms(
            option.rooms.map((r) => ({
                roomId: r.roomId,
                adults: Array.from({ length: r.numAdults }, () => ({ title: 'Mr' as const, firstName: '', lastName: '' })),
                children: r.numChildren > 0 ? Array.from({ length: r.numChildren }, () => ({ firstName: '', lastName: '' })) : [],
            }))
        );
        setBookingOpen(true);
    };

    const updateAdult = (roomIdx: number, adultIdx: number, field: keyof BookingGuestAdult, value: string) => {
        setGuestRooms((prev) => {
            const next = [...prev];
            const adults = [...next[roomIdx].adults];
            adults[adultIdx] = { ...adults[adultIdx], [field]: value };
            next[roomIdx] = { ...next[roomIdx], adults };
            return next;
        });
    };

    const updateChild = (roomIdx: number, childIdx: number, field: keyof BookingGuestChild, value: string) => {
        setGuestRooms((prev) => {
            const next = [...prev];
            const children = [...(next[roomIdx].children ?? [])];
            children[childIdx] = { ...children[childIdx], [field]: value };
            next[roomIdx] = { ...next[roomIdx], children };
            return next;
        });
    };

    const isGuestFormValid = guestRooms.every((r) =>
        r.adults.every((a) => a.firstName.trim() && a.lastName.trim()) &&
        (r.children ?? []).every((c) => c.firstName.trim() && c.lastName.trim())
    );

    const submitBooking = async () => {
        if (!bookingOption || !isGuestFormValid) {
            toast.error('Veuillez remplir tous les noms des voyageurs');
            return;
        }
        setBookingSaving(true);
        try {
            try {
                await getHotelPolicies(bookingOption.optionId);
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Erreur inconnue';
                toast.error(`Impossible de confirmer les conditions: ${message}`);
                setBookingSaving(false);
                return;
            }
            toast.success('Réservation créée');
            
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Échec de la réservation');
        } finally {
            setBookingSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold text-slate-800">Travellanda — Test API</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Countries */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Pays</CardTitle>
                        <SearchBox value={countryFilter} onChange={setCountryFilter} placeholder="Rechercher un pays..." />
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="max-h-[420px] overflow-y-auto">
                            {countriesLoading && (
                                <div className="p-6 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" /> Chargement...
                                </div>
                            )}
                            {!countriesLoading && filteredCountries.map((c) => (
                                <button
                                    key={c.code}
                                    onClick={() => selectCountry(c)}
                                    className={`w-full text-left px-4 py-2 text-sm border-b border-slate-50 hover:bg-[#DFECFF]/40 transition-colors ${
                                        selectedCountry?.code === c.code ? 'bg-[#1775FF] text-white hover:bg-[#1775FF]' : ''
                                    }`}
                                >
                                    {c.name} <span className="text-xs opacity-60 font-mono">({c.code})</span>
                                </button>
                            ))}
                            {!countriesLoading && filteredCountries.length === 0 && (
                                <div className="p-6 text-center text-slate-400 text-sm">Aucun résultat</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Cities */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">
                            Villes {selectedCountry && <span className="text-slate-400 font-normal">— {selectedCountry.name}</span>}
                        </CardTitle>
                        <SearchBox value={cityFilter} onChange={setCityFilter} placeholder="Rechercher une ville..." />
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="max-h-[420px] overflow-y-auto">
                            {!selectedCountry && (
                                <div className="p-6 text-center text-slate-400 text-sm">Sélectionnez un pays</div>
                            )}
                            {selectedCountry && citiesLoading && (
                                <div className="p-6 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" /> Chargement...
                                </div>
                            )}
                            {selectedCountry && !citiesLoading && filteredCities.map((c) => (
                                <button
                                    key={c.cityId}
                                    onClick={() => selectCity(c)}
                                    className={`w-full text-left px-4 py-2 text-sm border-b border-slate-50 hover:bg-[#DFECFF]/40 transition-colors ${
                                        selectedCity?.cityId === c.cityId ? 'bg-[#1775FF] text-white hover:bg-[#1775FF]' : ''
                                    }`}
                                >
                                    {c.cityName}
                                    {c.stateCode && <span className="text-xs opacity-60"> ({c.stateCode})</span>}
                                </button>
                            ))}
                            {selectedCountry && !citiesLoading && filteredCities.length === 0 && (
                                <div className="p-6 text-center text-slate-400 text-sm">Aucune ville trouvée</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Hotels */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">
                            Hôtels {selectedCity && <span className="text-slate-400 font-normal">— {selectedCity.cityName}</span>}
                        </CardTitle>
                        <SearchBox value={hotelFilter} onChange={setHotelFilter} placeholder="Rechercher un hôtel..." />
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="max-h-[420px] overflow-y-auto">
                            {!selectedCity && (
                                <div className="p-6 text-center text-slate-400 text-sm">Sélectionnez une ville</div>
                            )}
                            {selectedCity && hotelsLoading && (
                                <div className="p-6 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" /> Chargement...
                                </div>
                            )}
                            {selectedCity && !hotelsLoading && filteredHotels.map((h) => (
                                <div
                                    key={h.hotelId}
                                    className="flex items-center justify-between gap-2 px-4 py-2 text-sm border-b border-slate-50 hover:bg-[#DFECFF]/30 transition-colors"
                                >
                                    <span className="truncate">{h.hotelName}</span>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <Button
                                            size="sm"
                                            variant={searchHotelIds.includes(h.hotelId) ? 'default' : 'outline'}
                                            className="h-7 text-xs"
                                            onClick={() => toggleSearchHotel(h.hotelId)}
                                        >
                                            {searchHotelIds.includes(h.hotelId) ? '✓' : '+ Rech.'}
                                        </Button>
                                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openDetails(h)}>
                                            Détails
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {selectedCity && !hotelsLoading && filteredHotels.length === 0 && (
                                <div className="p-6 text-center text-slate-400 text-sm">Aucun hôtel trouvé</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
            {/* Live search — separate from static browsing above */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">
                        Recherche Hôtels (Live)
                        {selectedCity && <span className="text-slate-400 font-normal"> — {selectedCity.cityName}</span>}
                        {searchHotelIds.length > 0 && (
                            <span className="text-slate-400 font-normal"> · {searchHotelIds.length} hôtel(s) sélectionné(s)</span>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div>
                            <label className="text-xs text-slate-500">Check-in</label>
                            <Popover open={checkInOpen} onOpenChange={setCheckInOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start text-left font-normal h-9">
                                        <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                                        {checkInDate ? format(checkInDate, 'd MMM yyyy', { locale: fr }) : <span className="text-slate-400">Choisir</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={checkInDate}
                                        onSelect={handleCheckIn}
                                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                        locale={fr}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div>
                            <label className="text-xs text-slate-500">Check-out</label>
                            <Popover open={checkOutOpen} onOpenChange={setCheckOutOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start text-left font-normal h-9" disabled={!checkInDate}>
                                        <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                                        {checkOutDate ? format(checkOutDate, 'd MMM yyyy', { locale: fr }) : <span className="text-slate-400">{checkInDate ? 'Choisir' : 'Check-in d\'abord'}</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={checkOutDate}
                                        onSelect={handleCheckOut}
                                        disabled={(date) => !checkInDate || date <= checkInDate}
                                        defaultMonth={checkInDate}
                                        locale={fr}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500">Adultes</label>
                            <Input type="number" min={1} max={4} value={searchForm.numAdults} onChange={(e) => setSearchForm((f) => ({ ...f, numAdults: Number(e.target.value) }))} />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500">Nationalité</label>
                            <Input value={searchForm.nationality} maxLength={2} onChange={(e) => setSearchForm((f) => ({ ...f, nationality: e.target.value.toUpperCase() }))} />
                        </div>

                    </div>

                    <Button onClick={runSearch} disabled={searching} className="bg-[#1775FF] hover:bg-[#1775FF]/90 text-white">
                        {searching ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Recherche...</> : 'Rechercher'}
                    </Button>

                    {searchErrors.length > 0 && (
                        <div className="text-xs text-red-500 space-y-0.5">
                            {searchErrors.map((e, i) => <div key={i}>{e.code}: {e.message}</div>)}                        </div>
                    )}

                    <div className="space-y-3">
                        {searchResults.length > 0 && (
                            (() => {
                                const markers = searchResults
                                    .map((h) => {
                                        const d = hotelDetailsMap[parseInt(h.hotelId, 10)];
                                        return d?.latitude && d?.longitude ? { hotel: h, lat: d.latitude, lng: d.longitude } : null;
                                    })
                                    .filter((m): m is { hotel: SearchHotelResult; lat: number; lng: number } => m !== null);

                                if (markers.length === 0) return null;

                                // Simple multi-marker embed via Google Maps "q=" search doesn't support
                                // multiple pins — use a centered view on the average coordinate instead,
                                // with markers listed as a fallback since the free embed can't plot many pins.
                                const avgLat = markers.reduce((s, m) => s + m.lat, 0) / markers.length;
                                const avgLng = markers.reduce((s, m) => s + m.lng, 0) / markers.length;

                                return (
                                    <div className="rounded-lg overflow-hidden border border-slate-200 mb-4">
                                        <iframe
                                            title="results-map"
                                            width="100%"
                                            height="260"
                                            style={{ border: 0 }}
                                            loading="lazy"
                                            src={`https://www.google.com/maps?q=${avgLat},${avgLng}&z=13&output=embed`}
                                        />
                                    </div>
                                );
                            })()
                        )}
                        {searchResults.map((h) => {
                            const staticDetails = hotelDetailsMap[parseInt(h.hotelId, 10)];
                            const cheapest = h.options.reduce((min, o) => Math.min(min, o.totalPrice), Infinity);
                            const cheapestOption = h.options.find((o) => o.totalPrice === cheapest);

                            return (
                                <div
                                    key={h.hotelId}
                                    className="flex gap-4 border border-slate-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow bg-white p-3"
                                >
                                    <button
                                        type="button"
                                        onClick={() => openResultDetails(h)}
                                        className="shrink-0"
                                    >
                                        {staticDetails?.images?.[0] ? (
                                            <img
                                                src={staticDetails.images[0]}
                                                alt=""
                                                className="w-40 h-32 object-cover rounded-lg"
                                            />
                                        ) : (
                                            <div className="w-40 h-32 bg-slate-100 rounded-lg flex items-center justify-center text-slate-300 text-xs">
                                                Pas d'image
                                            </div>
                                        )}
                                    </button>

                                    <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                        <div>
                                            <button
                                                type="button"
                                                onClick={() => openResultDetails(h)}
                                                className="font-semibold text-sm text-[#1775FF] hover:underline text-left"
                                            >
                                                {h.hotelName}
                                            </button>
                                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                                {h.starRating && <span className="text-amber-500">★ {h.starRating}</span>}
                                            </div>
                                            {staticDetails?.address && (
                                                <div className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                                                    <MapPin className="w-3 h-3 shrink-0" /> {staticDetails.address}
                                                </div>
                                            )}
                                            <div className="text-xs text-slate-400 mt-1">{h.options.length} option(s)</div>
                                        </div>
                                    </div>

                                    <div className="shrink-0 flex flex-col items-end justify-between py-1 text-right">
                                        <div>
                                            <div className="text-xs text-slate-400">À partir de</div>
                                            <div className="font-bold text-lg text-[#1775FF]">{cheapest} {h.options[0]?.currency}</div>
                                        </div>
                                        <div className="flex flex-col gap-1.5 w-32">
                                            <Button size="sm" variant="outline" className="text-xs" onClick={() => openResultDetails(h)}>
                                                Détails
                                            </Button>

                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Policies dialog */}
            <Dialog open={policiesOpen} onOpenChange={setPoliciesOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>Conditions d'annulation</DialogTitle></DialogHeader>

                    {policiesLoading && (
                        <div className="py-8 text-center text-slate-400 flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" /> Chargement...
                        </div>
                    )}

                    {!policiesLoading && policyError && (
                        <div className="space-y-3">
                            <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3">
                                {policyError.code === '123' && "Le prix a changé depuis la recherche. Relancez pour obtenir le nouveau prix, ou choisissez une autre option."}
                                {policyError.code === '118' && "Cette option n'est plus disponible. Veuillez choisir une autre option."}
                                {policyError.code === 'OTHER' && policyError.message}
                            </div>
                            {policyError.code === '123' && (
                                <Button
                                    size="sm"
                                    onClick={() => {
                                        const opt = selectedResultHotel?.options.find((o) => o.optionId === policyError.optionId);
                                        if (opt) retryPolicies(opt);
                                    }}
                                >
                                    Réessayer
                                </Button>
                            )}
                        </div>
                    )}

                    {!policiesLoading && !policyError && policies && (
                        <div className="space-y-3 text-sm">
                            <div className="font-semibold text-base">{policies.price} {policies.policies.currency}</div>
                            <div className="text-xs text-slate-500">
                                Date limite d'annulation gratuite : {policies.policies.cancellationDeadline}
                            </div>
                            <div className="space-y-1">
                                {policies.policies.policies.map((p, i) => (
                                    <div key={i} className="text-xs bg-slate-50 rounded-md px-2 py-1">
                                        À partir du {p.from} : {p.type} — {p.value}
                                    </div>
                                ))}
                            </div>
                            {policies.policies.restrictions.length > 0 && (
                                <div className="text-xs text-slate-500">
                                    Restrictions: {policies.policies.restrictions.join(', ')}
                                </div>
                            )}
                            {policies.policies.alerts.length > 0 && (
                                <div className="text-xs text-amber-600 bg-amber-50 rounded-md p-2 space-y-1">
                                    {policies.policies.alerts.map((a, i) => <div key={i}>{a}</div>)}
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Hotel details dialog — from search results, includes rooms/pricing */}
            <Dialog open={resultDetailsOpen} onOpenChange={setResultDetailsOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{selectedResultHotel?.hotelName}</DialogTitle>
                    </DialogHeader>

                    {selectedResultHotel && (() => {
                        const staticDetails = hotelDetailsMap[parseInt(selectedResultHotel.hotelId, 10)];
                        return (
                            <div className="space-y-4">
                                {staticDetails?.images && staticDetails.images.length > 0 && (
                                    <div className="relative rounded-lg overflow-hidden bg-slate-100">
                                        <img
                                            src={staticDetails.images[carouselIndex]}
                                            alt=""
                                            className="w-full h-72 object-cover"
                                        />

                                        {staticDetails.images.length > 1 && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => setCarouselIndex((i) => (i === 0 ? staticDetails.images.length - 1 : i - 1))}
                                                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                                                >
                                                    ‹
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setCarouselIndex((i) => (i === staticDetails.images.length - 1 ? 0 : i + 1))}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                                                >
                                                    ›
                                                </button>
                                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                                                    {staticDetails.images.map((_, i) => (
                                                        <button
                                                            type="button"
                                                            key={i}
                                                            onClick={() => setCarouselIndex(i)}
                                                            className={`w-1.5 h-1.5 rounded-full transition-colors ${i === carouselIndex ? 'bg-white' : 'bg-white/40'}`}
                                                        />
                                                    ))}
                                                </div>
                                                <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
                                                    {carouselIndex + 1} / {staticDetails.images.length}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}

                                {staticDetails?.latitude && staticDetails?.longitude && (
                                    <div className="rounded-lg overflow-hidden border border-slate-200">
                                        <iframe
                                            title="hotel-location"
                                            width="100%"
                                            height="220"
                                            style={{ border: 0 }}
                                            loading="lazy"
                                            src={`https://www.google.com/maps?q=${staticDetails.latitude},${staticDetails.longitude}&z=15&output=embed`}
                                        />
                                    </div>
                                )}

                                {staticDetails && (
                                    <div className="flex items-center gap-4 text-sm text-slate-600">
                                        {staticDetails.starRating && (
                                            <span className="flex items-center gap-1">
                                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> {staticDetails.starRating}
                                </span>
                                        )}
                                        <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" /> {staticDetails.address}
                            </span>
                                    </div>
                                )}

                                {staticDetails?.description && (
                                    <p className="text-sm text-slate-600 leading-relaxed">{staticDetails.description}</p>
                                )}

                                <div className="border-t border-slate-100 pt-3 space-y-3">
                                    <div className="text-sm font-semibold">Options disponibles</div>
                                    {selectedResultHotel.options.map((o) => (
                                        <div key={o.optionId} className="border border-slate-100 rounded-xl p-3 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-semibold text-sm">
                                                        {o.boardType} — {o.totalPrice} {o.currency}
                                                    </div>
                                                    {o.onRequest && <div className="text-xs text-amber-600">Sur demande</div>}
                                                </div>
                                                <Button size="sm" variant="outline" onClick={() => openPolicies(o)}>Conditions</Button>
                                                <Button
                                                    size="sm"
                                                    className="bg-[#1775FF] hover:bg-[#1775FF]/90 text-white"
                                                    onClick={() => selectedResultHotel && openBooking(selectedResultHotel, o)}
                                                >
                                                    Réserver
                                                </Button>
                                            </div>
                                            <div className="space-y-1">
                                                {o.rooms.map((r, i) => (
                                                    <div key={i} className="text-xs bg-slate-50 rounded-md px-2 py-1.5 flex justify-between">
                                                        <span>{r.roomName} — {r.numAdults} adulte(s){r.numChildren > 0 && `, ${r.numChildren} enfant(s)`}</span>
                                                        <span className="font-mono">{r.price} {o.currency}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })()}
                </DialogContent>
            </Dialog>

            {/* Static hotel details dialog — from the browse-by-city flow, no search context */}
            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{details?.name ?? 'Détails de l\'hôtel'}</DialogTitle>
                    </DialogHeader>

                    {detailsLoading && (
                        <div className="py-10 text-center text-slate-400 flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" /> Chargement...
                        </div>
                    )}

                    {!detailsLoading && details && (
                        <div className="space-y-4">
                            {details.latitude && details.longitude && (
                                <div className="rounded-lg overflow-hidden border border-slate-200">
                                    <iframe
                                        title="hotel-location"
                                        width="100%"
                                        height="220"
                                        style={{ border: 0 }}
                                        loading="lazy"
                                        src={`https://www.google.com/maps?q=${details.latitude},${details.longitude}&z=15&output=embed`}
                                    />
                                </div>
                            )}

                            {details.images.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {details.images.slice(0, 8).map((url, i) => (
                                        <img key={i} src={url} alt="" className="h-28 w-full object-cover rounded-lg" />
                                    ))}
                                </div>
                            )}

                            <div className="flex items-center gap-4 text-sm text-slate-600">
                                {details.starRating && (
                                    <span className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> {details.starRating}
                        </span>
                                )}
                                <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" /> {details.address}
                    </span>
                            </div>

                            <p className="text-sm text-slate-600 leading-relaxed">{details.description}</p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
            <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Réservation — {bookingHotel?.hotelName}</DialogTitle>
                    </DialogHeader>

                    {!bookingResult && bookingOption && (
                        <div className="space-y-4">
                            <div className="text-sm bg-slate-50 rounded-lg p-3">
                                {bookingOption.boardType} — <span className="font-bold">{bookingOption.totalPrice} {bookingOption.currency}</span>
                            </div>



                            {guestRooms.map((room, ri) => (
                                <div key={room.roomId} className="border border-slate-100 rounded-xl p-3 space-y-3">
                                    <div className="text-sm font-semibold">
                                        Chambre {ri + 1} — {bookingOption.rooms[ri]?.roomName}
                                    </div>

                                    {room.adults.map((a, ai) => (
                                        <div key={ai} className="grid grid-cols-4 gap-2">
                                            <select
                                                value={a.title}
                                                onChange={(e) => updateAdult(ri, ai, 'title', e.target.value)}
                                                className="border border-slate-200 rounded-md text-sm px-2"
                                            >
                                                <option value="Mr">Mr</option>
                                                <option value="Mrs">Mrs</option>
                                                <option value="Miss">Miss</option>
                                            </select>
                                            <Input
                                                placeholder="Prénom"
                                                value={a.firstName}
                                                onChange={(e) => updateAdult(ri, ai, 'firstName', e.target.value.slice(0, 50))}
                                                className="col-span-1"
                                            />
                                            <Input
                                                placeholder="Nom"
                                                value={a.lastName}
                                                onChange={(e) => updateAdult(ri, ai, 'lastName', e.target.value.slice(0, 50))}
                                                className="col-span-2"
                                            />
                                        </div>
                                    ))}

                                    {(room.children ?? []).map((c, ci) => (
                                        <div key={ci} className="grid grid-cols-4 gap-2">
                                            <span className="text-xs text-slate-400 self-center">Enfant</span>
                                            <Input
                                                placeholder="Prénom"
                                                value={c.firstName}
                                                onChange={(e) => updateChild(ri, ci, 'firstName', e.target.value.slice(0, 50))}
                                            />
                                            <Input
                                                placeholder="Nom"
                                                value={c.lastName}
                                                onChange={(e) => updateChild(ri, ci, 'lastName', e.target.value.slice(0, 50))}
                                                className="col-span-2"
                                            />
                                        </div>
                                    ))}
                                </div>
                            ))}

                            <Button
                                onClick={submitBooking}
                                disabled={bookingSaving || !isGuestFormValid}
                                className="w-full bg-[#1775FF] hover:bg-[#1775FF]/90 text-white"
                            >
                                {bookingSaving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Réservation...</> : 'Confirmer la réservation'}
                            </Button>
                        </div>
                    )}

                    {bookingResult && 'message' in bookingResult && (
                        <div className="text-sm text-amber-600 bg-amber-50 rounded-lg p-4 space-y-2">
                            <div className="font-semibold">Statut inconnu — vérification requise</div>
                            <div>{bookingResult.message}</div>
                            <div className="text-xs font-mono">Référence: {bookingResult.yourReference}</div>
                        </div>
                    )}

                    {bookingResult && 'bookingReference' in bookingResult && (
                        <div className="text-sm space-y-2">
                            <div className="text-emerald-600 font-semibold">Réservation {bookingResult.status}</div>
                            <div className="bg-slate-50 rounded-lg p-3 space-y-1">
                                <div>Référence: <span className="font-mono">{bookingResult.bookingReference}</span></div>
                                <div>Votre référence: <span className="font-mono">{bookingResult.yourReference}</span></div>
                                <div className="font-bold">{bookingResult.totalPrice} {bookingResult.currency}</div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default HotelsApiTest;