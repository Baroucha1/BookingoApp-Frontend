import { useMemo } from 'react';
import {getPriceStep, PriceRange} from "@/lib/hotelPricee.ts";


const BUCKETS = 24;

interface PriceRangeSliderProps {
    prices: number[];
    bounds: PriceRange;
    value: PriceRange;
    onChange: (value: PriceRange) => void;
}

export default function PriceRangeSlider({ prices, bounds, value, onChange }: PriceRangeSliderProps) {
    const [min, max] = bounds;
    const [lo, hi] = value;
    const span = Math.max(1, max - min);
    const step = getPriceStep(bounds);
    const pct = (v: number) => ((v - min) / span) * 100;

    // Snap to the edges so the ends are always reachable, whatever the step
    const snap = (v: number) => (v >= max - step ? max : v <= min + step ? min : v);

    const counts = useMemo(() => {
        const c = new Array(BUCKETS).fill(0);
        prices.forEach((p) => {
            const i = Math.min(BUCKETS - 1, Math.max(0, Math.floor(((p - min) / span) * BUCKETS)));
            c[i]++;
        });
        return c;
    }, [prices, min, span]);
    const maxCount = Math.max(1, ...counts);

    return (
        <div>
            <div className="flex items-end gap-[3px] h-12 mb-2">
                {counts.map((c, i) => {
                    const center = min + ((i + 0.5) / BUCKETS) * span;
                    const inRange = center >= lo && center <= hi;
                    return (
                        <div
                            key={i}
                            className={`flex-1 rounded-sm transition-colors ${inRange ? 'bg-[#1775FF]/60' : 'bg-slate-200'}`}
                            style={{ height: `${Math.max(6, (c / maxCount) * 100)}%` }}
                        />
                    );
                })}
            </div>

            <div className="relative h-6">
                <div className="absolute top-1/2 -translate-y-1/2 h-1.5 w-full rounded-full bg-slate-200" />
                <div
                    className="absolute top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-[#1775FF]"
                    style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }}
                />
                <input
                    type="range"
                    aria-label="Prix minimum"
                    min={min}
                    max={max}
                    step={step}
                    value={lo}
                    onChange={(e) => onChange([Math.min(snap(Number(e.target.value)), hi - step), hi])}
                    className="range-thumb absolute inset-0 w-full"
                    style={{ zIndex: lo >= max - step ? 5 : 3 }}
                />
                <input
                    type="range"
                    aria-label="Prix maximum"
                    min={min}
                    max={max}
                    step={step}
                    value={hi}
                    onChange={(e) => onChange([lo, Math.max(snap(Number(e.target.value)), lo + step)])}
                    className="range-thumb absolute inset-0 w-full"
                    style={{ zIndex: 4 }}
                />
            </div>
        </div>
    );
}