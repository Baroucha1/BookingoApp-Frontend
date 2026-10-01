// src/components/hotels/HotelSearchForm.tsx

import { MapPin, Calendar as CalendarIcon, Users, Search, X, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

import { ar, enUS, fr } from 'date-fns/locale';
import { countryCodeToFlagEmoji } from '@/lib/countryFlag';
import {
    getCountries, getCities, getHotels,
    type TravellandaCountry, type TravellandaCity, type TravellandaHotel,
} from '@/service/hotels/hotelStaticData.public.service';
import {useNavigate, useSearchParams} from "react-router-dom";
import DestinationPicker from "@/components/hotels/DestinationPicker.tsx";
import { useLanguage } from '@/i18n/LanguageContext';
import { useEffect, useMemo, useRef, useState } from 'react';
import { format, parseISO, isValid, startOfToday } from 'date-fns';
import {decodeHotelSearchParams, encodeHotelSearchParams} from "@/lib/hotelSearchParams.ts";

export interface RoomInput {
    numAdults: number;
    childAges: number[];
}


export interface HotelSearchParams {
    countryCode: string;
    cityId: number;
    cityName: string;
    hotelIds: number[];
    checkInDate: string;
    checkOutDate: string;
    rooms: RoomInput[];
    nationality: string;
    availableOnly: boolean;
}

interface Props {
    onSubmit?: (params: HotelSearchParams) => void;
}

const toApiDate = (d?: Date) => (d ? format(d, 'yyyy-MM-dd') : '');

const fromApiDate = (s?: string): Date | undefined => {
    if (!s) return undefined;
    const d = parseISO(s);
    return isValid(d) ? d : undefined;
};

export default function HotelSearchForm({ onSubmit }: Props) {
    const { t, language } = useLanguage();
    const dateLocale = language === 'ar' ? ar : language === 'en' ? enUS : fr;

    // Read once on mount — the form must not reset when the URL changes later
    const [searchParams] = useSearchParams();
    const initial = useMemo(() => decodeHotelSearchParams(searchParams), []); // eslint-disable-line react-hooks/exhaustive-deps


    // Destination (country → city)
    const [destinationOpen, setDestinationOpen] = useState(false);
    const [countries, setCountries] = useState<TravellandaCountry[]>([]);
    const [countryFilter, setCountryFilter] = useState('');
    const [selectedCountry, setSelectedCountry] = useState<TravellandaCountry | null>(null);
    const [cities, setCities] = useState<TravellandaCity[]>([]);
    const [citiesLoading, setCitiesLoading] = useState(false);
    const [cityFilter, setCityFilter] = useState('');
    const [selectedCity, setSelectedCity] = useState<TravellandaCity | null>(null);

    // Hotels (optional)
    const [hotelsOpen, setHotelsOpen] = useState(false);
    const [hotels, setHotels] = useState<TravellandaHotel[]>([]);
    const [hotelsLoading, setHotelsLoading] = useState(false);
    const [hotelFilter, setHotelFilter] = useState('');
    const [selectedHotelIds, setSelectedHotelIds] = useState<number[]>(() => initial?.hotelIds ?? []);

    const [checkInDate, setCheckInDate] = useState<Date | undefined>(() => {
        const d = fromApiDate(initial?.checkInDate);
        return d && d >= startOfToday() ? d : undefined;
    });

    const [checkOutDate, setCheckOutDate] = useState<Date | undefined>(() => {
        const inD = fromApiDate(initial?.checkInDate);
        const outD = fromApiDate(initial?.checkOutDate);
        return inD && outD && inD >= startOfToday() && outD > inD ? outD : undefined;
    });
    const [checkInOpen, setCheckInOpen] = useState(false);
    const [checkOutOpen, setCheckOutOpen] = useState(false);

    // Rooms / travellers
    const [travellersOpen, setTravellersOpen] = useState(false);
    const [rooms, setRooms] = useState<RoomInput[]>(() =>
        initial?.rooms.length ? initial.rooms : [{ numAdults: 2, childAges: [] }]);

    const restoredRef = useRef(false);

    useEffect(() => {
        if (restoredRef.current || !initial || countries.length === 0) return;
        restoredRef.current = true;

        const country = countries.find((c) => c.code === initial.countryCode);
        if (!country) return;

        (async () => {
            setSelectedCountry(country);
            setCitiesLoading(true);
            try {
                const cityList = await getCities(country.code);
                setCities(cityList);
                const city = cityList.find((c) => c.cityId === initial.cityId);
                if (!city) return;
                setSelectedCity(city);

                // Not calling selectCity(): it would clear the restored selectedHotelIds
                setHotelsLoading(true);
                try {
                    setHotels(await getHotels(city.cityId));
                } finally {
                    setHotelsLoading(false);
                }
            } catch {
                // Restore is best-effort: the user can still pick a destination manually
            } finally {
                setCitiesLoading(false);
            }
        })();
    }, [countries, initial]);

    const [availableOnly, setAvailableOnly] = useState(() => initial?.availableOnly ?? true);
    useEffect(() => {
        getCountries().then(setCountries).catch(() => {});
    }, []);

    const selectCountry = async (country: TravellandaCountry) => {
        setSelectedCountry(country);
        setSelectedCity(null);
        setSelectedHotelIds([]);
        setCities([]);
        setCitiesLoading(true);
        try {
            setCities(await getCities(country.code));
        } finally {
            setCitiesLoading(false);
        }
    };

    const selectCity = async (city: TravellandaCity) => {
        setSelectedCity(city);
        setSelectedHotelIds([]);
        setDestinationOpen(false);
        setHotels([]);
        setHotelsLoading(true);
        try {
            setHotels(await getHotels(city.cityId));
        } finally {
            setHotelsLoading(false);
        }
    };

    const backToCountries = () => {
        setSelectedCountry(null);
        setSelectedCity(null);
        setSelectedHotelIds([]);
        setHotels([]);
    };

    const toggleHotel = (hotelId: number) => {
        setSelectedHotelIds((prev) =>
            prev.includes(hotelId) ? prev.filter((id) => id !== hotelId) : [...prev, hotelId]
        );
    };

    const handleCheckIn = (date: Date | undefined) => {
        setCheckInDate(date);
        setCheckInOpen(false);
        if (date && checkOutDate && checkOutDate <= date) setCheckOutDate(undefined);
    };

    const handleCheckOut = (date: Date | undefined) => {
        setCheckOutDate(date);
        setCheckOutOpen(false);
    };

    const nights = checkInDate && checkOutDate
        ? Math.round((checkOutDate.getTime() - checkInDate.getTime()) / 86400000)
        : 0;

    // ── Rooms management ────────────────────────────────────────────────
    const addRoom = () => {
        if (rooms.length >= 5) return; // Travellanda max
        setRooms((prev) => [...prev, { numAdults: 2, childAges: [] }]);
    };
    const removeRoom = (idx: number) => setRooms((prev) => prev.filter((_, i) => i !== idx));
    const setRoomAdults = (idx: number, n: number) => {
        setRooms((prev) => prev.map((r, i) => (i === idx ? { ...r, numAdults: Math.min(4, Math.max(1, n)) } : r)));
    };
    const setChildCount = (idx: number, n: number) => {
        setRooms((prev) => prev.map((r, i) => {
            if (i !== idx) return r;
            const count = Math.min(3, Math.max(0, n));
            const childAges = Array.from({ length: count }, (_, ci) => r.childAges[ci] ?? 5);
            return { ...r, childAges };
        }));
    };
    const setChildAge = (roomIdx: number, childIdx: number, age: number) => {
        setRooms((prev) => prev.map((r, i) => {
            if (i !== roomIdx) return r;
            const childAges = [...r.childAges];
            childAges[childIdx] = age;
            return { ...r, childAges };
        }));
    };

    const totalAdults = rooms.reduce((s, r) => s + r.numAdults, 0);
    const totalChildren = rooms.reduce((s, r) => s + r.childAges.length, 0);

    const filteredCountries = countries.filter((c) => c.name.toLowerCase().includes(countryFilter.toLowerCase()));
    const filteredCities = cities.filter((c) => c.cityName.toLowerCase().includes(cityFilter.toLowerCase()));
    const filteredHotels = hotels.filter((h) => h.hotelName.toLowerCase().includes(hotelFilter.toLowerCase()));

    // inside the component
    const navigate = useNavigate();
    const maxBookingDate = new Date(new Date().setHours(0, 0, 0, 0));
    maxBookingDate.setDate(maxBookingDate.getDate() + 365);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCity || !checkInDate || !checkOutDate) return;

        const params: HotelSearchParams = {
            countryCode: selectedCountry?.code ?? '',
            cityId: selectedCity.cityId,
            cityName: selectedCity.cityName,
            hotelIds: selectedHotelIds,
            checkInDate: toApiDate(checkInDate),
            checkOutDate: toApiDate(checkOutDate),
            rooms,
            nationality: 'DZ',
            availableOnly,
        };

        onSubmit?.(params);
        navigate(`/hotels/results?${encodeHotelSearchParams(params).toString()}`);
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="w-full bg-white/95 backdrop-blur-md rounded-3xl rounded-tl-none border-2 border-[#1775FF] shadow-2xl p-4 md:p-6"
        >
            <div className="grid grid-cols-1 md:grid-cols-[1.4fr,1fr,1fr,1fr] gap-3">
                {/* Destination — country then city */}
                <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t('hotelDestination')}</label>
                    <DestinationPicker
                        open={destinationOpen}
                        onOpenChange={setDestinationOpen}
                        countries={countries}
                        selectedCountry={selectedCountry}
                        selectedCity={selectedCity}
                        cities={cities}
                        citiesLoading={citiesLoading}
                        onSelectCountry={selectCountry}
                        onBackToCountries={backToCountries}
                        onSelectCity={selectCity}
                    />
                </div>

                {/* Check-in */}
                <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t('hotelArrivalDate')}</label>
                    <Popover open={checkInOpen} onOpenChange={setCheckInOpen}>
                        <PopoverTrigger asChild>
                            <button
                                type="button"
                                className="w-full flex items-center gap-2 h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:border-[#0454E8] transition-colors text-left"
                            >
                                <CalendarIcon className="w-4 h-4 text-[#0454E8] shrink-0" />
                                <span className="text-sm text-slate-700">
                                    {checkInDate ? format(checkInDate, 'd MMM yyyy', { locale: dateLocale }) : <span className="text-slate-400">{t('hotelChoose')}</span>}
                                </span>
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={checkInDate}
                                onSelect={handleCheckIn}
                                disabled={(date) =>
                                    date < new Date(new Date().setHours(0, 0, 0, 0)) ||
                                    date > maxBookingDate
                                }
                                locale={dateLocale}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Check-out */}
                <div className="space-y-1 relative">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t('hotelDepartureDate')}</label>
                    <Popover open={checkOutOpen} onOpenChange={setCheckOutOpen}>
                        <PopoverTrigger asChild>
                            <button
                                type="button"
                                disabled={!checkInDate}
                                className="w-full flex items-center gap-2 h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:border-[#0454E8] transition-colors text-left disabled:opacity-50"
                            >
                                <CalendarIcon className="w-4 h-4 text-[#0454E8] shrink-0" />
                                <span className="text-sm text-slate-700">
                                    {checkOutDate ? format(checkOutDate, 'd MMM yyyy', { locale: dateLocale }) : <span className="text-slate-400">{checkInDate ? t('hotelChoose') : t('hotelChooseCheckoutFirst')}</span>}
                                </span>
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={checkOutDate}
                                onSelect={handleCheckOut}
                                disabled={(date) => {
                                    if (!checkInDate) return true;
                                    const maxCheckout = new Date(checkInDate);
                                    maxCheckout.setDate(maxCheckout.getDate() + 30);
                                    return date <= checkInDate || date > maxCheckout;
                                }}
                                defaultMonth={checkInDate}
                                locale={dateLocale}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                    {nights > 0 && (
                        <span className="absolute -top-2 right-2 bg-[#F5A623] text-[#0B2A5C] text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                            {nights} {t(nights > 1 ? 'hotelNights' : 'hotelNight')}
                        </span>
                    )}
                </div>

                {/* Rooms / travellers */}
                <div className="space-y-1 relative">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t('hotelRoomsTravelers')}</label>
                    <button
                        type="button"
                        onClick={() => setTravellersOpen((o) => !o)}
                        className="w-full flex items-center gap-2 h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:border-[#0454E8] transition-colors text-left"
                    >
                        <Users className="w-4 h-4 text-[#0454E8] shrink-0" />
                        <span className="flex-1 text-sm text-slate-700 truncate">
                            {rooms.length} {t(rooms.length > 1 ? 'hotelRooms' : 'hotelRoom')}, {totalAdults + totalChildren} {t(totalAdults + totalChildren > 1 ? 'hotelTravelers' : 'hotelTraveler')}
                        </span>
                    </button>

                    {travellersOpen && (
                        <div className="absolute z-20 top-full mt-2 left-0 right-0 md:right-auto md:w-96 bg-white rounded-xl border border-slate-200 shadow-xl p-4 space-y-4 max-h-96 overflow-y-auto">
                            {rooms.map((room, ri) => (
                                <div key={ri} className="space-y-2 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-slate-600">{t('hotelRoomNumber')} {ri + 1}</span>
                                        {rooms.length > 1 && (
                                            <button type="button" onClick={() => removeRoom(ri)} className="text-xs text-red-500 flex items-center gap-0.5">
                                                <X className="w-3 h-3" /> {t('hotelRemove')}
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-700">{t('hotelAdults')}</span>
                                        <div className="flex items-center gap-3">
                                            <button type="button" onClick={() => setRoomAdults(ri, room.numAdults - 1)} className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 hover:border-[#0454E8] hover:text-[#0454E8]">−</button>
                                            <span className="w-4 text-center text-sm font-semibold">{room.numAdults}</span>
                                            <button type="button" onClick={() => setRoomAdults(ri, room.numAdults + 1)} className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 hover:border-[#0454E8] hover:text-[#0454E8]">+</button>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-700">{t('hotelChildren')}</span>
                                        <div className="flex items-center gap-3">
                                            <button type="button" onClick={() => setChildCount(ri, room.childAges.length - 1)} className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 hover:border-[#0454E8] hover:text-[#0454E8]">−</button>
                                            <span className="w-4 text-center text-sm font-semibold">{room.childAges.length}</span>
                                            <button type="button" onClick={() => setChildCount(ri, room.childAges.length + 1)} className="w-7 h-7 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 hover:border-[#0454E8] hover:text-[#0454E8]">+</button>
                                        </div>
                                    </div>

                                    {room.childAges.length > 0 && (
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            {room.childAges.map((age, ci) => (
                                                <div key={ci} className="flex items-center gap-1">
                                                    <span className="text-xs text-slate-400">{t('hotelAge')} {ci + 1}</span>
                                                    <select
                                                        value={age}
                                                        onChange={(e) => setChildAge(ri, ci, Number(e.target.value))}
                                                        className="text-xs border border-slate-200 rounded-md px-1 py-0.5"
                                                    >
                                                        {Array.from({ length: 17 }, (_, i) => i + 1).map((a) => (
                                                            <option key={a} value={a}>{a}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {rooms.length < 5 && (
                                <button type="button" onClick={addRoom} className="text-xs text-[#1775FF] font-semibold">
                                    + {t('hotelAddRoom')}
                                </button>
                            )}

                            <Button
                                type="button"
                                onClick={() => setTravellersOpen(false)}
                                className="w-full h-9 bg-[#0454E8] hover:bg-[#0454E8]/90 text-white text-sm font-semibold"
                            >
                                {t('hotelValidate')}
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr,1fr,1fr,auto] gap-3 mt-3 items-end">
                {/* Hotels (optional) */}
                <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t('hotelHotels')} {t('hotelOptional')}</label>
                    <Popover open={hotelsOpen} onOpenChange={setHotelsOpen}>
                        <PopoverTrigger asChild>
                            <button
                                type="button"
                                disabled={!selectedCity}
                                className="w-full flex items-center gap-2 h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:border-[#0454E8] transition-colors text-left disabled:opacity-50"
                            >
                                <Building2 className="w-4 h-4 text-[#0454E8] shrink-0" />
                                <span className="flex-1 text-sm text-slate-700 truncate">
                                    {selectedHotelIds.length > 0
                                        ? `${selectedHotelIds.length} ${t('hotelSelectedHotels')}`
                                        : <span className="text-slate-400">{selectedCity ? t('hotelAllHotels') : t('hotelChooseCityFirst')}</span>}
                                </span>
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0" align="start">
                            <div className="p-2 border-b border-slate-100">
                                <div className="relative">
                                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <Input
                                        value={hotelFilter}
                                        onChange={(e) => setHotelFilter(e.target.value)}
                                        placeholder={t('hotelSearchHotel')}
                                        className="pl-8 h-8 text-xs"
                                    />
                                </div>
                            </div>
                            <div className="max-h-72 overflow-y-auto">
                                {hotelsLoading && <div className="p-4 text-center text-xs text-slate-400">{t('hotelLoading')}</div>}
                                {!hotelsLoading && filteredHotels.map((h) => (
                                    <label key={h.hotelId} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-[#DFECFF]/40 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectedHotelIds.includes(h.hotelId)}
                                            onChange={() => toggleHotel(h.hotelId)}
                                        />
                                        {h.hotelName}
                                    </label>
                                ))}
                                {!hotelsLoading && filteredHotels.length === 0 && (
                                    <div className="p-4 text-center text-xs text-slate-400">{t('hotelNoHotelFound')}</div>
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t('hotelNationality')}</label>
                    <div className="flex items-center h-11 px-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-500">
                        <span className="text-sm">{countryCodeToFlagEmoji('DZ')} {t('hotelAlgerian')}</span>
                    </div>
                </div>


                <Button
                    type="submit"
                    disabled={!selectedCity || !checkInDate || !checkOutDate}
                    className="h-11 px-8 font-bold shrink-0"
                    style={{ background: '#F5A623', color: '#0B2A5C' }}
                >
                    {t('hotelSearch')}
                </Button>
            </div>

            <label className="flex items-center gap-2 mt-3 text-xs text-slate-500">
                <input type="checkbox" checked={availableOnly} onChange={(e) => setAvailableOnly(e.target.checked)} />
                {t('hotelImmediateAvailability')}
            </label>
        </form>
    );
}