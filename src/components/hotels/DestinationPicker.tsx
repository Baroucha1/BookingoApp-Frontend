import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Check, ChevronRight, MapPin, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { countryCodeToFlagEmoji } from '@/lib/countryFlag';
import type { TravellandaCountry, TravellandaCity } from '@/service/hotels/hotelStaticData.public.service';
import { useLanguage } from '@/i18n/LanguageContext';

interface PickerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    countries: TravellandaCountry[];
    selectedCountry: TravellandaCountry | null;
    selectedCity: TravellandaCity | null;
    cities: TravellandaCity[];
    citiesLoading: boolean;
    onSelectCountry: (country: TravellandaCountry) => void;
    onBackToCountries: () => void;
    onSelectCity: (city: TravellandaCity) => void;
}

export default function DestinationPicker(props: PickerProps) {
    const { open, onOpenChange, selectedCountry, selectedCity } = props;
    const isMobile = useMediaQuery('(max-width: 767px)');
    const { t } = useLanguage();

    const trigger = (
        <button
            type="button"
            onClick={isMobile ? () => onOpenChange(true) : undefined}
            className="w-full flex items-center gap-2 h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:border-[#0454E8] transition-colors text-left"
        >
            <MapPin className="w-4 h-4 text-[#0454E8] shrink-0" />
            <span className="flex-1 text-sm text-slate-700 truncate">
        {selectedCity && selectedCountry
            ? <>{countryCodeToFlagEmoji(selectedCountry.code)} {selectedCity.cityName}, {selectedCountry.name}</>
            : <span className="text-slate-400">{t('hotelChooseCityCountry')}</span>}
      </span>
        </button>
    );

    // ── Mobile: full-screen page ──
    if (isMobile) {
        return (
            <>
                {trigger}
                {open && (
                    <FullScreenSheet onClose={() => onOpenChange(false)}>
                        <DestinationList {...props} variant="fullscreen" onClose={() => onOpenChange(false)} />
                    </FullScreenSheet>
                )}
            </>
        );
    }

    // ── Desktop: popover (unchanged behaviour) ──
    return (
        <Popover open={open} onOpenChange={onOpenChange}>
            <PopoverTrigger asChild>{trigger}</PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
                <DestinationList {...props} variant="popover" onClose={() => onOpenChange(false)} />
            </PopoverContent>
        </Popover>
    );
}

// ─────────────────────────────────────────────────────────────────────────────

function FullScreenSheet({ onClose, children }: { onClose: () => void; children: ReactNode }) {
    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = prev;
            window.removeEventListener('keydown', onKey);
        };
    }, [onClose]);

    // Portal to <body>: the form has backdrop-blur, which would trap a fixed child inside it
    return createPortal(
        <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[100] flex h-[100dvh] flex-col bg-white animate-in slide-in-from-bottom duration-200"
        >
            {children}
        </div>,
        document.body,
    );
}

// ─────────────────────────────────────────────────────────────────────────────

