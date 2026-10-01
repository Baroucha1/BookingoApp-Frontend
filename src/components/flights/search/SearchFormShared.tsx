import {AggregatedDestination, getAggregatedDestinations} from "@/service/flights_aggregator/aggregatedSearch.service";
import { AggregatedSearchParams, CabinClass } from "@/service/flights_aggregator/aggregatedTypes";
import {useCallback, useEffect, useRef, useState} from "react";
import {Airport, FALLBACK_AIRPORTS, searchAirports, searchAirportsFallback} from "@/service/flights/airports.ts";
import {cn} from "@/lib/utils.ts";
import {
    Calendar,
    Check,
    Clock,
    Loader2,
    MapPin,

} from "lucide-react";
import {getAirlineLogo, getAirlineName} from "@/service/flights/airlines.ts";
import { createPortal } from 'react-dom';
import { ArrowLeft } from 'lucide-react';
import {
    toLocalISO, today, addMonths, buildMonthDays,
    emptyLeg, defaultForm, RECENT_KEY, getRecentAirports, saveRecentAirport,
    getDayState,
} from './SearchFormUtils.ts';
import type { Leg, FormState, DayState } from './SearchFormUtils';
import { useLanguage } from '@/i18n/LanguageContext';


export interface AirportInputProps {
    value: string;
    onChange: (code: string, airport?: Airport) => void;
    placeholder: string;
    hintType?: 'origin' | 'destination';
    selectedAirport?: Airport | null;
    onShowAllDestinations?: () => void;
}

