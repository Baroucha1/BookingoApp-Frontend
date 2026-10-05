// src/components/hotels/HotelsSearchForm.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MapPin,
    Calendar as CalendarIcon,
    Users,
    Search,
    X,
    Building2,
    Check,
    ChevronDown,
    Plus,
    Minus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { fr, enUS, ar } from 'date-fns/locale';
import { useLanguage } from '@/i18n/LanguageContext';
import { countryCodeToFlagEmoji } from '@/lib/countryFlag';
import {
    getCountries,
    getCities,
    getHotels,
    type TravellandaCountry,
    type TravellandaCity,
    type TravellandaHotel,
} from '@/service/hotels/hotelStaticData.public.service';
import { encodeHotelSearchParams } from '@/lib/hotelSearchParams';
import { Tile, Chip } from '@/components/flights/search/SearchFormShared';
import HotelDestinationDialog from './HotelDestinationDialog';

export interface RoomInput {
    numAdults: number;
    childAges: number[];
}

export interface HotelSearchParams {
    countryCode: string;
    cityId: number;
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

export default function HotelSearchForm({ onSubmit }: Props) {
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const dateLocale = language === 'ar' ? ar : language === 'en' ? enUS : fr;

    // Destination (country → city)
    const [destinationOpen, setDestinationOpen] = useState(false);
    const [countries, setCountries] = useState<TravellandaCountry[]>([]);
    const [selectedCountry, setSelectedCountry] = useState<TravellandaCountry | null>(null);
    const [selectedCity, setSelectedCity] = useState<TravellandaCity | null>(null);

    // Hotels (optional)
    const [hotelsOpen, setHotelsOpen] = useState(false);
    const [hotels, setHotels] = useState<TravellandaHotel[]>([]);
    const [hotelsLoading, setHotelsLoading] = useState(false);
    const [hotelFilter, setHotelFilter] = useState('');
    const [selectedHotelIds, setSelectedHotelIds] = useState<number[]>([]);

    // Dates
    const [checkInDate, setCheckInDate] = useState<Date | undefined>();
    const [checkOutDate, setCheckOutDate] = useState<Date | undefined>();
    const [checkInOpen, setCheckInOpen] = useState(false);
    const [checkOutOpen, setCheckOutOpen] = useState(false);

    // Rooms / travellers
    const [travellersOpen, setTravellersOpen] = useState(false);
    const [rooms, setRooms] = useState<RoomInput[]>([{ numAdults: 2, childAges: [] }]);

    // Availability filter
    const [availableOnly, setAvailableOnly] = useState(true);

    useEffect(() => {
        getCountries().then(setCountries).catch(() => {});
    }, []);

    const handleDestinationSelect = async (country: TravellandaCountry, city: TravellandaCity) => {
        setSelectedCountry(country);
        setSelectedCity(city);
        setSelectedHotelIds([]);
        setHotels([]);
        setHotelsLoading(true);
        try {
            setHotels(await getHotels(city.cityId));
        } catch (err) {
            console.error('Failed to load hotels for city', city.cityId, err);
        } finally {
            setHotelsLoading(false);
        }
    };

    const toggleHotel = (id: number) => {
        setSelectedHotelIds((prev) =>
            prev.includes(id) ? prev.filter((h) => h !== id) : [...prev, id]
        );
    };

    const handleCheckIn = (date: Date | undefined) => {
        setCheckInDate(date);
        setCheckInOpen(false);
        if (date && (!checkOutDate || checkOutDate <= date)) {
            const nextDay = new Date(date);
            nextDay.setDate(nextDay.getDate() + 1);
            setCheckOutDate(nextDay);
        }
    };

    const handleCheckOut = (date: Date | undefined) => {
        setCheckOutDate(date);
        setCheckOutOpen(false);
    };

    const nights =
        checkInDate && checkOutDate
            ? Math.max(1, Math.round((checkOutDate.getTime() - checkInDate.getTime()) / 86400000))
            : 0;

    useEffect(() => {
        const isDateOpen = checkInOpen || checkOutOpen;
        if (isDateOpen) {
            document.body.setAttribute('data-datepicker-open', 'true');
            window.dispatchEvent(new CustomEvent('app-datepicker-toggle', { detail: { isOpen: true } }));
        } else {
            document.body.removeAttribute('data-datepicker-open');
            window.dispatchEvent(new CustomEvent('app-datepicker-toggle', { detail: { isOpen: false } }));
        }
        return () => {
            document.body.removeAttribute('data-datepicker-open');
            window.dispatchEvent(new CustomEvent('app-datepicker-toggle', { detail: { isOpen: false } }));
        };
    }, [checkInOpen, checkOutOpen]);

    // Rooms management
    const addRoom = () => {
        if (rooms.length >= 5) return;
        setRooms((prev) => [...prev, { numAdults: 2, childAges: [] }]);
    };

    const removeRoom = (idx: number) => {
        setRooms((prev) => prev.filter((_, i) => i !== idx));
    };

    const setRoomAdults = (idx: number, n: number) => {
        setRooms((prev) =>
            prev.map((r, i) => (i === idx ? { ...r, numAdults: Math.min(4, Math.max(1, n)) } : r))
        );
    };

    const setChildCount = (idx: number, n: number) => {
        setRooms((prev) =>
            prev.map((r, i) => {
                if (i !== idx) return r;
                const count = Math.min(3, Math.max(0, n));
                const childAges = Array.from({ length: count }, (_, ci) => r.childAges[ci] ?? 5);
                return { ...r, childAges };
            })
        );
    };

    const setChildAge = (roomIdx: number, childIdx: number, age: number) => {
        setRooms((prev) =>
            prev.map((r, i) => {
                if (i !== roomIdx) return r;
                const childAges = [...r.childAges];
                childAges[childIdx] = age;
                return { ...r, childAges };
            })
        );
    };

    const totalAdults = rooms.reduce((s, r) => s + r.numAdults, 0);
    const totalChildren = rooms.reduce((s, r) => s + r.childAges.length, 0);

    const filteredHotels = hotels.filter((h) =>
        h.hotelName.toLowerCase().includes(hotelFilter.toLowerCase())
    );

    const maxBookingDate = new Date(new Date().setHours(0, 0, 0, 0));
    maxBookingDate.setDate(maxBookingDate.getDate() + 365);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCity || !checkInDate || !checkOutDate) return;

