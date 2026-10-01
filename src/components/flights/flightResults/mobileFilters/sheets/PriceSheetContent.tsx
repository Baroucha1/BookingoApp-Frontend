import { Slider } from '@/components/ui/slider.tsx';
import { formatPrice } from '@/service/flights/normalize.ts';
import { computePriceHistogram, type Filters } from '@/service/flights_aggregator/filterHelpers';
import type { DisplayOffer } from '@/service/flights_aggregator/aggregatedNormalize';
import { cn } from '@/lib/utils.ts';

interface Props {
    draft: Filters;
    setDraft: React.Dispatch<React.SetStateAction<Filters>>;
    offers: DisplayOffer[];
    maxAvailablePrice: number;
}

export default function PriceSheetContent({ draft, setDraft, offers, maxAvailablePrice }: Props) {
    const { buckets, min, max } = computePriceHistogram(offers);
    const maxCount = Math.max(1, ...buckets);
    const currency = offers[0]?.currency ?? 'DZD';
    const third = (max - min) / 3;

    const quickOptions = [
        { label: `Moins de ${formatPrice(Math.round(min + third), currency)}`, minPrice: 0, maxPrice: Math.round(min + third) },
        { label: `${formatPrice(Math.round(min + third), currency)} – ${formatPrice(Math.round(min + third * 2), currency)}`, minPrice: Math.round(min + third), maxPrice: Math.round(min + third * 2) },
        { label: `Plus de ${formatPrice(Math.round(min + third * 2), currency)}`, minPrice: Math.round(min + third * 2), maxPrice: max },
    ];

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between text-sm font-semibold text-[#0B0F2E]">
                <span>{formatPrice(draft.minPrice, currency)}</span>
                <span>{formatPrice(draft.maxPrice, currency)}</span>
            </div>

            {buckets.length > 0 && (
                <div className="flex items-end gap-1 h-16">
                    {buckets.map((count, i) => (
                        <div
                            key={i}
                            className="flex-1 bg-[#3566E3]/70 rounded-sm"
                            style={{ height: `${Math.max(4, (count / maxCount) * 100)}%` }}
                        />
                    ))}
                </div>
            )}

            <Slider
                min={0}
                max={maxAvailablePrice || 200000}
                step={100}
                value={[draft.minPrice, draft.maxPrice]}
                onValueChange={([lo, hi]) => setDraft((d) => ({ ...d, minPrice: lo, maxPrice: hi }))}
            />

            <div className="space-y-2 pt-2">
                <div className="text-xs uppercase tracking-wider text-slate-400 font-bold">Options rapides</div>
                {quickOptions.map((o, i) => {
                    const active = draft.minPrice === o.minPrice && draft.maxPrice === o.maxPrice;
                    return (
                        <button
                            key={i}
                            type="button"
                            onClick={() => setDraft((d) => ({ ...d, minPrice: o.minPrice, maxPrice: o.maxPrice }))}
                            className={cn(
                                'w-full py-3 rounded-xl border text-sm font-medium text-left px-4',
                                active ? 'border-[#3566E3] bg-[#3566E3]/5 text-[#3566E3]' : 'border-slate-200 text-slate-700'
                            )}
                        >
                            {o.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}