function DestinationList({
                             variant,
                             countries,
                             selectedCountry,
                             selectedCity,
                             cities,
                             citiesLoading,
                             onSelectCountry,
                             onBackToCountries,
                             onSelectCity,
                             onClose,
                         }: PickerProps & { variant: 'popover' | 'fullscreen'; onClose: () => void }) {
    const { t } = useLanguage();
    const [countryFilter, setCountryFilter] = useState('');
    const [cityFilter, setCityFilter] = useState('');
    const full = variant === 'fullscreen';

    const filteredCountries = countries.filter(c =>
        c.name.toLowerCase().includes(countryFilter.toLowerCase()),
    );
    const filteredCities = cities.filter(c =>
        c.cityName.toLowerCase().includes(cityFilter.toLowerCase()),
    );

    const handleCountry = (c: TravellandaCountry) => {
        setCityFilter('');
        onSelectCountry(c);
    };
    const handleBack = () => {
        setCityFilter('');
        onBackToCountries();
    };

    const row = cn(
        'w-full text-left flex items-center gap-3 transition-colors hover:bg-[#DFECFF]/40 active:bg-[#DFECFF]/60',
        full ? 'px-4 py-3.5 text-base border-b border-slate-100' : 'px-3 py-2 text-sm',
    );
    const empty = cn('text-center text-slate-400', full ? 'p-8 text-sm' : 'p-4 text-xs');

    return (
        <div className={cn('flex flex-col', full && 'h-full min-h-0')}>
            {/* Header (fullscreen only) */}
            {full && (
                <div className="flex items-center gap-1 h-[calc(3.5rem+env(safe-area-inset-top,0px))] pt-safe px-2 border-b border-slate-100 shrink-0">
                    <button
                        type="button"
                        onClick={selectedCountry ? handleBack : onClose}
                        aria-label="Retour"
                        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-700" />
                    </button>
                    <h2 className="flex-1 text-base font-semibold text-slate-800 truncate">
                        {selectedCountry
                            ? <>{countryCodeToFlagEmoji(selectedCountry.code)} {selectedCountry.name}</>
                            : t('hotelSearchCountry')}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={t('flightClose')}
                        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100"
                    >
                        <X className="w-5 h-5 text-slate-700" />
                    </button>
                </div>
            )}

            {/* Back link (popover only) */}
            {!full && selectedCountry && (
                <div className="p-2 border-b border-slate-100">
                    <button type="button" onClick={handleBack} className="text-xs text-[#1775FF]">
                        ← {countryCodeToFlagEmoji(selectedCountry.code)} {selectedCountry.name}
                    </button>
                </div>
            )}

            {/* Search */}
            <div className={cn('border-b border-slate-100 shrink-0', full ? 'p-3' : 'p-2')}>
                <div className="relative">
                    <Search
                        className={cn(
                            'absolute top-1/2 -translate-y-1/2 text-slate-400',
                            full ? 'left-3 w-4 h-4' : 'left-2.5 w-3.5 h-3.5',
                        )}
                    />
                    <Input
                        key={selectedCountry ? 'city' : 'country'} // remount → refocus on step change
                        autoFocus
                        enterKeyHint="search"
                        value={selectedCountry ? cityFilter : countryFilter}
                        onChange={e =>
                            selectedCountry ? setCityFilter(e.target.value) : setCountryFilter(e.target.value)
                        }
                        placeholder={selectedCountry ? t('hotelSearchCity') : t('hotelSearchCountry')}
                        // text-base (16px) on mobile prevents iOS from zooming in on focus
                        className={full ? 'pl-10 h-11 text-base rounded-xl' : 'pl-8 h-8 text-xs'}
                    />
                </div>
            </div>

            {/* List */}
            <div className={cn('overflow-y-auto overscroll-contain', full ? 'flex-1 min-h-0 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]' : 'max-h-72')}>
                {!selectedCountry ? (
                    <>
                        {filteredCountries.map(c => (
                            <button key={c.code} type="button" onClick={() => handleCountry(c)} className={row}>
                                <span className={full ? 'text-xl' : ''}>{countryCodeToFlagEmoji(c.code)}</span>
                                <span className="flex-1">{c.name}</span>
                                {full && <ChevronRight className="w-4 h-4 text-slate-300" />}
                            </button>
                        ))}
                        {filteredCountries.length === 0 && <div className={empty}>{t('hotelNoResults')}</div>}
                    </>
                ) : (
                    <>
                        {citiesLoading && <div className={empty}>{t('hotelLoading')}</div>}
                        {!citiesLoading && filteredCities.map(c => (
                            <button key={c.cityId} type="button" onClick={() => onSelectCity(c)} className={row}>
                                {full && <MapPin className="w-4 h-4 text-slate-400 shrink-0" />}
                                <span className="flex-1">
                  {c.cityName}
                                    {c.stateCode && <span className="text-xs text-slate-400"> ({c.stateCode})</span>}
                </span>
                                {selectedCity?.cityId === c.cityId && <Check className="w-4 h-4 text-[#0454E8]" />}
                            </button>
                        ))}
                        {!citiesLoading && filteredCities.length === 0 && (
                            <div className={empty}>{t('hotelNoCityFound')}</div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}