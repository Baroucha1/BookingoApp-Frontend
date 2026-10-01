// src/components/flights/SmartDateField.tsx
import { useState, useRef, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

function toLocalISO(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function parseTyped(value: string): Date | null {
    const m = value.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/);
    if (!m) return null;
    const [, d, mo, y] = m;
    const date = new Date(Number(y), Number(mo) - 1, Number(d));
    if (date.getFullYear() !== Number(y) || date.getMonth() !== Number(mo) - 1 || date.getDate() !== Number(d)) return null;
    return date;
}

function fmtDisplay(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

interface Props {
    value: string;
    onChange: (iso: string) => void;
    minDate?: string;
    maxDate?: string;
    yearRange?: [number, number];
    error?: boolean;
    placeholder?: string;
}

export default function SmartDateField({ value, onChange, minDate, maxDate, yearRange, error, placeholder }: Props) {
    const [open, setOpen] = useState(false);
    const [typed, setTyped] = useState(fmtDisplay(value));
    const [typedError, setTypedError] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLDivElement>(null);
    const [coords, setCoords] = useState({ top: 0, left: 0 });

    const now = new Date();
    const defaultRange: [number, number] = [now.getFullYear() - 100, now.getFullYear() + 10];
    const [minYear, maxYear] = yearRange ?? defaultRange;

    const initial = value ? new Date(value + 'T00:00:00') : now;
    const [viewYear, setViewYear] = useState(initial.getFullYear());
    const [viewMonth, setViewMonth] = useState(initial.getMonth());

    useEffect(() => {
        if (!open) return;

        const updateCoords = () => {
            if (triggerRef.current) {
                const rect = triggerRef.current.getBoundingClientRect();
                setCoords({ top: rect.bottom + 8, left: rect.left });
            }
        };

        updateCoords();
        window.addEventListener('scroll', updateCoords, true);
        window.addEventListener('resize', updateCoords);
        return () => {
            window.removeEventListener('scroll', updateCoords, true);
            window.removeEventListener('resize', updateCoords);
        };
    }, [open]);

    useEffect(() => { setTyped(fmtDisplay(value)); }, [value]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const minD = minDate ? new Date(minDate + 'T00:00:00') : null;
    const maxD = maxDate ? new Date(maxDate + 'T00:00:00') : null;
    const isDisabled = (d: Date) => (minD && d < minD) || (maxD && d > maxD);

    const handleTypedBlur = () => {
        if (!typed.trim()) { setTypedError(false); return; }
        const parsed = parseTyped(typed.trim());
        if (!parsed || isDisabled(parsed)) { setTypedError(true); return; }
        setTypedError(false);
        onChange(toLocalISO(parsed));
        setViewYear(parsed.getFullYear());
        setViewMonth(parsed.getMonth());
    };

    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const startOffset = (firstDay + 6) % 7;
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const days: (Date | null)[] = Array(startOffset).fill(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(new Date(viewYear, viewMonth, d));

    const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const years: number[] = [];
    for (let y = maxYear; y >= minYear; y--) years.push(y);

    const selectedISO = value;

    return (
        <div ref={ref} className="relative">
            <div ref={triggerRef} className={cn(
                'flex items-center h-11 rounded-lg bg-slate-50 border text-sm transition',
                error || typedError ? 'border-red-300' : 'border-slate-200 focus-within:border-[#F5A623] focus-within:ring-1 focus-within:ring-[#F5A623]/30'
            )}>
                <input
                    value={typed}
                    onChange={(e) => setTyped(e.target.value)}
                    onBlur={handleTypedBlur}
                    onKeyDown={(e) => { if (e.key === 'Enter') { handleTypedBlur(); } }}
                    placeholder={placeholder ?? 'JJ/MM/AAAA'}
                    className="flex-1 h-full px-3 bg-transparent outline-none text-[#0B0F2E] placeholder:text-slate-300"
                />
                <button
                    type="button"
                    onClick={() => setOpen((o) => !o)}
                    className="px-3 h-full flex items-center text-[#F5A623] shrink-0"
                >
                    <Calendar className="w-4 h-4" />
                </button>
            </div>
            {typedError && <span className="text-red-500 text-xs mt-1 block">Date invalide (JJ/MM/AAAA)</span>}

            {open && (
                <div
                    className="fixed z-[9999] w-[300px] bg-white border border-[#E2E8F0] rounded-xl shadow-2xl p-3"
                    style={{ top: coords.top, left: coords.left }}
                >
                    <div className="flex items-center gap-2 mb-3">
                        <select
                            value={viewMonth}
                            onChange={(e) => setViewMonth(Number(e.target.value))}
                            className="flex-1 h-9 px-2 rounded-md border border-slate-200 text-sm bg-white"
                        >
                            {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                        </select>
                        <select
                            value={viewYear}
                            onChange={(e) => setViewYear(Number(e.target.value))}
                            className="w-24 h-9 px-2 rounded-md border border-slate-200 text-sm bg-white"
                        >
                            {years.map((y) => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-7 mb-1">
                        {['lu', 'ma', 'me', 'je', 've', 'sa', 'di'].map((d) => (
                            <div key={d} className="text-center text-[10px] text-[#94A3B8] font-medium py-1">{d}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7">
                        {days.map((date, idx) => {
                            if (!date) return <div key={`e-${idx}`} />;
                            const iso = toLocalISO(date);
                            const disabled = isDisabled(date);
                            const isSelected = selectedISO === iso;
                            return (
                                <button
                                    key={iso}
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => { onChange(iso); setTyped(fmtDisplay(iso)); setTypedError(false); setOpen(false); }}
                                    className={cn(
                                        'h-8 text-sm flex items-center justify-center rounded-full transition-colors',
                                        disabled && 'text-[#CBD5E1] cursor-not-allowed',
                                        !disabled && !isSelected && 'hover:bg-[#FFF9F0] hover:text-[#F5A623] text-[#0B0F2E]',
                                        isSelected && 'bg-[#F5A623] text-white font-semibold',
                                    )}
                                >
                                    {date.getDate()}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}