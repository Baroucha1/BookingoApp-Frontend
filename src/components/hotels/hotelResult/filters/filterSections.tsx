import { useMemo } from 'react';
import { Star } from 'lucide-react';
import { AMENITY_LABELS } from '@/lib/hotelAmenities';

import PriceRangeSlider from './PriceRangeSlider';
import {formatPrice, percentile, PriceRange} from "@/lib/hotelPricee.ts";

export function toggleItem<T>(list: T[], item: T): T[] {
    return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

/* ---------- Price ---------- */

interface PriceFilterSectionProps {
    prices: number[];
    bounds: PriceRange;
    value: PriceRange;
    onChange: (value: PriceRange) => void;
    currency: string;
    showQuickOptions?: boolean;
}

export function PriceFilterSection({
                                       prices, bounds, value, onChange, currency, showQuickOptions = false,
                                   }: PriceFilterSectionProps) {
    const sorted = useMemo(() => [...prices].sort((a, b) => a - b), [prices]);
    const round = (n: number) => Math.round(n / 100) * 100;
    const p33 = round(percentile(sorted, 1 / 3));
    const p66 = round(percentile(sorted, 2 / 3));

    const quickOptions: { label: string; range: PriceRange }[] = [
        { label: `Moins de ${formatPrice(p33, currency)}`, range: [bounds[0], p33] },
        { label: `${formatPrice(p33, currency)} – ${formatPrice(p66, currency)}`, range: [p33, p66] },
        { label: `Plus de ${formatPrice(p66, currency)}`, range: [p66, bounds[1]] },
    ];
    const isSame = (a: PriceRange, b: PriceRange) => a[0] === b[0] && a[1] === b[1];

    return (
        <div>
            <div className="flex justify-between text-sm font-semibold text-slate-800 mb-3">
                <span>{formatPrice(value[0], currency)}</span>
                <span>{formatPrice(value[1], currency)}{value[1] >= bounds[1] ? '+' : ''}</span>
            </div>

            <PriceRangeSlider prices={prices} bounds={bounds} value={value} onChange={onChange} />

            {showQuickOptions && sorted.length >= 3 && p33 < p66 && (
                <div className="mt-6">
                    <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-2">
                        Options rapides
                    </div>
                    <div className="space-y-2">
                        {quickOptions.map((q) => {
                            const active = isSame(q.range, value);
                            return (
                                <button
                                    key={q.label}
                                    type="button"
                                    onClick={() => onChange(q.range)}
                                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-colors ${
                                        active
                                            ? 'border-[#1775FF] bg-[#DFECFF]/50 text-[#1775FF] font-semibold'
                                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    {q.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ---------- Stars ---------- */

interface StarsFilterSectionProps {
    selected: number[];
    onToggle: (n: number) => void;
    variant?: 'list' | 'chips';
}

export function StarsFilterSection({ selected, onToggle, variant = 'list' }: StarsFilterSectionProps) {
    if (variant === 'chips') {
        return (
            <div className="grid grid-cols-5 gap-2">
                {[5, 4, 3, 2, 1].map((n) => {
                    const active = selected.includes(n);
                    return (
                        <button
                            key={n}
                            type="button"
                            onClick={() => onToggle(n)}
                            aria-pressed={active}
                            className={`flex items-center justify-center gap-1 py-3 rounded-xl border text-sm font-semibold transition-colors ${
                                active
                                    ? 'border-[#1775FF] bg-[#DFECFF]/50 text-[#1775FF]'
                                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                        >
                            {n} <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        </button>
                    );
                })}
            </div>
        );
    }

    return (
        <div>
            {[5, 4, 3, 2, 1].map((n) => (
                <label key={n} className="flex items-center gap-2 text-sm py-1.5 cursor-pointer">
                    <input type="checkbox" checked={selected.includes(n)} onChange={() => onToggle(n)} />
                    <span className="flex items-center gap-0.5">
                        {Array.from({ length: n }, (_, i) => (
                            <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                        ))}
                    </span>
                    <span className="text-slate-500">{n} étoile{n > 1 ? 's' : ''}</span>
                </label>
            ))}
        </div>
    );
}

/* ---------- Amenities ---------- */

interface AmenitiesFilterSectionProps {
    selected: string[];
    onToggle: (a: string) => void;
    comfortable?: boolean;
}

export function AmenitiesFilterSection({ selected, onToggle, comfortable = false }: AmenitiesFilterSectionProps) {
    return (
        <div className={comfortable ? 'divide-y divide-slate-100' : ''}>
            {AMENITY_LABELS.map((a) => (
                <label
                    key={a}
                    className={`flex items-center gap-3 text-sm cursor-pointer ${comfortable ? 'py-3.5' : 'py-1.5 gap-2'}`}
                >
                    <input
                        type="checkbox"
                        checked={selected.includes(a)}
                        onChange={() => onToggle(a)}
                        className={comfortable ? 'w-4 h-4 accent-[#1775FF]' : ''}
                    />
                    <span className="text-slate-700">{a}</span>
                </label>
            ))}
        </div>
    );
}