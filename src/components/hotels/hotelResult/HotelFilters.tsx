import { Star } from 'lucide-react';
import { AMENITY_LABELS } from '@/lib/hotelAmenities';

function PriceHistogram({ prices, max }: { prices: number[]; max: number }) {
    const BUCKETS = 20;
    const bucketSize = max / BUCKETS;
    const counts = new Array(BUCKETS).fill(0);
    prices.forEach((p) => {
        const idx = Math.min(BUCKETS - 1, Math.floor(p / bucketSize));
        counts[idx]++;
    });
    const maxCount = Math.max(1, ...counts);

    return (
        <div className="flex items-end gap-[2px] h-10 mb-1">
            {counts.map((c, i) => (
                <div key={i} className="flex-1 bg-slate-300 rounded-sm" style={{ height: `${(c / maxCount) * 100}%` }} />
            ))}
        </div>
    );
}

export interface HotelFiltersProps {
    prices: number[];
    dataMaxPrice: number;
    priceMax: number;
    currency: string;
    onPriceMaxChange: (value: number) => void;
    selectedStars: number[];
    onToggleStar: (n: number) => void;
    selectedAmenities: string[];
    onToggleAmenity: (a: string) => void;
    onReset: () => void;
    className?: string;
}

export default function HotelFilters({
                                         prices, dataMaxPrice, priceMax, currency, onPriceMaxChange,
                                         selectedStars, onToggleStar, selectedAmenities, onToggleAmenity, onReset, className = '',
                                     }: HotelFiltersProps) {
    const sliderMax = dataMaxPrice || 1;

    return (
        <div className={`bg-white rounded-xl border border-slate-100 p-4 ${className}`}>
            <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-sm text-slate-700">Filtres</span>
                <button onClick={onReset} className="text-xs text-[#1775FF] hover:underline">
                    Réinitialiser
                </button>
            </div>

            <div className="mb-5">
                <div className="text-xs font-semibold text-slate-600 mb-2">Prix par nuit</div>
                <PriceHistogram prices={prices} max={sliderMax} />
                <input
                    type="range"
                    min={0}
                    max={sliderMax}
                    value={priceMax}
                    onChange={(e) => onPriceMaxChange(Number(e.target.value))}
                    className="w-full accent-[#1775FF]"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                    <span>0 {currency}</span>
                    <span>{priceMax}+ {currency}</span>
                </div>
            </div>

            <div className="mb-5">
                <div className="text-xs font-semibold text-slate-600 mb-2">Étoiles</div>
                {[5, 4, 3, 2, 1].map((n) => (
                    <label key={n} className="flex items-center gap-2 text-sm py-1.5 cursor-pointer">
                        <input type="checkbox" checked={selectedStars.includes(n)} onChange={() => onToggleStar(n)} />
                        <span className="flex items-center gap-0.5">
                            {Array.from({ length: n }, (_, i) => (
                                <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                            ))}
                        </span>
                        <span className="text-slate-500">{n} étoile{n > 1 ? 's' : ''}</span>
                    </label>
                ))}
            </div>

            <div>
                <div className="text-xs font-semibold text-slate-600 mb-2">Équipements</div>
                {AMENITY_LABELS.map((a) => (
                    <label key={a} className="flex items-center gap-2 text-sm py-1.5 cursor-pointer">
                        <input type="checkbox" checked={selectedAmenities.includes(a)} onChange={() => onToggleAmenity(a)} />
                        {a}
                    </label>
                ))}
            </div>
        </div>
    );
}