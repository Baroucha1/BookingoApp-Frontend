import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
    Search,
    X,
    MapPin,
    ArrowLeft,
    Loader2,
    Check,
    Globe,
    ChevronRight,
    Sparkles,
} from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { countryCodeToFlagEmoji } from '@/lib/countryFlag';
import {
    getCities,
    type TravellandaCountry,
    type TravellandaCity,
} from '@/service/hotels/hotelStaticData.public.service';

interface Props {
    open: boolean;
    onClose: () => void;
    countries: TravellandaCountry[];
    selectedCountry: TravellandaCountry | null;
    selectedCity: TravellandaCity | null;
    onSelect: (country: TravellandaCountry, city: TravellandaCity) => void;
}

const POPULAR_COUNTRY_CODES = ['DZ', 'TN', 'TR', 'FR', 'ES', 'AE', 'SA', 'MA', 'EG', 'IT'];

export default function HotelDestinationDialog({
    open,
    onClose,
    countries,
    selectedCountry,
    selectedCity,
    onSelect,
}: Props) {
    const { t, language } = useLanguage();
    const isRtl = language === 'ar';

    const [step, setStep] = useState<'country' | 'city'>('country');
    const [activeCountry, setActiveCountry] = useState<TravellandaCountry | null>(null);
    const [countrySearch, setCountrySearch] = useState('');
    const [citySearch, setCitySearch] = useState('');

    const [cities, setCities] = useState<TravellandaCity[]>([]);
    const [citiesLoading, setCitiesLoading] = useState(false);

    const searchInputRef = useRef<HTMLInputElement>(null);

    // Initialize state whenever modal opens
    useEffect(() => {
        if (!open) return;
        setCountrySearch('');
        setCitySearch('');
        // Always start on country selection so user can pick country first
        setStep('country');
        if (selectedCountry) {
            setActiveCountry(selectedCountry);
        }
    }, [open, selectedCountry]);

    // Focus input on step change
    useEffect(() => {
        if (!open) return;
        const timer = setTimeout(() => {
            searchInputRef.current?.focus();
        }, 150);
        return () => clearTimeout(timer);
    }, [open, step]);

    // Prevent background scrolling while open
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [open]);

    // Keyboard escape handler
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!open) return;
            if (e.key === 'Escape') {
                if (step === 'city') {
                    setStep('country');
                } else {
                    onClose();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, step, onClose]);

    // Load cities when activeCountry is selected
    const handleSelectCountry = async (country: TravellandaCountry) => {
        setActiveCountry(country);
        setCitySearch('');
        setStep('city');
        setCitiesLoading(true);
        setCities([]);
        try {
            const data = await getCities(country.code);
            setCities(data);
        } catch (err) {
            console.error('Failed to load cities for country', country.code, err);
        } finally {
            setCitiesLoading(false);
        }
    };

    const handleSelectCity = (city: TravellandaCity) => {
        if (!activeCountry) return;
        onSelect(activeCountry, city);
        onClose();
    };

    // Filtered countries
    const filteredCountries = useMemo(() => {
        const q = countrySearch.trim().toLowerCase();
        if (!q) return countries;
        return countries.filter(
            (c) =>
                c.name.toLowerCase().includes(q) ||
                c.code.toLowerCase().includes(q)
        );
    }, [countries, countrySearch]);

    // Popular countries
    const popularCountries = useMemo(() => {
        return countries.filter((c) => POPULAR_COUNTRY_CODES.includes(c.code.toUpperCase()));
    }, [countries]);

    // Filtered cities
    const filteredCities = useMemo(() => {
        const q = citySearch.trim().toLowerCase();
        if (!q) return cities;
        return cities.filter(
            (c) =>
                c.cityName.toLowerCase().includes(q) ||
                (c.stateCode && c.stateCode.toLowerCase().includes(q))
        );
    }, [cities, citySearch]);

    if (!open) return null;

    return createPortal(
        <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[99999] w-screen h-[100dvh] bg-[#F8FAFC] dark:bg-[#070B1E] flex flex-col animate-in fade-in-0 duration-200 overflow-hidden"
            style={{
                paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.5rem)',
                paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.5rem)',
            }}
        >
            {/* Top Navigation Bar */}
            <div className="bg-white dark:bg-[#0B132B] border-b border-slate-200/80 dark:border-slate-800 shadow-xs shrink-0 px-4 py-3">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
                    {/* Back / Close button */}
                    <div className="flex items-center gap-2">
                        {step === 'city' ? (
                            <button
                                type="button"
                                onClick={() => {
                                    setStep('country');
                                    setCountrySearch('');
                                }}
                                className="h-10 px-3 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer"
                                aria-label="Retour au choix du pays"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span>{isRtl ? 'تغيير البلد' : 'Changer de pays'}</span>
                            </button>
                        ) : (
                            <div className="flex items-center gap-2">
                                <div className="w-9 h-9 rounded-full bg-[#0454E8]/10 text-[#0454E8] flex items-center justify-center font-bold">
                                    <Globe className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-[#002161] dark:text-white leading-tight">
                                        {isRtl ? 'اختر وجهتك' : 'Destination hôtel'}
                                    </h2>
                                    <p className="text-[11px] text-slate-500 font-medium">
                                        {isRtl ? 'الخطوة 1: اختر البلد' : 'Étape 1 sur 2 : Choisissez le pays'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Step indicator pills */}
                    <div className="hidden sm:flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-full text-xs font-semibold">
                        <button
                            type="button"
                            onClick={() => setStep('country')}
                            className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                                step === 'country'
                                    ? 'bg-[#0454E8] text-white shadow-xs'
                                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                            }`}
                        >
                            <span>1. {isRtl ? 'البلد' : 'Pays'}</span>
                            {activeCountry && (
                                <span className="text-xs">({countryCodeToFlagEmoji(activeCountry.code)})</span>
                            )}
                        </button>
                        <button
                            type="button"
                            disabled={!activeCountry}
                            onClick={() => {
                                if (activeCountry) setStep('city');
                            }}
                            className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                                step === 'city'
                                    ? 'bg-[#0454E8] text-white shadow-xs'
                                    : activeCountry
                                    ? 'text-slate-600 dark:text-slate-300 hover:text-slate-900 cursor-pointer'
                                    : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                            }`}
                        >
                            <span>2. {isRtl ? 'المدينة' : 'Ville'}</span>
                        </button>
                    </div>

                    {/* Close button */}
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-10 h-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer"
                        aria-label="Fermer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col max-w-4xl w-full mx-auto">
                {/* STEP 1: COUNTRY SELECTION */}
                {step === 'country' && (
                    <div className="flex-1 flex flex-col min-h-0 p-4 sm:p-6 overflow-hidden">
                        {/* Search input */}
                        <div className="relative mb-4 shrink-0">
                            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={countrySearch}
                                onChange={(e) => setCountrySearch(e.target.value)}
                                placeholder={t('hotelSearchCountryPlaceholder')}
                                className="w-full h-12 pl-11 pr-10 bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-slate-800 rounded-2xl text-base text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:border-[#0454E8] focus:ring-3 focus:ring-[#0454E8]/10 transition-all shadow-xs"
                            />
                            {countrySearch && (
                                <button
                                    type="button"
                                    onClick={() => setCountrySearch('')}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Popular Countries Chips (only when not searching) */}
                        {!countrySearch.trim() && popularCountries.length > 0 && (
                            <div className="mb-4 shrink-0">
                                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                                    <Sparkles className="w-3.5 h-3.5 text-[#FFAA01]" />
                                    <span>{isRtl ? 'الوجهات الشائعة' : 'Destinations populaires'}</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {popularCountries.map((c) => (
                                        <button
                                            key={c.code}
                                            type="button"
                                            onClick={() => handleSelectCountry(c)}
                                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-slate-800 hover:border-[#0454E8] hover:bg-[#0454E8]/5 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-semibold transition-all shadow-2xs active:scale-95 cursor-pointer"
                                        >
                                            <span className="text-base">{countryCodeToFlagEmoji(c.code)}</span>
                                            <span>{c.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Country List Header */}
                        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 shrink-0">
                            <span>{isRtl ? 'جميع الدول' : 'Tous les pays'}</span>
                            <span className="text-slate-400 font-normal">
                                {filteredCountries.length} {isRtl ? 'بلد' : 'pays'}
                            </span>
                        </div>

                        {/* Countries Scrollable List */}
                        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 -mr-1">
                            {filteredCountries.map((c) => {
                                const isSelected = activeCountry?.code === c.code;
                                return (
                                    <button
                                        key={c.code}
                                        type="button"
                                        onClick={() => handleSelectCountry(c)}
                                        className={`w-full text-left p-3.5 rounded-2xl flex items-center justify-between transition-all cursor-pointer active:scale-[0.99] ${
                                            isSelected
                                                ? 'bg-[#0454E8] text-white shadow-md shadow-[#0454E8]/20'
                                                : 'bg-white dark:bg-[#0B132B] hover:bg-[#0454E8]/5 dark:hover:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800/80 text-slate-800 dark:text-slate-200'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3.5 min-w-0">
                                            <span className="text-2xl shrink-0">
                                                {countryCodeToFlagEmoji(c.code)}
                                            </span>
                                            <div className="min-w-0">
                                                <p className={`font-semibold text-sm sm:text-base truncate ${
                                                    isSelected ? 'text-white' : 'text-slate-900 dark:text-white'
                                                }`}>
                                                    {c.name}
                                                </p>
                                                <p className={`text-xs ${
                                                    isSelected ? 'text-white/80' : 'text-slate-400'
                                                }`}>
                                                    Code: {c.code}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0 ml-3">
                                            {isSelected && (
                                                <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                                                    <Check className="w-4 h-4 text-white" />
                                                </span>
                                            )}
                                            <ChevronRight className={`w-4 h-4 ${
                                                isSelected ? 'text-white/80' : 'text-slate-400'
                                            }`} />
                                        </div>
                                    </button>
                                );
                            })}

                            {filteredCountries.length === 0 && (
                                <div className="py-16 text-center text-slate-400">
                                    <Globe className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                                    <p className="text-sm font-semibold">{t('hotelNoResultsShort')}</p>
                                    <p className="text-xs text-slate-400 mt-1">
                                        Essayez avec un autre terme ou vérifiez l'orthographe.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* STEP 2: CITY SELECTION */}
                {step === 'city' && (
                    <div className="flex-1 flex flex-col min-h-0 p-4 sm:p-6 overflow-hidden">
                        {/* Selected Country Banner */}
                        {activeCountry && (
                            <div className="mb-4 p-3.5 rounded-2xl bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 shadow-2xs">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{countryCodeToFlagEmoji(activeCountry.code)}</span>
                                    <div>
                                        <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                                            {isRtl ? 'البلد المحدد' : 'Pays sélectionné'}
                                        </p>
                                        <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                                            {activeCountry.name}
                                        </h3>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setStep('country')}
                                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#0454E8] dark:text-blue-400 text-xs font-semibold transition-colors cursor-pointer"
                                >
                                    {isRtl ? 'تغيير' : 'Changer'}
                                </button>
                            </div>
                        )}

                        {/* Search input for cities */}
                        <div className="relative mb-4 shrink-0">
                            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={citySearch}
                                onChange={(e) => setCitySearch(e.target.value)}
                                placeholder={t('hotelSearchCityPlaceholder')}
                                className="w-full h-12 pl-11 pr-10 bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-slate-800 rounded-2xl text-base text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:border-[#0454E8] focus:ring-3 focus:ring-[#0454E8]/10 transition-all shadow-xs"
                            />
                            {citySearch && (
                                <button
                                    type="button"
                                    onClick={() => setCitySearch('')}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Loading State */}
                        {citiesLoading && (
                            <div className="flex-1 flex flex-col items-center justify-center py-16 gap-3">
                                <Loader2 className="w-8 h-8 text-[#0454E8] animate-spin" />
                                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                                    {t('hotelLoadingCities')}
                                </p>
                                <p className="text-xs text-slate-400">
                                    {activeCountry?.name}
                                </p>
                            </div>
                        )}

                        {/* City List Header */}
                        {!citiesLoading && (
                            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 shrink-0">
                                <span>{isRtl ? 'المدن المتاحة' : 'Villes disponibles'}</span>
                                <span className="text-slate-400 font-normal">
                                    {filteredCities.length} {isRtl ? 'مدينة' : 'villes'}
                                </span>
                            </div>
                        )}

                        {/* Cities Scrollable List */}
                        {!citiesLoading && (
                            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 -mr-1">
                                {filteredCities.map((c) => {
                                    const isSelected = selectedCity?.cityId === c.cityId;
                                    return (
                                        <button
                                            key={c.cityId}
                                            type="button"
                                            onClick={() => handleSelectCity(c)}
                                            className={`w-full text-left p-3.5 rounded-2xl flex items-center justify-between transition-all cursor-pointer active:scale-[0.99] ${
                                                isSelected
                                                    ? 'bg-[#0454E8] text-white shadow-md shadow-[#0454E8]/20'
                                                    : 'bg-white dark:bg-[#0B132B] hover:bg-[#0454E8]/5 dark:hover:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800/80 text-slate-800 dark:text-slate-200'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3.5 min-w-0">
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                                    isSelected ? 'bg-white/20 text-white' : 'bg-blue-50 dark:bg-slate-800 text-[#0454E8]'
                                                }`}>
                                                    <MapPin className="w-4 h-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className={`font-semibold text-sm sm:text-base truncate ${
                                                        isSelected ? 'text-white' : 'text-slate-900 dark:text-white'
                                                    }`}>
                                                        {c.cityName}
                                                    </p>
                                                    {c.stateCode && (
                                                        <p className={`text-xs ${
                                                            isSelected ? 'text-white/80' : 'text-slate-400'
                                                        }`}>
                                                            {c.stateCode}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0 ml-3">
                                                {isSelected && (
                                                    <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                                                        <Check className="w-4 h-4 text-white" />
                                                    </span>
                                                )}
                                                <ChevronRight className={`w-4 h-4 ${
                                                    isSelected ? 'text-white/80' : 'text-slate-400'
                                                }`} />
                                            </div>
                                        </button>
                                    );
                                })}

                                {filteredCities.length === 0 && (
                                    <div className="py-16 text-center text-slate-400">
                                        <MapPin className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                                        <p className="text-sm font-semibold">{t('hotelNoCitiesFound')}</p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            Essayez un autre nom de ville ou choisissez un autre pays.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}
