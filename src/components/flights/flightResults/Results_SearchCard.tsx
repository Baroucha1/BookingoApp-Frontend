import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
    ArrowLeftRight, Calendar, MapPin, Search,
    Loader2, Users, Clock, Plus, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button.tsx';
import PassengerClassSelector from '@/components/flights/PassengerClassSelector.tsx';
import type { AggregatedSearchParams, CabinClass } from '@/service/flights_aggregator/aggregatedTypes.ts';
import { searchAirports, searchAirportsFallback, FALLBACK_AIRPORTS } from '@/service/flights/airports.ts';
import type { Airport } from '@/service/flights/airports.ts';
import { cn } from '@/lib/utils.ts';
import { getAggregatedDestinations, AggregatedDestination } from '@/service/flights_aggregator/aggregatedSearch.service.ts';
import AllDestinationsModal from '@/components/flights/AllDestinationModal.tsx';
import {
    toLocalISO, today, addMonths, buildMonthDays,
    emptyLeg, defaultForm, RECENT_KEY, getRecentAirports, saveRecentAirport,
    getDayState,
} from '../search/SearchFormUtils.ts';
import type {  DayState } from '../search/SearchFormUtils.ts';
import { AirportInputProps } from "@/components/flights/search/SearchFormShared.tsx";
import { useToast } from '@/hooks/use-toast.ts';
import { useLanguage } from '@/i18n/LanguageContext.tsx';

const cardTexts = {
    fr: {
        from: "Départ",
        to: "Destination",
        fromPlaceholder: "D'où ?",
        toPlaceholder: "Où ?",
        dates: "Dates",
        date: "Date",
        returnDate: "Retour",
        passengersClass: "Passagers / Classe",
        passengers: "passager",
        passengersPlural: "passagers",
        search: "Rechercher un vol",
        searching: "Recherche...",
        addFlight: "Ajouter un vol",
        notAvailable: "Non disponible",
        originRequired: "Aéroport de départ obligatoire",
        destRequired: "Aéroport de destination obligatoire",
        sameAirportError: "Le départ et la destination doivent être différents",
        departDateRequired: "Date de départ obligatoire",
        returnDateRequired: "Date de retour obligatoire",
        multiCityError: "Veuillez compléter toutes les étapes",
        searchErrorTitle: "Recherche incomplète",
    },
    en: {
        from: "Departure",
        to: "Destination",
        fromPlaceholder: "Where from?",
        toPlaceholder: "Where to?",
        dates: "Dates",
        date: "Date",
        returnDate: "Return",
        passengersClass: "Passengers / Class",
        passengers: "passenger",
        passengersPlural: "passengers",
        search: "Search flights",
        searching: "Searching...",
        addFlight: "Add a flight",
        notAvailable: "Not available",
        originRequired: "Departure airport is required",
        destRequired: "Destination airport is required",
        sameAirportError: "Departure and destination must be different",
        departDateRequired: "Departure date is required",
        returnDateRequired: "Return date is required",
        multiCityError: "Please complete all flight legs",
        searchErrorTitle: "Incomplete search",
    },
    ar: {
        from: "المغادرة",
        to: "الوجهة",
        fromPlaceholder: "من أين؟",
        toPlaceholder: "إلى أين؟",
        dates: "التواريخ",
        date: "التاريخ",
        returnDate: "العودة",
        passengersClass: "المسافرون / الدرجة",
        passengers: "مسافر",
        passengersPlural: "مسافرين",
        search: "بحث عن رحلة",
        searching: "جاري البحث...",
        addFlight: "إضافة رحلة",
        notAvailable: "غير متاح",
        originRequired: "مطار المغادرة إجباري",
        destRequired: "مطار الوصول إجباري",
        sameAirportError: "يجب أن يكون مطار المغادرة مختلفاً عن الوصول",
        departDateRequired: "تاريخ المغادرة إجباري",
        returnDateRequired: "تاريخ العودة إجباري",
        multiCityError: "يرجى إكمال جميع مراحل الرحلة",
        searchErrorTitle: "بحث غير مكتمل",
    },
};

interface Props {
    onSubmit: (p: AggregatedSearchParams) => void;
    loading?: boolean;
    initialParams?: AggregatedSearchParams | null;
    
}

interface Leg {
    origin: string;
    destination: string;
    date: string;
    originAirport?: Airport | null;
    destinationAirport?: Airport | null;
}

interface FormState {
    tripType: 'oneway' | 'roundtrip' | 'multicity';
    departVol1: string;
    destinationVol1: string;
    departleVol1: string;
    retourleVol1: string;
    legs: Leg[];
    qteADT: number;
    qteCHD: number;
    qteINF: number;
    classe: CabinClass;
}

