// src/components/Flights/AllDestinationModal.tsx
import { useEffect, useMemo, useState } from 'react';
import { X, Loader2, MapPin } from 'lucide-react';
import { getAggregatedDestinations, AggregatedDestination } from '@/service/flights_aggregator/aggregatedSearch.service';
import { FALLBACK_AIRPORTS } from '@/service/flights/airports';
import type { Airport } from '@/service/flights/airports';
import { useLanguage } from '@/i18n/LanguageContext';

interface Props {
    open: boolean;
    onClose: () => void;
    onSelect?: (code: string, airport?: Airport) => void;
}

const airportByCode = new Map<string, Airport>(
    FALLBACK_AIRPORTS.map((a) => [a.code, a])
);

export default function AllDestinationsModal({ open, onClose, onSelect }: Props) {
    const { t } = useLanguage();
    const [destinations, setDestinations] = useState<AggregatedDestination[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;
        if (destinations.length > 0) return;
        setLoading(true);
        setError(null);
        getAggregatedDestinations()
            .then(setDestinations)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [open]);

    // reset selection each time the modal opens fresh
    useEffect(() => {
        if (open) setSelectedCountry(null);
    }, [open]);




    const grouped = useMemo(() => {
        const groups = new Map<string, Airport[]>();
        const unresolved: string[] = [];

        for (const dest of destinations) {
            const meta = airportByCode.get(dest.code);
            if (!meta?.country) {
                unresolved.push(dest.code);
                continue;
            }
            if (!groups.has(meta.country)) groups.set(meta.country, []);
            groups.get(meta.country)!.push(meta);
        }

        // surface unresolved codes as bare-code entries under one bucket,
        // so nothing is silently hidden — just displayed with less detail
        if (unresolved.length > 0) {
            groups.set(
                t('destinationOther'),
                unresolved.map((code) => ({ code, city: code, name: '', country: t('destinationOther') } as Airport))
            );
        }

        return groups;
    }, [destinations, t]);

    const countries = useMemo(
        () => Array.from(grouped.keys()).sort((a, b) => a.localeCompare(b)),
        [grouped]
    );

    const filteredCountries = useMemo(() => {
        if (!search.trim()) return countries;
        const q = search.toLowerCase();
        return countries.filter((c) => {
            if (c.toLowerCase().includes(q)) return true;
            return (grouped.get(c) ?? []).some(
                (a) => a.code.toLowerCase().includes(q) || a.city.toLowerCase().includes(q)
            );
        });
    }, [countries, grouped, search]);

    const airportsForSelected = selectedCountry ? grouped.get(selectedCountry) ?? [] : [];
    // Apply the same search term to the right-side airport list, so typing a
    // code/city narrows both columns together instead of only the country list.
    const filteredAirportsForSelected = useMemo(() => {
        if (!search.trim()) return airportsForSelected;
        const q = search.toLowerCase();
        return airportsForSelected.filter(
            (a) =>
                a.code.toLowerCase().includes(q) ||
                a.city?.toLowerCase().includes(q) ||
                a.name?.toLowerCase().includes(q)
        );
    }, [airportsForSelected, search]);

    useEffect(() => {
        if (search.trim() && filteredCountries.length > 0) {
            setSelectedCountry(filteredCountries[0]);
        }
    }, [search, filteredCountries]);

    if (!open) return null;

    return (
        // Fixed, full-viewport overlay — z-[100] to sit above everything else,
        // including any header/nav that might otherwise clip it.
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Dark header bar */}
                <div className="bg-[#1A202C] text-white px-5 py-4 flex items-center justify-between shrink-0">
                    <span className="text-sm">{t('destinationPickerIntro')}</span>
                    <button type="button" onClick={onClose} className="text-white/70 hover:text-white shrink-0 ml-4">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search */}
                <div className="px-5 py-3 border-b border-slate-100 shrink-0">
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t('destinationSearchPlaceholder')}
                        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-[#3D8BF0]"
                    />
                </div>

                {loading && (
                    <div className="flex-1 flex items-center justify-center gap-2 text-slate-500 py-16">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {t('destinationLoading')}
                    </div>
                )}

                {error && (
                    <div className="flex-1 text-red-600 text-sm py-8 text-center">{t('destinationError')} {error}</div>
                )}

                {!loading && !error && (
                    <div className="flex-1 flex min-h-0">
                        {/* Column 1: countries */}
                        <div className="w-1/2 border-r border-slate-100 flex flex-col min-h-0">
                            <div className="px-5 py-2 text-xs font-semibold text-slate-500 shrink-0">
                                🌐 {t('destinationCountries')} ({filteredCountries.length})
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                {filteredCountries.map((country) => (
                                    <button
                                        type="button"
                                        key={country}
                                        onClick={() => setSelectedCountry(country)}
                                        className={`w-full flex items-center justify-between text-left px-5 py-2.5 text-sm transition-colors ${
                                            selectedCountry === country
                                                ? 'bg-[#3D8BF0] text-white font-semibold'
                                                : 'hover:bg-slate-50 text-slate-700'
                                        }`}
                                    >
                                        <span>{country}</span>
                                        <span className={selectedCountry === country ? 'text-white/70' : 'text-slate-400'}>
                      {grouped.get(country)?.length}
                    </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Column 2: airports for the selected country — opens on click, like TK's picker */}
                        <div className="px-5 py-2 text-xs font-semibold text-slate-500 shrink-0">
                            ✈️ {t('destinationAirports')} ({filteredAirportsForSelected.length})
                        </div>
                        <div className="flex-1 overflow-y-auto px-2 pb-4">
                            {!selectedCountry && (
                                <div className="text-slate-400 text-sm px-3 py-6">{t('destinationChooseCountry')}</div>
                            )}
                            {filteredAirportsForSelected.map((airport) => (
                                <button
                                    type="button"
                                    key={airport.code}
                                    onClick={() => { onSelect?.(airport.code, airport); onClose(); }}
                                    className="w-full flex items-center gap-2 text-left px-3 py-2.5 rounded-lg hover:bg-[#FFF9F0] text-sm"
                                >
                                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <div className="min-w-0">
                                        <div className="text-slate-800 font-medium truncate">{airport.city}</div>
                                        <div className="text-xs text-slate-400 truncate">{airport.name}</div>
                                    </div>
                                    <span className="ml-auto px-1.5 py-0.5 rounded bg-[#F5A623]/15 text-[#F5A623] text-[10px] font-bold shrink-0">
        {airport.code}
      </span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}