export function Tile({ icon, label, children, className, onClick }: {
    icon: React.ReactNode; label: string; children: React.ReactNode; className?: string; onClick?: () => void;
}) {
    return (
        <div
            onClick={onClick}
            className={cn(
                'relative flex items-start gap-2 px-4 py-2 bg-white rounded border border-[#1775FF] shadow-sm hover:shadow-md transition-shadow min-h-[60px]',
                onClick && 'cursor-pointer',
                className,
            )}
        >
            <div className="mt-0.5 text-[#F5A623] shrink-0">{icon}</div>
            <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase tracking-widest text-[#94A3B8] mb-0.5 font-medium">{label}</div>
                {children}
            </div>
        </div>
    );
}

export function AirportInput({ value, onChange, placeholder, hintType, selectedAirport, onShowAllDestinations }: AirportInputProps) {
    const { t } = useLanguage();
    const [query, setQuery] = useState(value);
    const [suggestions, setSuggestions] = useState<Airport[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const wrapRef = useRef<HTMLDivElement>(null);

    const ROUTE_HINTS = hintType === 'destination'
        ? ['Paris CDG', 'Dubai DXB', 'Istanbul IST', 'Doha DOH', 'Londres LHR']
        : ['Alger ALG', 'Oran ORN', 'Constantine CZL', 'Annaba AAE', 'Béjaïa BJA'];
    const [hintIdx, setHintIdx] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => setHintIdx((i) => (i + 1) % ROUTE_HINTS.length), 2000);
        return () => clearInterval(interval);
    }, []);

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
                <button type="button" onClick={() => { onChange('', undefined); setQuery(''); }} className="w-full text-left block min-w-0">
                    <div className="font-bold text-[#0454E8] text-sm leading-tight truncate">
                        {selectedAirport.city} <span className="text-[#F5A623]">{selectedAirport.code}</span>
                    </div>
                    <div className="text-[11px] text-[#64748B] truncate">{selectedAirport.name}</div>
                </button>
            ) : (
                <div className="relative">
                    <input
                        value={query}
                        onChange={(e) => handleChange(e.target.value)}
                        onFocus={() => { if (suggestions.length > 0) setOpen(true); else showDefaults(); }}
                        placeholder={ROUTE_HINTS[hintIdx]}
                        className="w-full bg-transparent border-none outline-none text-[#0B0F2E] placeholder:text-gray-400 text-sm font-medium"
                    />
                    {loading && <Loader2 className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F5A623] animate-spin" />}
                </div>
            )}
            {open && (
                <div className="absolute z-50 left-0 w-full min-w-[280px] mt-3 bg-white border border-[#E2E8F0] rounded-2xl shadow-2xl max-h-72 overflow-y-auto">
                    {suggestions.map((a) => (
                        <button key={a.code} type="button" onMouseDown={() => handleSelect(a)}
                                className="w-full px-4 py-3 hover:bg-[#FFF9F0] flex items-center justify-between gap-3 text-left border-b border-[#F1F5F9] last:border-0 transition">
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
                            onMouseDown={() => { onShowAllDestinations(); setOpen(false); }}
                            className="w-full px-4 py-3 flex items-center gap-2 text-left text-sm font-medium text-[#3D8BF0] hover:bg-[#FFF9F0] transition"
                        >
                            🌐 {t('flightAllDestinations')}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export function useIsMobile(breakpoint = 768) {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
        const update = () => setIsMobile(mq.matches);
        update();
        mq.addEventListener('change', update);
        return () => mq.removeEventListener('change', update);
    }, [breakpoint]);
    return isMobile;
}

function DayCell({ date, state, onPick }: { date: Date; state: DayState; onPick: (d: Date) => void }) {
    return (
        <button
            type="button"
            disabled={state.isPast}
            onClick={() => onPick(date)}
            className={cn(
                'relative h-9 text-sm transition-colors flex items-center justify-center',
                state.isPast && 'text-[#CBD5E1] cursor-not-allowed',
                !state.isPast && !state.isStart && !state.isEnd && !state.inRange && 'hover:bg-[#FFF9F0] hover:text-[#F5A623] rounded-full text-[#0B0F2E]',
                state.inRange && 'bg-[#EFF6FF] text-[#0454E8]',
                (state.isStart || state.isEnd) && 'bg-[#0454E8] text-white rounded-full font-semibold',
                state.isToday && !state.isStart && !state.isEnd && 'font-bold text-[#3D8BF0]',
            )}
        >
            {date.getDate()}
        </button>
    );
}

function MonthGrid({ month, start, end, floor, onPick, header }: {
    month: Date; start: Date | null; end: Date | null; floor: Date; onPick: (d: Date) => void; header: React.ReactNode;
}) {
    const { language } = useLanguage();
    const days = buildMonthDays(month);
    const weekStart = new Date(2024, 0, 1);
    const weekdays = Array.from({ length: 7 }, (_, index) => {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + index);
        return new Intl.DateTimeFormat(language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-FR' : 'en-GB', { weekday: 'short' }).format(date);
    });
    return (
        <div className="w-full">
            {header}
            <div className="grid grid-cols-7 mb-1">
                {weekdays.map((d) => (
                    <div key={d} className="text-center text-[10px] text-[#94A3B8] font-medium py-1">{d}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-y-1">
                {days.map((date, idx) =>
                    !date ? <div key={`e-${idx}`} /> : (
                        <DayCell key={date.toISOString()} date={date} state={getDayState(date, start, end, floor)} onPick={onPick} />
                    )
                )}
            </div>
        </div>
    );
}

export function SingleDatePicker({ value, onChange, label, minDate }: {
    value: string; onChange: (v: string) => void; label?: string; minDate?: string;
}) {
    return (
        <DateRangePicker
            tripType="oneway"
            startDate={value}
            endDate=""
            onChangeStart={onChange}
            onChangeEnd={() => {}}     // unused in single mode
            minDate={minDate}
        />
    );
}
export function Chip({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs border transition-all font-medium',
                active ? 'bg-[#EFF6FF] text-[#0454E8] border-[#FFAA01]' : 'bg-white text-[#0454E8] border-[#0454E8] hover:border-[#FFAA01]/30',
            )}
        >
            {active ? <Check className="w-3 h-3" /> : icon}
            {label}
        </button>
    );
}

function DesktopRangeCalendar({ mode, startDate, endDate, onSelectStart, onSelectEnd, onClose, minDate }: {
    mode: 'single' | 'range';
    startDate: string;
    endDate?: string;
    onSelectStart: (v: string) => void;
    onSelectEnd?: (v: string) => void;
    onClose: () => void;
    minDate?: string;
}) {
    const { language } = useLanguage();
    const floor = minDate ? new Date(minDate + 'T00:00:00') : (() => { const t = new Date(); t.setHours(0, 0, 0, 0); return t; })();
    const initial = startDate ? new Date(startDate + 'T00:00:00') : new Date();
    const [viewMonth, setViewMonth] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1));
    const [pickingEnd, setPickingEnd] = useState(mode === 'range' && !!startDate && !endDate);

    const start = startDate ? new Date(startDate + 'T00:00:00') : null;
    const end = mode === 'range' && endDate ? new Date(endDate + 'T00:00:00') : null;

    const handlePick = (date: Date) => {
        const iso = toLocalISO(date);
        if (mode === 'single') { onSelectStart(iso); onClose(); return; }
        if (!pickingEnd || (start && date < start)) { onSelectStart(iso); setPickingEnd(true); }
        else { onSelectEnd?.(iso); setPickingEnd(false); onClose(); }
    };

    const header = (m: Date, showPrev: boolean, showNext: boolean) => (
        <div className="flex items-center justify-between mb-3 px-1">
            {showPrev ? (
                <div className="flex items-center gap-1">
                    <button type="button" onClick={() => setViewMonth(addMonths(viewMonth, -12))} className="w-6 h-6 rounded-full hover:bg-[#F1F5F9] text-[#64748B] text-xs">«</button>
                    <button type="button" onClick={() => setViewMonth(addMonths(viewMonth, -1))} className="w-7 h-7 rounded-full hover:bg-[#F1F5F9] text-[#64748B]">‹</button>
                </div>
            ) : <div className="w-14" />}
            <span className="text-sm font-semibold text-[#0B0F2E] capitalize">{m.toLocaleDateString(language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-FR' : 'en-GB', { month: 'long', year: 'numeric' })}</span>
            {showNext ? (
                <div className="flex items-center gap-1">
                    <button type="button" onClick={() => setViewMonth(addMonths(viewMonth, 1))} className="w-7 h-7 rounded-full hover:bg-[#F1F5F9] text-[#64748B]">›</button>
                    <button type="button" onClick={() => setViewMonth(addMonths(viewMonth, 12))} className="w-6 h-6 rounded-full hover:bg-[#F1F5F9] text-[#64748B] text-xs">»</button>
                </div>
            ) : <div className="w-14" />}
        </div>
    );

    return (
        <div className="flex gap-6 p-4 w-[600px] max-w-[calc(100vw-2rem)]">
            <MonthGrid month={viewMonth} start={start} end={end} floor={floor} onPick={handlePick} header={header(viewMonth, true, false)} />
            <MonthGrid month={addMonths(viewMonth, 1)} start={start} end={end} floor={floor} onPick={handlePick} header={header(addMonths(viewMonth, 1), false, true)} />
        </div>
    );
}
function MobileDateSheet({ mode, startDate, endDate, onSelectStart, onSelectEnd, onClose, minDate }: {
    mode: 'single' | 'range';
    startDate: string;
    endDate?: string;
    onSelectStart: (v: string) => void;
    onSelectEnd?: (v: string) => void;
    onClose: () => void;
    minDate?: string;
}) {
    const { t, language } = useLanguage();
    const floor = minDate ? new Date(minDate + 'T00:00:00') : (() => { const t = new Date(); t.setHours(0, 0, 0, 0); return t; })();
    const [active, setActive] = useState<'start' | 'end'>('start');
    const [localStart, setLocalStart] = useState(startDate);
    const [localEnd, setLocalEnd] = useState(endDate ?? '');

    const baseMonth = new Date(); baseMonth.setDate(1); baseMonth.setHours(0, 0, 0, 0);
    const months = Array.from({ length: 13 }, (_, i) => addMonths(baseMonth, i));

    const handlePick = (date: Date) => {
        const iso = toLocalISO(date);
        if (mode === 'single') { setLocalStart(iso); return; }
        if (active === 'start' || (localStart && date < new Date(localStart + 'T00:00:00'))) {
            setLocalStart(iso); setLocalEnd(''); setActive('end');
        } else {
            setLocalEnd(iso);
        }
    };

    const confirm = () => {
        if (localStart) onSelectStart(localStart);
        if (mode === 'range' && localEnd) onSelectEnd?.(localEnd);
        onClose();
    };

    const canConfirm = mode === 'single' ? !!localStart : !!localStart && !!localEnd;
    const locale = language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-FR' : 'en-GB';
    const fmt = (v: string) => v ? new Date(v + 'T00:00:00').toLocaleDateString(locale, { day: 'numeric', month: 'short' }) : '—';

    return createPortal(
        <div className="fixed inset-0 z-[9999] bg-white flex flex-col">
            <div className="ios-date-sheet-header flex items-center gap-3 px-4 py-3 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] border-b border-[#F1F5F9] shrink-0">
                <button
                    type="button"
                    onClick={onClose}
                    aria-label={t('flightBack')}
                    className="w-9 h-9 -ml-1 rounded-full hover:bg-[#F1F5F9] flex items-center justify-center text-[#0B0F2E] shrink-0"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                {mode === 'range' ? (
                    <div className="flex-1 flex items-center gap-6">
                        <button type="button" onClick={() => setActive('start')}
                                className={cn('text-sm font-semibold pb-1 border-b-2', active === 'start' ? 'text-[#0454E8] border-[#0454E8]' : 'text-[#94A3B8] border-transparent')}>
                            {t('flightDepartureDate')}{localStart && ` · ${fmt(localStart)}`}
                        </button>
                        <button type="button" onClick={() => setActive('end')}
                                className={cn('text-sm font-semibold pb-1 border-b-2', active === 'end' ? 'text-[#0454E8] border-[#0454E8]' : 'text-[#94A3B8] border-transparent')}>
                            {t('flightReturnDate')}{localEnd && ` · ${fmt(localEnd)}`}
                        </button>
                    </div>
                ) : (
                    <span className="text-sm font-semibold text-[#0B0F2E]">{t('flightDepartureDate')}</span>
                )}
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-6">
                {months.map((m) => (
                    <MonthGrid key={m.toISOString()} month={m}
                               start={localStart ? new Date(localStart + 'T00:00:00') : null}
                               end={mode === 'range' && localEnd ? new Date(localEnd + 'T00:00:00') : null}
                               floor={floor} onPick={handlePick}
                               header={<div className="text-sm font-semibold text-[#0B0F2E] capitalize mb-2">{m.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}</div>} />
                ))}
            </div>

            <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] border-t border-[#F1F5F9] shrink-0">
                <button type="button" onClick={confirm} disabled={!canConfirm}
                        className="w-full h-12 rounded-lg bg-[#0454E8] disabled:bg-[#CBD5E1] text-white font-semibold text-sm">
                    {t('flightSelectDate')}
                </button>
            </div>
        </div>,
        document.body
    );
}
export function DateRangePicker({ tripType, startDate, endDate, onChangeStart, onChangeEnd, minDate }: {
    tripType: FormState['tripType'];
    startDate: string;
    endDate: string;
    onChangeStart: (v: string) => void;
    onChangeEnd: (v: string) => void;
    minDate?: string;
}) {
    const { language, t } = useLanguage();
    const [open, setOpen] = useState(false);
    const isMobile = useIsMobile();
    const ref = useRef<HTMLDivElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null);
    const isRange = tripType === 'roundtrip';

    const openPicker = () => setOpen(true);
    const closePicker = () => setOpen(false);

    // Outside click still closes it — that part was never the problem
    useEffect(() => {
        if (isMobile || !open) return;
        const handler = (e: MouseEvent) => {
            const path = e.composedPath();
            const insideTrigger = ref.current ? path.includes(ref.current) : false;
            const insidePopover = popoverRef.current ? path.includes(popoverRef.current) : false;
            if (!insideTrigger && !insidePopover) closePicker();
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isMobile, open]);

    // Compute position ONCE in document coordinates (adds scrollY/scrollX),
    // not viewport coordinates. Since it's position:absolute against body,
    // the browser scrolls it along naturally — no listener needed.
    useEffect(() => {
        if (!open || isMobile || !ref.current) return;
        const margin = 16;
        const panelWidth = 632;
        const rect = ref.current.getBoundingClientRect();

        let left = rect.left + window.scrollX;
        const viewportRight = window.scrollX + window.innerWidth - margin;
        if (left + panelWidth > viewportRight) {
            left = viewportRight - panelWidth;
        }
        if (left < window.scrollX + margin) left = window.scrollX + margin;

        setPopoverPos({ top: rect.bottom + window.scrollY + 8, left });
    }, [open, isMobile]);

    const locale = language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-FR' : 'en-GB';
    const fmt = (v: string) => v ? new Date(v + 'T00:00:00').toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

    return (
        <div ref={ref} className="relative">
            <div
                onClick={() => (open ? closePicker() : openPicker())}
                className="flex items-center gap-2 px-4 py-4 bg-white rounded border border-[#1775FF] shadow-sm cursor-pointer"
            >
                <Calendar className="w-4 h-4 text-[#F5A623] shrink-0" />
                <div className="min-w-0 flex-1 text-sm font-bold text-[#0B0F2E]">
                    {isRange
                        ? `${fmt(startDate)} → ${endDate ? fmt(endDate) : ''}`
                        : (startDate ? fmt(startDate) : '')}
                </div>
            </div>

            {open && isMobile && (
                <MobileDateSheet mode={isRange ? 'range' : 'single'} startDate={startDate} endDate={endDate}
                                 onSelectStart={onChangeStart} onSelectEnd={onChangeEnd} onClose={closePicker} minDate={minDate} />
            )}

            {open && !isMobile && popoverPos && createPortal(
                <div
                    ref={popoverRef}
                    className="absolute z-[999] bg-white border border-[#E2E8F0] rounded-xl shadow-2xl"
                    style={{ top: popoverPos.top, left: popoverPos.left }}
                >
                    <button type="button" onClick={closePicker} aria-label={t('flightClose')}
                            className="absolute top-2 right-2 w-7 h-7 rounded-full hover:bg-[#F1F5F9] flex items-center justify-center text-[#64748B] z-10">
                        ✕
                    </button>
                    <DesktopRangeCalendar mode={isRange ? 'range' : 'single'} startDate={startDate} endDate={endDate}
                                          onSelectStart={onChangeStart} onSelectEnd={onChangeEnd} onClose={closePicker} minDate={minDate} />
                </div>,
                document.body
            )}
        </div>
    );
}

export function AirlinePill({ code, name, logo, active, onClick }: {
    code: string; name: string; logo: string; active: boolean; onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'inline-flex items-center gap-1.5 pl-1 pr-3 py-1 rounded-md border text-xs font-semibold transition-all shrink-0',
                active ? 'border-[#F5A623] bg-[#FFFBF0] text-[#92400E]' : 'border-[#E2E8F0] bg-white text-[#4A5568] hover:border-[#3D8BF0]/40',
            )}
        >
            <div className="w-5 h-5 rounded-full overflow-hidden bg-white border border-[#F1F5F9] flex items-center justify-center shrink-0">
                <img src={logo} alt={name} className="w-full h-full object-cover"
                     onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
            </div>
            {name}
        </button>
    );
}



import { X as CloseIcon,  Search as SearchIcon } from 'lucide-react';
import {AirlineOption} from "@/data/airlines.ts";

function AirlineChecklist({ airlines, selected, onToggle, search, setSearch }: {
    airlines: AirlineOption[];
    selected: string[];
    onToggle: (code: string) => void;
    search: string;
    setSearch: (v: string) => void;
}) {
    const { t } = useLanguage();
    const filtered = airlines.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <>
            <div className="relative mb-3">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t('flightSearchAirline')}
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-[#E2E8F0] text-sm outline-none focus:border-[#1775FF]"
                    autoFocus
                />
            </div>
            <div className="space-y-1">
                {filtered.map((a) => (
                    <label key={a.code} className="flex items-center gap-3 px-2 py-2.5 rounded-md hover:bg-[#F8FAFC] cursor-pointer">
                        <input type="checkbox" checked={selected.includes(a.code)} onChange={() => onToggle(a.code)} className="w-4 h-4 accent-[#0454E8] shrink-0" />
                        <img src={a.logo} alt="" className="w-6 h-6 rounded-full shrink-0"
                             onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                        <span className="text-sm text-[#1A202C]">{a.name}</span>
                    </label>
                ))}
                {filtered.length === 0 && (
                    <div className="text-sm text-[#94A3B8] px-2 py-6 text-center">{t('flightNoResults')}</div>
                )}
            </div>
        </>
    );
}

function AirlineDesktopModal({ airlines, selected, onToggle, onClose }: {
    airlines: AirlineOption[]; selected: string[]; onToggle: (code: string) => void; onClose: () => void;
}) {
    const { t } = useLanguage();
    const [search, setSearch] = useState('');
    return createPortal(
        <div className="fixed inset-0 z-[999] bg-black/40 flex items-center justify-center p-4">
            <div className="absolute inset-0" onClick={onClose} />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#F1F5F9] shrink-0">
                    <span className="text-sm font-semibold text-[#0B0F2E]">{t('flightAirlines')}</span>
                    <button type="button" onClick={onClose} aria-label={t('flightClose')}
                            className="w-7 h-7 rounded-full hover:bg-[#F1F5F9] flex items-center justify-center text-[#64748B]">
                        <CloseIcon className="w-4 h-4" />
                    </button>
                </div>
                <div className="p-5 overflow-y-auto flex-1">
                    <AirlineChecklist airlines={airlines} selected={selected} onToggle={onToggle} search={search} setSearch={setSearch} />
                </div>
                <div className="p-4 border-t border-[#F1F5F9] shrink-0">
                    <button type="button" onClick={onClose}
                            className="w-full h-11 rounded-lg bg-[#0454E8] text-white font-semibold text-sm">
                        {t('flightValidate')}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

function AirlineMobileSheet({ airlines, selected, onToggle, onClose }: {
    airlines: AirlineOption[]; selected: string[]; onToggle: (code: string) => void; onClose: () => void;
}) {
    const { t } = useLanguage();
    const [search, setSearch] = useState('');
    return createPortal(
        <div className="fixed inset-0 z-[9999] bg-white flex flex-col">
            <div className="flex items-center gap-3 px-4 py-3 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] border-b border-[#F1F5F9] shrink-0">
                <button type="button" onClick={onClose} aria-label={t('flightBack')}
                        className="w-9 h-9 -ml-1 rounded-full hover:bg-[#F1F5F9] flex items-center justify-center text-[#0B0F2E] shrink-0">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <span className="text-sm font-semibold text-[#0B0F2E]">{t('flightAirlines')}</span>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3">
                <AirlineChecklist airlines={airlines} selected={selected} onToggle={onToggle} search={search} setSearch={setSearch} />
            </div>
            <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] border-t border-[#F1F5F9] shrink-0">
                <button type="button" onClick={onClose}
                        className="w-full h-12 rounded-lg bg-[#0454E8] text-white font-semibold text-sm">
                    {t('flightValidate')}
                </button>
            </div>
        </div>,
        document.body
    );
}

export function AirlineFilterRow({ airlines, selected, onToggle }: {
    airlines: AirlineOption[];
    selected: string[];
    onToggle: (code: string) => void;
}) {
    const { t } = useLanguage();
    const [open, setOpen] = useState(false);
    const isMobile = useIsMobile();

    const VISIBLE_COUNT = 4;
    const visibleAirlines = airlines.slice(0, VISIBLE_COUNT);
    const overflowAirlines = airlines.slice(VISIBLE_COUNT);
    const overflowCount = overflowAirlines.length;

    return (
        <div className="flex items-center gap-2 flex-wrap">
            {visibleAirlines.map((a) => (
                <AirlinePill key={a.code} code={a.code} name={a.name} logo={a.logo}
                             active={selected.includes(a.code)} onClick={() => onToggle(a.code)} />
            ))}

            {overflowCount > 0 && (
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className={cn(
                        'inline-flex items-center gap-1 px-3 py-1 rounded-md border text-xs font-semibold transition-all shrink-0',
                        selected.some((c) => overflowAirlines.some((a) => a.code === c))
                            ? 'border-[#F5A623] bg-[#FFFBF0] text-[#92400E]'
                            : 'border-[#E2E8F0] bg-white text-[#4A5568] hover:border-[#3D8BF0]/40'
                    )}
                >
                    +{overflowCount} {t('flightMore')}
                </button>
            )}

            {open && isMobile && (
                <AirlineMobileSheet airlines={airlines} selected={selected} onToggle={onToggle} onClose={() => setOpen(false)} />
            )}
            {open && !isMobile && (
                <AirlineDesktopModal airlines={airlines} selected={selected} onToggle={onToggle} onClose={() => setOpen(false)} />
            )}
        </div>
    );
}

export function TripTypeToggle({ value, onChange }: { value: FormState['tripType']; onChange: (v: FormState['tripType']) => void }) {
    const { t } = useLanguage();
    const options: { key: FormState['tripType']; label: string }[] = [
        { key: 'oneway', label: t('flightOneWay') },
        { key: 'roundtrip', label: t('flightRoundTrip') },
        { key: 'multicity', label: t('flightMultiCity') },
    ];
    return (
        <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {options.map((o) => (
                <button
                    key={o.key}
                    type="button"
                    onClick={() => onChange(o.key)}
                    className="group flex items-center gap-1 text-xs sm:text-sm font-semibold text-[#0454E8] shrink-0 whitespace-nowrap"
                >
                    <span
                        className={cn(
                            'w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors shrink-0',
                            value === o.key ? 'border-[#0454E8]' : 'border-[#0454E8] group-hover:border-[#F5A623]'
                        )}
                    >
                        {value === o.key && <span className="w-2 h-2 rounded-full bg-[#F5A623]" />}
                    </span>
                    <span className="transition-colors group-hover:text-[#FFAA01]">{o.label}</span>
                </button>
            ))}
        </div>
    );
}

export function useAggregatedSearchFormState(onSubmit: (p: AggregatedSearchParams) => void) {
    const { t } = useLanguage();
    const [depAirport, setDepAirport] = useState<Airport | null>(null);
    const [destAirport, setDestAirport] = useState<Airport | null>(null);
    const [destinations, setDestinations] = useState<AggregatedDestination[]>([]);
    const [destinationsLoading, setDestinationsLoading] = useState(true);
    const [showAllDestinations, setShowAllDestinations] = useState(false);
    const [destinationPickerTarget, setDestinationPickerTarget] = useState<'origin' | 'destination'>('destination');
    const [p, setP] = useState<FormState>(defaultForm);

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
        setP((prev) => (prev.legs.length <= 1 ? prev : { ...prev, legs: prev.legs.filter((_, i) => i !== index) }));
    };

    const returnDateMissing = p.tripType === 'roundtrip' && !p.retourleVol1;
    const multiCityIncomplete =
        p.tripType === 'multicity' &&
        (p.legs.length < 2 || p.legs.some((leg) => !leg.origin || !leg.destination || !leg.date));

    useEffect(() => {
        getAggregatedDestinations()
            .then(setDestinations)
            .catch((err) => console.error('Failed to load destinations:', err))
            .finally(() => setDestinationsLoading(false));
    }, []);

    const reachableFromOrigin = new Set(
        destinations.filter((d) => !p.departVol1 || d.origins.includes(p.departVol1)).map((d) => d.code)
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

    const toggleAirline = (code: string) => {
        const cur = p.preferredAirlines ?? [];
        update({ preferredAirlines: cur.includes(code) ? cur.filter((c) => c !== code) : [...cur, code] });
    };

    const passengerLabel = () => {
        const total = p.qteADT + p.qteCHD + p.qteINF;
        const classeMap: Record<string, string> = {
            Y: t('flightClassEconomy'), C: t('flightClassBusiness'), F: t('flightClassFirst'), W: t('flightClassPremium'),
        };
        return { count: total, classe: classeMap[p.classe] ?? p.classe };
    };

    const passengerError = p.qteINF > p.qteADT ? t('flightInfantLimit') : null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (passengerError || multiCityIncomplete || returnDateMissing) return;

        if (p.tripType === 'multicity') {
            onSubmit({
                legs: p.legs.map(({ origin, destination, date }) => ({ origin, destination, date })),
                origin: p.legs[0].origin,
                destination: p.legs[p.legs.length - 1].destination,
                date: p.legs[0].date,
                adults: p.qteADT, children: p.qteCHD, infants: p.qteINF, cabinClass: p.classe,
            });
        } else {
            onSubmit({
                origin: p.departVol1, destination: p.destinationVol1, date: p.departleVol1,
                returnDate: p.tripType === 'roundtrip' ? p.retourleVol1 : undefined,
                adults: p.qteADT, children: p.qteCHD, infants: p.qteINF, cabinClass: p.classe,
            });
        }
    };

    return {
        p, update, depAirport, setDepAirport, destAirport, setDestAirport,
        showAllDestinations, setShowAllDestinations, destinationPickerTarget, setDestinationPickerTarget,
        updateLeg, addLeg, removeLeg, swap, toggleAirline, isDestinationSupported,
        returnDateMissing, multiCityIncomplete, passengerError, handleSubmit, passengerLabel,
    };
}