function paramsToFormState(params: AggregatedSearchParams): FormState {
    if (params.legs?.length) {
        return {
            tripType: 'multicity',
            departVol1: '',
            destinationVol1: '',
            departleVol1: today,
            retourleVol1: '',
            legs: params.legs.map((l) => ({ origin: l.origin, destination: l.destination, date: l.date })),
            qteADT: params.adults ?? 1,
            qteCHD: params.children ?? 0,
            qteINF: params.infants ?? 0,
            classe: (params.cabinClass as CabinClass) ?? 'Y',
        };
    }
    return {
        tripType: params.returnDate ? 'roundtrip' : 'oneway',
        departVol1: params.origin ?? '',
        destinationVol1: params.destination ?? '',
        departleVol1: params.date ?? today,
        retourleVol1: params.returnDate ?? '',
        legs: [emptyLeg()],
        qteADT: params.adults ?? 1,
        qteCHD: params.children ?? 0,
        qteINF: params.infants ?? 0,
        classe: (params.cabinClass as CabinClass) ?? 'Y',
    };
}

export interface AirportInputHandle {
    focus: () => void;
}

/** Compact inline field: small uppercase label + value, no border/box */
function InlineField({ label, children, className, onClick, required, error }: {
    label: string; children: React.ReactNode; className?: string; onClick?: () => void;
    required?: boolean; error?: boolean | string;
}) {
    return (
        <div onClick={onClick} className={cn('min-w-0', onClick && 'cursor-pointer', className)}>
            <div className="flex items-center justify-between gap-1 mb-0.5">
                <div className="text-[10px] uppercase tracking-wide text-[#94A3B8] font-medium flex items-center gap-1">
                    <span>{label}</span>
                    {required && <span className="text-red-500 font-bold" title="Obligatoire">*</span>}
                </div>
                {typeof error === 'string' && error && (
                    <span className="text-[9px] font-semibold text-red-500 truncate max-w-[120px]">{error}</span>
                )}
            </div>
            <div className={cn(
                "transition-all duration-150 rounded-lg",
                error && "ring-1 ring-red-400 bg-red-50/50 p-1 -m-1"
            )}>
                {children}
            </div>
        </div>
    );
}

const AirportInput = forwardRef<AirportInputHandle, AirportInputProps>(function AirportInput(
    { value, onChange, placeholder, selectedAirport, onShowAllDestinations }, ref
) {
    const [query, setQuery] = useState(value);
    const [suggestions, setSuggestions] = useState<Airport[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const wrapRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
        focus: () => inputRef.current?.focus(),
    }));

    useEffect(() => { setQuery(value); }, [value]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const fetchAirports = useCallback(async (kw: string) => {
        if (kw.length < 2) { setSuggestions([]); setOpen(false); return; }
        setLoading(true);
        try {
            let results = await searchAirports(kw);
            if (!results.length) results = searchAirportsFallback(kw);
            setSuggestions(results);
            setOpen(results.length > 0);
        } catch {
            setSuggestions(searchAirportsFallback(kw));
            setOpen(true);
        } finally {
            setLoading(false);
        }
    }, []);

    const showDefaults = () => {
        if (query.length >= 2) return;
        const recents = getRecentAirports();
        const defaults = FALLBACK_AIRPORTS.filter((a) => a.country === 'Algérie').slice(0, 15);
        setSuggestions([...recents, ...defaults.filter((a) => !recents.find((r) => r.code === a.code))]);
        setOpen(true);
    };

    const handleChange = (val: string) => {
        const upper = val.toUpperCase();
        setQuery(upper);
        onChange(upper, undefined);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchAirports(val), 300);
    };

    const handleSelect = (a: Airport) => {
        setQuery(a.code);
        onChange(a.code, a);
        saveRecentAirport(a);
        setSuggestions([]);
        setOpen(false);
    };

    return (
        <div ref={wrapRef} className="relative">
            {selectedAirport ? (
                <button type="button" onClick={() => { onChange('', undefined); setQuery(''); }} className="text-left block w-full min-w-0">
                    <div className="font-bold text-[#0454E8] text-sm leading-tight truncate">
                        {selectedAirport.city} <span className="text-[#94A3B8] font-normal">({selectedAirport.code})</span>
                    </div>
                    <div className="text-[11px] text-[#64748B] truncate">{selectedAirport.name.split(' ').slice(0, 1)[0] ?? selectedAirport.country}</div>
                </button>
            ) : (
                <div className="relative">
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={(e) => handleChange(e.target.value)}
                        onFocus={() => { if (suggestions.length > 0) setOpen(true); else showDefaults(); }}
                        placeholder={placeholder}
                        className="w-full bg-transparent border-none outline-none text-[#0B0F2E] placeholder:text-gray-400 text-sm font-semibold p-0"
                    />
                    {loading && <Loader2 className="absolute right-0 top-0 w-3.5 h-3.5 text-[#F5A623] animate-spin" />}
                </div>
            )}
            {open && (
                <div className="absolute z-50 left-0 w-[280px] mt-2 bg-white border border-[#E2E8F0] rounded-2xl shadow-2xl max-h-72 overflow-y-auto">
                    {suggestions.map((a) => (
                        <button key={a.code} type="button"
                                onMouseDown={(e) => { e.preventDefault(); handleSelect(a); }}
                                onTouchEnd={(e) => { e.preventDefault(); handleSelect(a); }}
                                className="w-full px-4 py-3 hover:bg-[#FFF9F0] active:bg-[#FFF3E0] flex items-center justify-between gap-3 text-left border-b border-[#F1F5F9] last:border-0 transition">
                            <div className="flex items-center gap-3 min-w-0">
                                {getRecentAirports().find((r) => r.code === a.code) && <Clock className="w-4 h-4 text-[#3D8BF0] shrink-0" />}
                                <MapPin className="w-4 h-4 text-[#A0AEC0] shrink-0" />
                                <div className="min-w-0">
                                    <div className="font-semibold text-[#1A202C] text-sm">{a.city}, <span className="font-normal text-[#4A5568]">{a.country}</span></div>
                                    <div className="text-xs text-[#A0AEC0] truncate">{a.name}</div>
                                </div>
                            </div>
                            <span className="shrink-0 px-2 py-0.5 rounded-md bg-[#F5A623]/15 text-[#F5A623] text-xs font-bold tracking-wider">{a.code}</span>
                        </button>
                    ))}
                    {onShowAllDestinations && (
                        <button
                            type="button"
                            onMouseDown={(e) => { e.preventDefault(); onShowAllDestinations(); setOpen(false); }}
                            onTouchEnd={(e) => { e.preventDefault(); onShowAllDestinations(); setOpen(false); }}
                            className="w-full px-4 py-3 flex items-center gap-2 text-left text-sm font-medium text-[#3D8BF0] hover:bg-[#FFF9F0] active:bg-[#FFF3E0] transition"
                        >
                            🌐 Voir toutes les destinations
                        </button>
                    )}
                </div>
            )}
        </div>
    );
});