        const params: HotelSearchParams = {
            countryCode: selectedCountry?.code ?? '',
            cityId: selectedCity.cityId,
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
        <form onSubmit={handleSubmit} className="w-full max-w-7xl mx-auto" data-no-hide-nav="true" data-hotel-search="true">
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl sm:rounded-[36px] border border-slate-200/90 dark:border-slate-800 shadow-[0_20px_50px_rgba(0,33,97,0.16)] p-3.5 sm:p-7 md:p-8">
                {/* Header Tag */}
                <div className="flex items-center justify-between mb-3 sm:mb-5">
                    <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-[#1775FF]/10 text-[#0454E8] font-bold text-[11px] sm:text-sm uppercase tracking-wider">
                        <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FFAA01]" />
                        {t('hotelSearchHeaderTag')}
                    </div>
                </div>

                {/* Main Inputs Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.3fr_1.35fr_1.1fr] gap-2.5 sm:gap-3.5 mb-4 sm:mb-5">
                    {/* Destination Tile */}
                    <div>
                        <Tile
                            icon={<MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-[#FFAA01]" />}
                            label={t('hotelSearchDestination').toUpperCase()}
                            onClick={() => setDestinationOpen(true)}
                            className="cursor-pointer w-full min-h-[66px] sm:min-h-[82px] py-2.5 sm:py-3.5 px-3.5 sm:px-5 hover:border-[#0454E8]/40 transition-colors"
                        >
                            {selectedCity ? (
                                <div className="min-w-0">
                                    <div className="font-bold text-[#002161] dark:text-white text-sm sm:text-lg truncate leading-snug">
                                        {countryCodeToFlagEmoji(selectedCountry?.code ?? '')} {selectedCity.cityName}
                                    </div>
                                    <div className="text-[11px] sm:text-sm text-[#0454E8] truncate font-medium">
                                        {selectedCountry?.name}
                                    </div>
                                </div>
                            ) : (
                                <div className="font-medium text-slate-400 text-sm sm:text-lg mt-0.5">
                                    {t('hotelSearchCityCountry')}
                                </div>
                            )}
                        </Tile>
                    </div>

                    <HotelDestinationDialog
                        open={destinationOpen}
                        onClose={() => setDestinationOpen(false)}
                        countries={countries}
                        selectedCountry={selectedCountry}
                        selectedCity={selectedCity}
                        onSelect={handleDestinationSelect}
                    />

                    {/* Dates Block (Check-in & Check-out unified or side-by-side) */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                        {/* Check-in */}
                        <Popover open={checkInOpen} onOpenChange={setCheckInOpen}>
                            <PopoverTrigger asChild>
                                <div>
                                    <Tile
                                        icon={<CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#FFAA01]" />}
                                        label={t('hotelSearchCheckIn').toUpperCase()}
                                        className="cursor-pointer w-full min-h-[66px] sm:min-h-[82px] py-2.5 sm:py-3.5 px-2.5 sm:px-4"
                                    >
                                        <div className="font-bold text-[#002161] dark:text-white text-xs sm:text-base truncate leading-snug">
                                            {checkInDate ? format(checkInDate, 'd MMM yyyy', { locale: dateLocale }) : <span className="text-slate-400 font-medium">{t('hotelChooseDate')}</span>}
                                        </div>
                                    </Tile>
                                </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 rounded-2xl shadow-2xl border-slate-200" align="center">
                                <Calendar
                                    mode="single"
                                    selected={checkInDate}
                                    onSelect={handleCheckIn}
                                    disabled={(date) =>
                                        date < new Date(new Date().setHours(0, 0, 0, 0)) || date > maxBookingDate
                                    }
                                    locale={dateLocale}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>

                        {/* Check-out */}
                        <Popover open={checkOutOpen} onOpenChange={setCheckOutOpen}>
                            <PopoverTrigger asChild>
                                <div className="relative">
                                    <Tile
                                        icon={<CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#FFAA01]" />}
                                        label={t('hotelSearchCheckOut').toUpperCase()}
                                        className="cursor-pointer w-full min-h-[66px] sm:min-h-[82px] py-2.5 sm:py-3.5 px-2.5 sm:px-4"
                                    >
                                        <div className="font-bold text-[#002161] dark:text-white text-xs sm:text-base truncate leading-snug">
                                            {checkOutDate ? format(checkOutDate, 'd MMM yyyy', { locale: dateLocale }) : <span className="text-slate-400 font-medium">{checkInDate ? t('hotelChooseDate') : t('hotelCheckInFirst')}</span>}
                                        </div>
                                    </Tile>
                                    {nights > 0 && (
                                        <span className="absolute -top-2.5 right-1 sm:right-2 bg-gradient-to-r from-[#FFAA01] to-[#FF9800] text-[#002161] text-[10px] sm:text-[11px] font-extrabold px-2 sm:px-2.5 py-0.5 rounded-full shadow-sm pointer-events-none">
                                            {nights} {nights > 1 ? t('hotelNights') : t('hotelNight')}
                                        </span>
                                    )}
                                </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 rounded-2xl shadow-2xl border-slate-200" align="center">
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
                    </div>

                    {/* Rooms / Travellers Tile */}
                    <Popover open={travellersOpen} onOpenChange={setTravellersOpen}>
                        <PopoverTrigger asChild>
                            <div>
                                <Tile
                                    icon={<Users className="w-4 h-4 sm:w-5 sm:h-5 text-[#FFAA01]" />}
                                    label={t('hotelSearchGuestsRooms').toUpperCase()}
                                    className="cursor-pointer w-full min-h-[66px] sm:min-h-[82px] py-2.5 sm:py-3.5 px-3 sm:px-5"
                                >
                                    <div className="font-bold text-[#0454E8] dark:text-blue-400 text-xs sm:text-base whitespace-nowrap truncate leading-snug">
                                        {rooms.length} {rooms.length > 1 ? t('hotelSearchRooms') : t('hotelSearchRoom').toLowerCase()} · {totalAdults + totalChildren} {totalAdults + totalChildren > 1 ? t('hotelSearchGuests') : t('hotelSearchGuest')}
                                    </div>
                                    <div className="text-[11px] sm:text-sm text-slate-500 truncate font-medium">
                                        {totalAdults} {totalAdults > 1 ? t('hotelSearchAdults') : t('hotelSearchAdults')}{totalChildren > 0 ? `, ${totalChildren} ${totalChildren > 1 ? t('hotelSearchChildren') : t('hotelSearchChildren')}` : ''}
                                    </div>
                                </Tile>
                            </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-[calc(100vw-2.5rem)] sm:w-96 max-w-sm p-4 rounded-2xl shadow-2xl border-slate-200" align="center">
                            <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                                {rooms.map((room, ri) => (
                                    <div key={ri} className="space-y-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('hotelSearchRoom')} {ri + 1}</span>
                                            {rooms.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeRoom(ri)}
                                                    className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-medium cursor-pointer"
                                                >
                                                    <X className="w-3.5 h-3.5" /> {t('hotelSearchRemoveRoom')}
                                                </button>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-sm font-semibold text-slate-700">{t('hotelSearchAdults')}</div>
                                                <div className="text-xs text-slate-400">{t('hotelAdultsAge')}</div>
                                            </div>
                                            <div className="flex items-center gap-2.5">
                                                <button
                                                    type="button"
                                                    onClick={() => setRoomAdults(ri, room.numAdults - 1)}
                                                    className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:border-[#0454E8] hover:text-[#0454E8] active:scale-95 transition-all cursor-pointer"
                                                >
                                                    <Minus className="w-3.5 h-3.5" />
                                                </button>
                                                <span className="w-5 text-center text-sm font-bold text-slate-800">{room.numAdults}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setRoomAdults(ri, room.numAdults + 1)}
                                                    className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:border-[#0454E8] hover:text-[#0454E8] active:scale-95 transition-all cursor-pointer"
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-sm font-semibold text-slate-700">{t('hotelSearchChildren')}</div>
                                                <div className="text-xs text-slate-400">{t('hotelChildrenAge')}</div>
                                            </div>
                                            <div className="flex items-center gap-2.5">
                                                <button
                                                    type="button"
                                                    onClick={() => setChildCount(ri, room.childAges.length - 1)}
                                                    className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:border-[#0454E8] hover:text-[#0454E8] active:scale-95 transition-all cursor-pointer"
                                                >
                                                    <Minus className="w-3.5 h-3.5" />
                                                </button>
                                                <span className="w-5 text-center text-sm font-bold text-slate-800">{room.childAges.length}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setChildCount(ri, room.childAges.length + 1)}
                                                    className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:border-[#0454E8] hover:text-[#0454E8] active:scale-95 transition-all cursor-pointer"
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        {room.childAges.length > 0 && (
                                            <div className="flex flex-wrap gap-2 pt-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                                {room.childAges.map((age, ci) => (
                                                    <div key={ci} className="flex items-center gap-1.5">
                                                        <span className="text-xs text-slate-500 font-medium">{t('hotelSearchChildAge')} {ci + 1} :</span>
                                                        <select
                                                            value={age}
                                                            onChange={(e) => setChildAge(ri, ci, Number(e.target.value))}
                                                            className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none focus:border-[#0454E8]"
                                                        >
                                                            {Array.from({ length: 17 }, (_, i) => i + 1).map((a) => (
                                                                <option key={a} value={a}>{a} {a > 1 ? (language === 'ar' ? 'سنوات' : language === 'en' ? 'years' : 'ans') : (language === 'ar' ? 'سنة' : language === 'en' ? 'year' : 'an')}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {rooms.length < 5 && (
                                    <button
                                        type="button"
                                        onClick={addRoom}
                                        className="text-xs text-[#0454E8] font-bold flex items-center gap-1.5 hover:underline py-1 cursor-pointer"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> {t('hotelSearchAddRoom')}
                                    </button>
                                )}

                                <Button
                                    type="button"
                                    onClick={() => setTravellersOpen(false)}
                                    className="w-full h-10 bg-[#0454E8] hover:bg-[#0454E8]/90 text-white font-bold rounded-xl text-sm cursor-pointer"
                                >
                                    {t('hotelValidate')}
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Bottom Row: Chips & Submit Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Instant Availability Chip */}
                        <Chip
                            active={availableOnly}
                            onClick={() => setAvailableOnly(!availableOnly)}
                            icon={<Check className="w-3 h-3" />}
                            label={t('hotelInstantAvailability')}
                        />

                        {/* Optional Specific Hotels Filter */}
                        <Popover open={hotelsOpen} onOpenChange={setHotelsOpen}>
                            <PopoverTrigger asChild>
                                <div>
                                    <Chip
                                        active={selectedHotelIds.length > 0}
                                        onClick={() => setHotelsOpen(!hotelsOpen)}
                                        icon={<Building2 className="w-3 h-3" />}
                                        label={
                                            selectedHotelIds.length > 0
                                                ? `${selectedHotelIds.length} ${t('hotelSelectedHotels')}`
                                                : t('hotelSpecificHotels')
                                        }
                                    />
                                </div>
                            </PopoverTrigger>
                            <PopoverContent data-no-hide-nav="true" data-hotel-search="true" className="w-[calc(100vw-2.5rem)] sm:w-80 max-w-sm p-0 rounded-2xl shadow-2xl border-slate-200" align="start">
                                <div className="p-3 border-b border-slate-100">
                                    <div className="relative">
                                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <Input
                                            value={hotelFilter}
                                            onChange={(e) => setHotelFilter(e.target.value)}
                                            placeholder={t('hotelFilterHotelPlaceholder')}
                                            className="pl-9 h-10 text-base md:text-sm rounded-xl"
                                        />
                                    </div>
                                </div>
                                <div className="max-h-64 overflow-y-auto p-1">
                                    {hotelsLoading && (
                                        <div className="p-6 text-center text-xs text-slate-400">{t('hotelLoadingHotels')}</div>
                                    )}
                                    {!hotelsLoading && !selectedCity && (
                                        <div className="p-6 text-center text-xs text-slate-400">{t('hotelSelectCityFirst')}</div>
                                    )}
                                    {!hotelsLoading && selectedCity && filteredHotels.map((h) => (
                                        <label
                                            key={h.hotelId}
                                            className="flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-[#DFECFF]/50 rounded-xl cursor-pointer transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedHotelIds.includes(h.hotelId)}
                                                onChange={() => toggleHotel(h.hotelId)}
                                                className="w-4 h-4 accent-[#0454E8] rounded"
                                            />
                                            <span className="text-slate-700 text-xs font-medium">{h.hotelName}</span>
                                        </label>
                                    ))}
                                    {!hotelsLoading && selectedCity && filteredHotels.length === 0 && (
                                        <div className="p-6 text-center text-xs text-slate-400">{t('hotelNoHotelsFound')}</div>
                                    )}
                                </div>
                            </PopoverContent>
                        </Popover>

                        {/* Nationality badge */}
                        <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs">
                            <span>{countryCodeToFlagEmoji('DZ')}</span>
                            <span>{t('algerian')}</span>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        disabled={!selectedCity || !checkInDate || !checkOutDate}
                        className="w-full sm:w-auto h-12 sm:h-14 px-8 sm:px-10 bg-gradient-to-r from-[#FFAA01] to-[#FF9800] hover:brightness-105 text-[#002161] font-extrabold text-sm sm:text-base rounded-xl sm:rounded-full shadow-[0_8px_25px_rgba(255,170,1,0.4)] hover:shadow-[0_12px_32px_rgba(255,170,1,0.55)] active:scale-95 transition-all shrink-0 flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:shadow-none cursor-pointer"
                    >
                        <Search className="w-5 h-5" />
                        {t('hotelSearchSubmit')}
                    </Button>
                </div>
            </div>
        </form>
    );
}