function SingleDatePicker({value, onChange, onClose, minDate,}: { value: string; onChange: (v: string) => void; onClose: () => void; minDate?: string }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const floor = minDate ? new Date(minDate + 'T00:00:00') : today;

    const initialMonth = value ? new Date(value + 'T00:00:00') : new Date();
    initialMonth.setDate(1);

    const [month, setMonth] = useState(new Date(initialMonth));
    const prevMonth = () => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1));
    const nextMonth = () => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1));

    const toISO = toLocalISO;
    const selected = value ? new Date(value + 'T00:00:00') : null;

    const year = month.getFullYear();
    const m = month.getMonth();
    const firstDay = new Date(year, m, 1).getDay();
    const startOffset = (firstDay + 6) % 7;
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    const monthName = month.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    const days: (Date | null)[] = Array(startOffset).fill(null);

    for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, m, d));

    return (
        <div className="p-4 w-[320px]">
            <div className="flex items-center justify-between mb-3 px-1">
                <button type="button" onClick={prevMonth}
                        className="w-7 h-7 rounded-full hover:bg-[#F1F5F9] flex items-center justify-center text-[#64748B] transition-colors">‹</button>
                <span className="text-sm font-semibold text-[#0B0F2E] capitalize">{monthName}</span>
                <button type="button" onClick={nextMonth}
                        className="w-7 h-7 rounded-full hover:bg-[#F1F5F9] flex items-center justify-center text-[#64748B] transition-colors">›</button>
            </div>
            <div className="grid grid-cols-7 mb-1">
                {['lu', 'ma', 'me', 'je', 've', 'sa', 'di'].map((d) => (
                    <div key={d} className="text-center text-[10px] text-[#94A3B8] font-medium py-1">{d}</div>
                ))}
            </div>
            <div className="grid grid-cols-7">
                {days.map((date, idx) => {
                    if (!date) return <div key={`e-${idx}`} />;
                    const isPast = date < floor;
                    const isSelected = selected && toISO(date) === toISO(selected);
                    const isToday = toISO(date) === toISO(today);
                    return (
                        <button
                            key={date.toISOString()}
                            type="button"
                            disabled={isPast}
                            onClick={() => { onChange(toISO(date)); onClose(); }}
                            className={cn(
                                'relative h-8 text-sm transition-colors flex items-center justify-center',
                                isPast && 'text-[#CBD5E1] cursor-not-allowed',
                                !isPast && !isSelected && 'hover:bg-[#FFF9F0] hover:text-[#F5A623] rounded-full text-[#0B0F2E]',
                                isSelected && 'bg-[#F5A623] text-white rounded-full font-semibold',
                                isToday && !isSelected && 'font-bold text-[#3D8BF0]',
                            )}
                        >
                            {date.getDate()}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function DateField({ value, onChange, label = 'Départ', minDate, align = 'left', required, error }: {
    value: string;
    onChange: (v: string) => void;
    label?: string;
    minDate?: string;
    align?: 'left' | 'right';
    required?: boolean;
    error?: boolean | string;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const fmtDate = (v: string) =>
        v ? new Date(v + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
    const fmtDay = (v: string) =>
        v ? new Date(v + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long' }) : 'Modifier';

    return (
        <div ref={ref} className="relative">
            <InlineField label={label} onClick={() => setOpen((v) => !v)} required={required} error={error}>
                <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#F5A623] shrink-0" />
                    <span className="font-bold text-[#0B0F2E] text-sm whitespace-nowrap">{fmtDate(value)}</span>
                </div>
                <div className="text-[11px] text-[#3D8BF0] mt-0.5 capitalize">{fmtDay(value)}</div>
            </InlineField>
            {open && (
                <div className={cn(
                    'absolute z-50 w-[320px] mt-2 bg-white border border-[#E2E8F0] rounded-lg shadow-2xl',
                    align === 'right' ? 'right-0' : 'left-0'
                )}>
                    <SingleDatePicker value={value} onChange={onChange} onClose={() => setOpen(false)} minDate={minDate} />
                </div>
            )}
        </div>
    );
}

/** Dual-month calendar used for the main origin/destination date picker (single or range mode) */
function DualCalendar({
                          mode, startDate, endDate, onSelectStart, onSelectEnd, onClose,
                      }: {
    mode: 'single' | 'range';
    startDate: string;
    endDate?: string;
    onSelectStart: (v: string) => void;
    onSelectEnd?: (v: string) => void;
    onClose: () => void;
}) {
    const toISO = toLocalISO;
    const todayFloor = new Date();
    todayFloor.setHours(0, 0, 0, 0);

    const initial = startDate ? new Date(startDate + 'T00:00:00') : new Date();
    const [viewMonth, setViewMonth] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1));
    const [pickingEnd, setPickingEnd] = useState(mode === 'range' && !!startDate && !endDate);

    const start = startDate ? new Date(startDate + 'T00:00:00') : null;
    const end = mode === 'range' && endDate ? new Date(endDate + 'T00:00:00') : null;

    const leftMonth = viewMonth;
    const rightMonth = addMonths(viewMonth, 1);

    const handlePick = (date: Date) => {
        const iso = toISO(date);
        if (mode === 'single') {
            onSelectStart(iso);
            onClose();
            return;
        }
        if (!pickingEnd || (start && date < start)) {
            onSelectStart(iso);
            setPickingEnd(true);
        } else {
            onSelectEnd?.(iso);
            setPickingEnd(false);
            onClose();
        }
    };

    const renderMonth = (month: Date, showBack: boolean, showForward: boolean) => {
        const days = buildMonthDays(month);
        const monthName = month.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

        return (
            <div className="w-[280px]">
                <div className="flex items-center justify-between mb-3 px-1">
                    {showBack ? (
                        <div className="flex items-center gap-1">
                            <button type="button" onClick={() => setViewMonth(addMonths(viewMonth, -12))}
                                    className="w-6 h-6 rounded-full hover:bg-[#F1F5F9] flex items-center justify-center text-[#64748B] text-xs">«</button>
                            <button type="button" onClick={() => setViewMonth(addMonths(viewMonth, -1))}
                                    className="w-6 h-6 rounded-full hover:bg-[#F1F5F9] flex items-center justify-center text-[#64748B]">‹</button>
                        </div>
                    ) : <div className="w-12" />}
                    <span className="text-sm font-semibold text-[#0B0F2E] capitalize">{monthName}</span>
                    {showForward ? (
                        <div className="flex items-center gap-1">
                            <button type="button" onClick={() => setViewMonth(addMonths(viewMonth, 1))}
                                    className="w-6 h-6 rounded-full hover:bg-[#F1F5F9] flex items-center justify-center text-[#64748B]">›</button>
                            <button type="button" onClick={() => setViewMonth(addMonths(viewMonth, 12))}
                                    className="w-6 h-6 rounded-full hover:bg-[#F1F5F9] flex items-center justify-center text-[#64748B] text-xs">»</button>
                        </div>
                    ) : <div className="w-12" />}
                </div>
                <div className="grid grid-cols-7 mb-1">
                    {['lu', 'ma', 'me', 'je', 've', 'sa', 'di'].map((d) => (
                        <div key={d} className="text-center text-[10px] text-[#94A3B8] font-medium py-1">{d}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7">
                    {days.map((date, idx) => {
                        if (!date) return <div key={`e-${idx}`} />;
                        const floor = mode === 'range' && pickingEnd && start ? start : todayFloor;
                        const isPast = date < floor;
                        const isStart = !!(start && toISO(date) === toISO(start));
                        const isEnd = !!(end && toISO(date) === toISO(end));
                        const inRange = !!(start && end && date > start && date < end);
                        const isToday = toISO(date) === toISO(todayFloor);
                        return (
                            <button
                                key={date.toISOString()}
                                type="button"
                                disabled={isPast}
                                onClick={() => handlePick(date)}
                                className={cn(
                                    'relative h-8 text-sm transition-colors flex items-center justify-center',
                                    isPast && 'text-[#CBD5E1] cursor-not-allowed',
                                    !isPast && !isStart && !isEnd && !inRange && 'hover:bg-[#FFF9F0] hover:text-[#F5A623] rounded-full text-[#0B0F2E]',
                                    inRange && 'bg-[#EFF6FF] text-[#0454E8]',
                                    (isStart || isEnd) && 'bg-[#0454E8] text-white rounded-full font-semibold',
                                    isToday && !isStart && !isEnd && 'font-bold text-[#3D8BF0]',
                                )}
                            >
                                {date.getDate()}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="flex items-start gap-6 p-4 bg-white border border-[#E2E8F0] rounded-xl shadow-2xl">
            {renderMonth(leftMonth, true, false)}
            {renderMonth(rightMonth, false, true)}
        </div>
    );
}

/** Combined trigger for Départ (+ Retour when roundtrip) — opens the DualCalendar popover */
function DateRangeTrigger({
                              tripType, startDate, endDate, open, onOpenChange, onChangeStart, onChangeEnd,
                              departLabel = 'Départ', returnLabel = 'Retour',
                              departRequired, returnRequired, departError, returnError,
                          }: {
    tripType: FormState['tripType'];
    startDate: string;
    endDate: string;
    open: boolean;
    onOpenChange: (o: boolean) => void;
    onChangeStart: (v: string) => void;
    onChangeEnd: (v: string) => void;
    departLabel?: string;
    returnLabel?: string;
    departRequired?: boolean;
    returnRequired?: boolean;
    departError?: boolean | string;
    returnError?: boolean | string;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const isRange = tripType === 'roundtrip';

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) onOpenChange(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [onOpenChange]);

    const fmtDate = (v: string) =>
        v ? new Date(v + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
    const fmtDay = (v: string) =>
        v ? new Date(v + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long' }) : '';

    return (
        <div ref={ref} className="relative flex items-center gap-4">
            <div className={cn("cursor-pointer rounded-lg transition-all", departError && "ring-1 ring-red-400 bg-red-50/50 p-1 -m-1")} onClick={() => onOpenChange(!open)}>
                <div className="flex items-center justify-between gap-1 mb-0.5">
                    <div className="text-[10px] uppercase tracking-wide text-[#94A3B8] font-medium flex items-center gap-1">
                        <span>{departLabel}</span>
                        {departRequired && <span className="text-red-500 font-bold" title="Obligatoire">*</span>}
                    </div>
                    {typeof departError === 'string' && departError && (
                        <span className="text-[9px] font-semibold text-red-500 truncate max-w-[120px]">{departError}</span>
                    )}
                </div>
                <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#F5A623] shrink-0" />
                    <span className="font-bold text-[#0B0F2E] text-sm whitespace-nowrap">{fmtDate(startDate)}</span>
                </div>
                <div className="text-[11px] text-[#3D8BF0] mt-0.5 capitalize">{fmtDay(startDate)}</div>
            </div>

            {isRange && (
                <>
                    <div className="w-px h-9 border-l border-dashed border-[#3D8BF0]/40 shrink-0" />
                    <div className={cn("cursor-pointer rounded-lg transition-all", returnError && "ring-1 ring-red-400 bg-red-50/50 p-1 -m-1")} onClick={() => onOpenChange(!open)}>
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                            <div className="text-[10px] uppercase tracking-wide text-[#94A3B8] font-medium flex items-center gap-1">
                                <span>{returnLabel}</span>
                                {returnRequired && <span className="text-red-500 font-bold" title="Obligatoire">*</span>}
                            </div>
                            {typeof returnError === 'string' && returnError && (
                                <span className="text-[9px] font-semibold text-red-500 truncate max-w-[120px]">{returnError}</span>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-[#F5A623] shrink-0" />
                            <span className="font-bold text-[#0B0F2E] text-sm whitespace-nowrap">{fmtDate(endDate)}</span>
                        </div>
                        <div className="text-[11px] text-[#3D8BF0] mt-0.5 capitalize">{fmtDay(endDate)}</div>
                    </div>
                </>
            )}

            {open && (
                <div className="absolute z-50 left-0 top-full mt-2">
                    <DualCalendar
                        mode={isRange ? 'range' : 'single'}
                        startDate={startDate}
                        endDate={isRange ? endDate : undefined}
                        onSelectStart={onChangeStart}
                        onSelectEnd={onChangeEnd}
                        onClose={() => onOpenChange(false)}
                    />
                </div>
            )}
        </div>
    );
}

function TripTypeToggle({ value, onChange }: { value: FormState['tripType']; onChange: (v: FormState['tripType']) => void }) {
    const options: { key: FormState['tripType']; label: string }[] = [
        { key: 'oneway', label: 'Aller simple' },
        { key: 'roundtrip', label: 'Aller retour' },
        { key: 'multicity', label: 'Multi destinations' },
    ];
    return (
        <div className="flex items-center gap-5">
            {options.map((o) => (
                <button
                    key={o.key}
                    type="button"
                    onClick={() => onChange(o.key)}
                    className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all',
                        value === o.key
                            ? 'bg-[#1775FF] text-white shadow-sm shadow-blue-500/20'
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    )}
                >
                    <span
                        className={cn(
                            'w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-colors',
                            value === o.key ? 'border-white' : 'border-[#CBD5E1]'
                        )}
                    >
                        {value === o.key && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                    <span>{o.label}</span>
                </button>
            ))}
        </div>
    );
}

export default function AggregatedSearchForm({ onSubmit, loading, initialParams }: Props)  {
    const [depAirport, setDepAirport] = useState<Airport | null>(null);
    const [destAirport, setDestAirport] = useState<Airport | null>(null);
    const [destinations, setDestinations] = useState<AggregatedDestination[]>([]);
    const [destinationsLoading, setDestinationsLoading] = useState(true);
    const [showAllDestinations, setShowAllDestinations] = useState(false);
    const [destinationPickerTarget, setDestinationPickerTarget] = useState<'origin' | 'destination'>('destination');
    const [p, setP] = useState<FormState>(() =>
        initialParams ? paramsToFormState(initialParams) : defaultForm
    );

    const destInputRef = useRef<AirportInputHandle>(null);
    const [dateOpen, setDateOpen] = useState(false);

    const updateLeg = (index: number, patch: Partial<Leg>) => {
        setP((prev) => {
            const legs = [...prev.legs];
            legs[index] = { ...legs[index], ...patch };

            if (patch.destination !== undefined && legs[index + 1]) {
                const nextLeg = legs[index + 1];
                const wasAutoFilled = !nextLeg.origin || nextLeg.origin === prev.legs[index].destination;
                if (wasAutoFilled) {
                    legs[index + 1] = { ...nextLeg, origin: patch.destination, originAirport: legs[index].destinationAirport ?? null };
                }
            }

            return { ...prev, legs };
        });
    };

    const addLeg = () => {
        setP((prev) => {
            if (prev.legs.length >= 6) return prev;
            const lastLeg = prev.legs[prev.legs.length - 1];
            const newLeg: Leg = {
                origin: lastLeg?.destination ?? '',
                originAirport: lastLeg?.destinationAirport ?? null,
                destination: '',
                date: lastLeg?.date ?? today,
            };
            return { ...prev, legs: [...prev.legs, newLeg] };
        });
    };

    const removeLeg = (index: number) => {
        setP((prev) => {
            if (prev.legs.length <= 1) return prev;
            return { ...prev, legs: prev.legs.filter((_, i) => i !== index) };
        });
    };

    const { toast } = useToast();
    const { language } = useLanguage();
    const t = cardTexts[language] || cardTexts.fr;
    const [attemptedSubmit, setAttemptedSubmit] = useState(false);

    const originMissing = p.tripType !== 'multicity' && !p.departVol1?.trim();
    const destMissing = p.tripType !== 'multicity' && !p.destinationVol1?.trim();
    const sameAirport = p.tripType !== 'multicity' && !!p.departVol1 && !!p.destinationVol1 && p.departVol1.trim().toUpperCase() === p.destinationVol1.trim().toUpperCase();
    const departDateMissing = p.tripType !== 'multicity' && !p.departleVol1?.trim();
    const returnDateMissing = p.tripType === 'roundtrip' && !p.retourleVol1?.trim();
    const multiCityIncomplete =
        p.tripType === 'multicity' &&
        (p.legs.length < 2 || p.legs.some((leg) => !leg.origin?.trim() || !leg.destination?.trim() || !leg.date?.trim() || leg.origin.trim().toUpperCase() === leg.destination.trim().toUpperCase()));

    useEffect(() => {
        getAggregatedDestinations()
            .then(setDestinations)
            .catch((err) => console.error('Failed to load destinations:', err))
            .finally(() => setDestinationsLoading(false));
    }, []);

    const reachableFromOrigin = new Set(
        destinations
            .filter((d) => !p.departVol1 || d.origins.includes(p.departVol1))
            .map((d) => d.code)
    );

    const isDestinationSupported = (code: string) =>
        destinationsLoading || destinations.length === 0 || reachableFromOrigin.has(code);

    const update = (patch: Partial<FormState>) => setP((prev) => ({ ...prev, ...patch }));

    const swap = () => {
        update({ departVol1: p.destinationVol1, destinationVol1: p.departVol1 });
        const tmp = depAirport;
        setDepAirport(destAirport);
        setDestAirport(tmp);
    };

    const passengerLabel = () => {
        const total = p.qteADT + p.qteCHD + p.qteINF;
        const classeMap: Record<string, string> = { Y: 'Économique', C: 'Affaires', F: 'Première', W: 'Premium éco' };
        return { count: total, classe: classeMap[p.classe] ?? p.classe };
    };

    const passengerError =
        p.qteINF > p.qteADT
            ? "Le nombre de bébés ne peut pas dépasser le nombre d'adultes (un bébé par adulte)."
            : null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setAttemptedSubmit(true);

        if (originMissing) {
            toast({ title: t.searchErrorTitle, description: t.originRequired, variant: 'destructive' });
            return;
        }
        if (destMissing) {
            toast({ title: t.searchErrorTitle, description: t.destRequired, variant: 'destructive' });
            return;
        }
        if (sameAirport) {
            toast({ title: t.searchErrorTitle, description: t.sameAirportError, variant: 'destructive' });
            return;
        }
        if (departDateMissing) {
            toast({ title: t.searchErrorTitle, description: t.departDateRequired, variant: 'destructive' });
            return;
        }
        if (returnDateMissing) {
            toast({ title: t.searchErrorTitle, description: t.returnDateRequired, variant: 'destructive' });
            return;
        }
        if (multiCityIncomplete) {
            toast({ title: t.searchErrorTitle, description: t.multiCityError, variant: 'destructive' });
            return;
        }
        if (passengerError) {
            toast({ title: t.searchErrorTitle, description: passengerError, variant: 'destructive' });
            return;
        }

        if (p.tripType === 'multicity') {
            onSubmit({
                legs: p.legs.map(({ origin, destination, date }) => ({ origin, destination, date })),
                origin: p.legs[0].origin,
                destination: p.legs[p.legs.length - 1].destination,
                date: p.legs[0].date,
                adults: p.qteADT,
                children: p.qteCHD,
                infants: p.qteINF,
                cabinClass: p.classe,
            });
        } else {
            onSubmit({
                origin: p.departVol1,
                destination: p.destinationVol1,
                date: p.departleVol1,
                returnDate: p.tripType === 'roundtrip' ? p.retourleVol1 : undefined,
                adults: p.qteADT,
                children: p.qteCHD,
                infants: p.qteINF,
                cabinClass: p.classe,
            });
        }
    };

    const { count, classe } = passengerLabel();
    useEffect(() => {
        if (!initialParams || initialParams.legs?.length) return; // skip for multicity for now

        const resolve = async (code: string): Promise<Airport | null> => {
            if (!code) return null;
            const fromFallback = FALLBACK_AIRPORTS.find((a) => a.code === code);
            if (fromFallback) return fromFallback;
            try {
                const results = await searchAirports(code);
                return results.find((a) => a.code === code) ?? null;
            } catch {
                return null;
            }
        };

        if (initialParams.origin) {
            resolve(initialParams.origin).then((a) => { if (a) setDepAirport(a); });
        }
        if (initialParams.destination) {
            resolve(initialParams.destination).then((a) => { if (a) setDestAirport(a); });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    return (
        <form onSubmit={handleSubmit} className="w-full max-w-6xl mx-auto">
            <AllDestinationsModal
                open={showAllDestinations}
                onClose={() => setShowAllDestinations(false)}
                onSelect={(code, airport) => {
                    if (destinationPickerTarget === 'origin') {
                        update({ departVol1: code });
                        setDepAirport(airport ?? null);
                    } else {
                        update({ destinationVol1: code });
                        setDestAirport(airport ?? null);
                    }
                }}
            />
            <div className="bg-white rounded-xl shadow-md px-3 py-2">
                <div className="mb-3">
                    <TripTypeToggle value={p.tripType} onChange={(v) => update({ tripType: v })} />
                </div>

                {p.tripType === 'multicity' ? (
                    <div className="space-y-2">
                        {p.legs.map((leg, i) => {
                            const legOriginMissing = !leg.origin?.trim();
                            const legDestMissing = !leg.destination?.trim();
                            const legSameAirport = !!leg.origin && !!leg.destination && leg.origin.trim().toUpperCase() === leg.destination.trim().toUpperCase();
                            const legDateMissing = !leg.date?.trim();

                            return (
                                <div key={i} className="flex items-center gap-4 flex-wrap py-2 border-b border-slate-100 last:border-0">
                                    <InlineField
                                        label={`${t.from} ${i + 1}`}
                                        className="w-32"
                                        required
                                        error={attemptedSubmit && (legOriginMissing ? t.originRequired : legSameAirport ? t.sameAirportError : undefined)}
                                    >
                                        <AirportInput
                                            value={leg.origin}
                                            selectedAirport={leg.originAirport ?? null}
                                            onChange={(code, a) => updateLeg(i, { origin: code, originAirport: a ?? null })}
                                            placeholder={t.fromPlaceholder}
                                        />
                                    </InlineField>

                                    <ArrowLeftRight className="w-3.5 h-3.5 text-[#CBD5E1] shrink-0" />

                                    <InlineField
                                        label={`${t.to} ${i + 1}`}
                                        className="w-32"
                                        required
                                        error={attemptedSubmit && (legDestMissing ? t.destRequired : legSameAirport ? t.sameAirportError : undefined)}
                                    >
                                        <AirportInput
                                            value={leg.destination}
                                            selectedAirport={leg.destinationAirport ?? null}
                                            onChange={(code, a) => updateLeg(i, { destination: code, destinationAirport: a ?? null })}
                                            placeholder={t.toPlaceholder}
                                        />
                                    </InlineField>

                                    <div className="w-36">
                                        <DateField
                                            label={`${t.date} ${i + 1}`}
                                            value={leg.date}
                                            onChange={(v) => updateLeg(i, { date: v })}
                                            minDate={i > 0 ? p.legs[i - 1].date : undefined}
                                            required
                                            error={attemptedSubmit && (legDateMissing ? t.departDateRequired : undefined)}
                                        />
                                    </div>

                                    {i === 0 ? (
                                        <div className="ml-auto">
                                            <PassengerClassSelector
                                                qteADT={p.qteADT} qteCHD={p.qteCHD} qteINF={p.qteINF} classe={p.classe}
                                                onChange={(n) => update(n)}
                                                trigger={
                                                    <InlineField label={t.passengersClass} onClick={() => {}} className="cursor-pointer">
                                                        <div className="flex items-center gap-1.5">
                                                            <Users className="w-3.5 h-3.5 text-[#94A3B8]" />
                                                            <span className="font-bold text-[#0B0F2E] text-sm whitespace-nowrap">
                                                                {count} {count > 1 ? t.passengersPlural : t.passengers}
                                                            </span>
                                                        </div>
                                                        <div className="text-[11px] text-[#3D8BF0] mt-0.5">{classe}</div>
                                                    </InlineField>
                                                }
                                            />
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => removeLeg(i)}
                                            className="ml-auto w-7 h-7 rounded-full bg-red-50 border border-red-100 text-red-400 hover:bg-red-100 flex items-center justify-center shrink-0 cursor-pointer"
                                            aria-label="Supprimer cette destination"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            );
                        })}

                        <div className="flex items-center justify-between pt-1">
                            {p.legs.length < 6 && (
                                <button
                                    type="button"
                                    onClick={addLeg}
                                    className="text-[#F5A623] text-xs flex items-center gap-1 hover:underline font-medium cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" /> {t.addFlight}
                                </button>
                            )}
                            <Button
                                type="submit"
                                disabled={loading}
                                className="h-9 px-5 bg-[#FFAA01] hover:bg-[#E09515] text-[#0B0F2E] font-bold text-sm rounded-lg cursor-pointer"
                            >
                                <Search className="w-3.5 h-3.5 mr-1.5" />
                                {loading ? t.searching : t.search}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>
                        {attemptedSubmit && sameAirport && (
                            <div className="w-full text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 font-medium mb-2">
                                {t.sameAirportError}
                            </div>
                        )}
                        <div className="flex items-center gap-4 flex-wrap">
                            <InlineField
                                label={t.from}
                                className="w-32"
                                required
                                error={attemptedSubmit && (originMissing ? t.originRequired : sameAirport ? t.sameAirportError : undefined)}
                            >
                                <AirportInput
                                    value={p.departVol1}
                                    selectedAirport={depAirport}
                                    onChange={(code, a) => {
                                        update({ departVol1: code });
                                        setDepAirport(a ?? null);
                                        if (a) {
                                            setTimeout(() => destInputRef.current?.focus(), 0);
                                        }
                                    }}
                                    placeholder={t.fromPlaceholder}
                                    onShowAllDestinations={() => { setDestinationPickerTarget('origin'); setShowAllDestinations(true); }}
                                />
                            </InlineField>

                            <button type="button" onClick={swap} aria-label="Inverser"
                                    className="w-7 h-7 rounded-full bg-[#F1F5F9] border border-[#0454E8] hover:bg-[#F5A623] hover:text-white hover:rotate-180 transition-all duration-300 flex items-center justify-center text-[#64748B] shrink-0 cursor-pointer">
                                <ArrowLeftRight className="w-3 h-3" />
                            </button>

                            <InlineField
                                label={t.to}
                                className="w-32"
                                required
                                error={attemptedSubmit && (destMissing ? t.destRequired : sameAirport ? t.sameAirportError : undefined)}
                            >
                                <AirportInput
                                    ref={destInputRef}
                                    value={p.destinationVol1}
                                    selectedAirport={destAirport}
                                    onChange={(code, a) => {
                                        update({ destinationVol1: code });
                                        setDestAirport(a ?? null);
                                        if (a) {
                                            setDateOpen(true);
                                        }
                                    }}
                                    placeholder={t.toPlaceholder}
                                    onShowAllDestinations={() => { setDestinationPickerTarget('destination'); setShowAllDestinations(true); }}
                                />
                                {p.destinationVol1 && !isDestinationSupported(p.destinationVol1) && (
                                    <div className="text-[10px] text-amber-600 mt-1 whitespace-nowrap">
                                        {t.notAvailable}
                                    </div>
                                )}
                            </InlineField>

                            <div className="w-px h-9 bg-dashed border-l border-dashed border-[#3D8BF0]/40 shrink-0" />

                            <DateRangeTrigger
                                tripType={p.tripType}
                                startDate={p.departleVol1}
                                endDate={p.retourleVol1}
                                open={dateOpen}
                                onOpenChange={setDateOpen}
                                departLabel={t.from}
                                returnLabel={t.returnDate}
                                departRequired
                                returnRequired={p.tripType === 'roundtrip'}
                                departError={attemptedSubmit && (departDateMissing ? t.departDateRequired : undefined)}
                                returnError={attemptedSubmit && (returnDateMissing ? t.returnDateRequired : undefined)}
                                onChangeStart={(v) => {
                                    const patch: Partial<FormState> = { departleVol1: v };
                                    if (p.tripType === 'roundtrip' && p.retourleVol1 && p.retourleVol1 < v) {
                                        patch.retourleVol1 = '';
                                    }
                                    update(patch);
                                }}
                                onChangeEnd={(v) => update({ retourleVol1: v })}
                            />

                            <div className="w-px h-9 bg-dashed border-l border-dashed border-[#3D8BF0]/40 shrink-0" />

                            <div>
                                <div className="text-[10px] uppercase tracking-wide text-[#94A3B8] font-medium mb-0.5">
                                    {t.passengersClass}
                                </div>
                                <div className="[&>button]:!border-none [&>button]:!bg-transparent [&>button]:!px-0 [&>button]:!h-auto [&>button]:!shadow-none hover:[&>button]:!bg-transparent">
                                    <PassengerClassSelector
                                        qteADT={p.qteADT} qteCHD={p.qteCHD} qteINF={p.qteINF} classe={p.classe}
                                        onChange={(n) => update(n)}
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="ml-auto h-10 px-6 bg-[#FEC425] hover:bg-[#E09515] text-[#3566E3] font-bold text-sm rounded-lg shrink-0 cursor-pointer"
                            >
                                <Search className="w-3.5 h-3.5 mr-1.5" />
                                {loading ? t.searching : t.search}
                            </Button>
                        </div>
                    </>
                )}

                {passengerError && (
                    <div className="text-[11px] text-amber-600 mt-2">
                        {passengerError}
                    </div>
                )}
            </div>
        </form>
    );
}