import { useMemo } from 'react';
import { Slider } from '@/components/ui/slider.tsx';
import { Checkbox } from '@/components/ui/checkbox.tsx';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group.tsx';
import { Label } from '@/components/ui/label.tsx';
import { cn } from '@/lib/utils.ts';
import { Sun, Sunrise, CloudSun, Moon } from 'lucide-react';
import { formatPrice } from '@/service/flights/normalize.ts';
import type { DisplayOffer } from '@/service/flights_aggregator/aggregatedNormalize.ts';
import { getAirlineLogo } from '@/service/flights/airlines.ts';
import {
    type Filters,
    type StopsFilterValue,
    type TimeBlock,
    defaultFilters,
    computePriceHistogram
} from '@/service/flights_aggregator/filterHelpers';

interface Props {
    results: DisplayOffer[];
    filters: Filters;
    onChange: (f: Filters) => void;
    maxAvailablePrice: number;
    isRoundTrip: boolean;
}

const SectionTitle = ({ children, onClear }: { children: React.ReactNode; onClear?: () => void }) => (
    <div className="flex items-center justify-between mb-3">
        <div className="text-xs uppercase tracking-wider text-[#3566E3] font-bold">{children}</div>
        {onClear && (
            <button onClick={onClear} className="text-xs text-[#F5A623] hover:underline font-medium">Effacer</button>
        )}
    </div>
);

const TIME_BLOCKS: { key: TimeBlock; label: string; range: string; icon: React.ReactNode }[] = [
    { key: 'morning_early', label: 'Tôt le matin', range: '00:00–07:59', icon: <Sunrise className="w-4 h-4" /> },
    { key: 'morning', label: 'Matin', range: '08:00–11:59', icon: <Sun className="w-4 h-4" /> },
    { key: 'afternoon', label: 'Après-midi', range: '12:00–15:59', icon: <CloudSun className="w-4 h-4" /> },
    { key: 'evening', label: 'Soir', range: '16:00–23:59', icon: <Moon className="w-4 h-4" /> },
];

const STOPS_OPTIONS: { v: StopsFilterValue; l: string }[] = [
    { v: 'all', l: 'Tous' },
    { v: 'direct', l: 'Direct' },
    { v: 'one', l: '1 escale' },
    { v: 'twoPlus', l: '2 escales ou +' },
];

function toggle<T>(arr: T[], v: T): T[] {
    return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

export default function FilterPanel({ results, filters, onChange, maxAvailablePrice, isRoundTrip }: Props) {
        const directions: ('outbound' | 'return')[] = isRoundTrip ? ['outbound', 'return'] : ['outbound'];    const airlines = useMemo(() => {
        const map = new Map<string, { code: string; name: string; min: number; currency: string }>();
        for (const o of results) {
            if (!o.airlineCode) continue;
            const cur = map.get(o.airlineCode);
            if (!cur || o.price < cur.min) {
                map.set(o.airlineCode, { code: o.airlineCode, name: o.airlineName, min: o.price, currency: o.currency });
            }
        }
        return Array.from(map.values()).sort((a, b) => a.min - b.min);
    }, [results]);

    const resetAll = () => onChange(defaultFilters(maxAvailablePrice));

    const setStops = (direction: 'outbound' | 'return', v: StopsFilterValue) =>
        onChange({ ...filters, stops: { ...filters.stops, [direction]: v } });

    const setDepartureBlocks = (direction: 'outbound' | 'return', blocks: TimeBlock[]) =>
        onChange({ ...filters, departureTimeBlocks: { ...filters.departureTimeBlocks, [direction]: blocks } });

    const setArrivalBlocks = (direction: 'outbound' | 'return', blocks: TimeBlock[]) =>
        onChange({ ...filters, arrivalTimeBlocks: { ...filters.arrivalTimeBlocks, [direction]: blocks } });

    const stopsActive = filters.stops.outbound !== 'all' || filters.stops.return !== 'all';
    const timingActive =
        filters.departureTimeBlocks.outbound.length > 0 ||
        filters.departureTimeBlocks.return.length > 0 ||
        filters.arrivalTimeBlocks.outbound.length > 0 ||
        filters.arrivalTimeBlocks.return.length > 0;

    return (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 space-y-6 text-slate-800">
            <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">Filtrer</h3>
                <button onClick={resetAll} className="text-xs text-[#F5A623] hover:underline font-medium">Réinitialiser</button>
            </div>

            {/* Sort */}
            <div>
                <SectionTitle>Trier par</SectionTitle>
                <select
                    value={filters.sort}
                    onChange={(e) => onChange({ ...filters, sort: e.target.value as Filters['sort'] })}
                    className="w-full h-10 px-3 rounded-lg bg-white border border-slate-300 text-slate-800 text-sm focus:outline-none focus:border-[#3566E3] focus:ring-2 focus:ring-[#3566E3]/15"
                >
                    <option value="price-asc">Prix croissant</option>
                    <option value="price-desc">Prix décroissant</option>
                    <option value="duration">Durée</option>
                    <option value="departure">Heure de départ</option>
                    <option value="arrival">Heure d'arrivée</option>
                </select>
            </div>

            {/* Price range */}{/* Price range */}
            <div>
                <SectionTitle onClear={filters.priceEnabled ? () => onChange({ ...filters, priceEnabled: false, minPrice: 0, maxPrice: maxAvailablePrice }) : undefined}>
                    Prix
                </SectionTitle>
                {(() => {
                    const { buckets, min, max } = computePriceHistogram(results);
                    const maxCount = Math.max(1, ...buckets);
                    const currency = results[0]?.currency ?? 'DZD';
                    const third = (max - min) / 3;

                    const quickOptions = [
                        { label: `Moins de ${formatPrice(Math.round(min + third), currency)}`, minPrice: 0, maxPrice: Math.round(min + third) },
                        { label: `${formatPrice(Math.round(min + third), currency)} – ${formatPrice(Math.round(min + third * 2), currency)}`, minPrice: Math.round(min + third), maxPrice: Math.round(min + third * 2) },
                        { label: `Plus de ${formatPrice(Math.round(min + third * 2), currency)}`, minPrice: Math.round(min + third * 2), maxPrice: max },
                    ];

                    return (
                        <div className="space-y-3">
                            <div className="text-xs text-slate-600 tabular-nums">
                                <span className="text-[#F5A623] font-semibold">{formatPrice(filters.minPrice, currency)}</span>
                                {' – '}
                                <span className="text-[#F5A623] font-semibold">{formatPrice(filters.maxPrice, currency)}</span>
                            </div>
                            
                            <Slider
                                min={0}
                                max={maxAvailablePrice || 100000}
                                step={100}
                                value={[filters.minPrice, filters.maxPrice]}
                                onValueChange={([lo, hi]) => onChange({ ...filters, priceEnabled: true, minPrice: lo, maxPrice: hi })}
                            />

                            <div className="space-y-2 pt-1">
                                {quickOptions.map((o, i) => {
                                    const active = filters.minPrice === o.minPrice && filters.maxPrice === o.maxPrice;
                                    return (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => onChange({ ...filters, priceEnabled: true, minPrice: o.minPrice, maxPrice: o.maxPrice })}                                            className={cn(
                                                'w-full py-2.5 rounded-lg border text-sm font-medium text-left px-3 transition',
                                                active ? 'border-[#3566E3] bg-[#3566E3]/5 text-[#3566E3]' : 'border-slate-200 text-slate-700 hover:border-[#3566E3]/50'
                                            )}
                                        >
                                            {o.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })()}
            </div>

            {/* Stops — outbound / return */}
            <div>
                <SectionTitle onClear={stopsActive ? () => onChange({ ...filters, stops: { outbound: 'all', return: 'all' } }) : undefined}>
                    Escales
                </SectionTitle>
                <div className="space-y-4">
                    {directions.map((direction) => (
                        <div key={direction}>
                                                        {isRoundTrip && (
                                                           <div className="text-xs text-slate-500 mb-1.5">{direction === 'outbound' ? 'Aller' : 'Retour'}</div>
                                                        )}
                            <RadioGroup
                                value={filters.stops[direction]}
                                onValueChange={(v) => setStops(direction, v as StopsFilterValue)}
                                className="space-y-2"
                            >
                                {STOPS_OPTIONS.map((o) => (
                                    <div key={o.v} className="flex items-center gap-2">
                                        <RadioGroupItem value={o.v} id={`stops-${direction}-${o.v}`} className="border-slate-400 text-[#3566E3]" />
                                        <Label htmlFor={`stops-${direction}-${o.v}`} className="text-sm text-slate-700 cursor-pointer">{o.l}</Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>
                    ))}
                </div>
            </div>

            {/* Airlines */}
            {airlines.length > 0 && (
                <div>
                    <SectionTitle onClear={filters.airlines.length > 0 ? () => onChange({ ...filters, airlines: [] }) : undefined}>
                        Compagnies aériennes
                    </SectionTitle>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {airlines.map((a) => (
                            <label key={a.code} className="flex items-center justify-between gap-2 cursor-pointer">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        checked={filters.airlines.includes(a.code)}
                                        onCheckedChange={() => onChange({ ...filters, airlines: toggle(filters.airlines, a.code) })}
                                        className="border-slate-400 data-[state=checked]:bg-[#3566E3] data-[state=checked]:text-white data-[state=checked]:border-[#3566E3]"
                                    />
                                    <img
                                        src={getAirlineLogo(a.code)}
                                        alt={a.name}
                                        className="w-7 h-7 object-cover"
                                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                    />
                                    <span className="text-sm text-slate-700">{a.name}</span>
                                </div>
                                <span className="text-xs text-slate-500 tabular-nums">{formatPrice(a.min, a.currency)}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {/* Timing — departure & arrival, outbound / return */}
            <div>
                <SectionTitle onClear={timingActive ? () => onChange({
                    ...filters,
                    departureTimeBlocks: { outbound: [], return: [] },
                    arrivalTimeBlocks: { outbound: [], return: [] },
                }) : undefined}>
                    Horaires
                </SectionTitle>
                <div className="space-y-4">
                    {directions.map((direction) => (
                        <div key={direction} className="space-y-3">
                                                       {isRoundTrip && (
                                                           <div className="text-xs text-slate-500">{direction === 'outbound' ? 'Aller' : 'Retour'}</div>
                                                        )}
                            <div>
                                <div className="text-[11px] text-slate-400 mb-1.5">Départ</div>
                                <div className="grid grid-cols-2 gap-2">
                                    {TIME_BLOCKS.map((tb) => {
                                        const active = filters.departureTimeBlocks[direction].includes(tb.key);
                                        return (
                                            <button
                                                key={tb.key}
                                                type="button"
                                                onClick={() => setDepartureBlocks(direction, toggle(filters.departureTimeBlocks[direction], tb.key))}
                                                className={cn(
                                                    'flex flex-col items-start gap-1 px-3 py-2 rounded-lg border text-left transition',
                                                    active ? 'bg-[#F5A623] border-[#F5A623] text-[#0B0F2E]' : 'bg-white border-slate-200 text-slate-700 hover:border-[#3566E3]/50'
                                                )}
                                            >
                                                <div className="flex items-center gap-1.5">
                                                    {tb.icon}
                                                    <span className="text-xs font-medium">{tb.label}</span>
                                                </div>
                                                <span className={cn('text-[10px]', active ? 'text-[#0B0F2E]/70' : 'text-slate-500')}>{tb.range}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <div className="text-[11px] text-slate-400 mb-1.5">Arrivée</div>
                                <div className="grid grid-cols-2 gap-2">
                                    {TIME_BLOCKS.map((tb) => {
                                        const active = filters.arrivalTimeBlocks[direction].includes(tb.key);
                                        return (
                                            <button
                                                key={tb.key}
                                                type="button"
                                                onClick={() => setArrivalBlocks(direction, toggle(filters.arrivalTimeBlocks[direction], tb.key))}
                                                className={cn(
                                                    'flex flex-col items-start gap-1 px-3 py-2 rounded-lg border text-left transition',
                                                    active ? 'bg-[#F5A623] border-[#F5A623] text-[#0B0F2E]' : 'bg-white border-slate-200 text-slate-700 hover:border-[#3566E3]/50'
                                                )}
                                            >
                                                <div className="flex items-center gap-1.5">
                                                    {tb.icon}
                                                    <span className="text-xs font-medium">{tb.label}</span>
                                                </div>
                                                <span className={cn('text-[10px]', active ? 'text-[#0B0F2E]/70' : 'text-slate-500')}>{tb.range}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Refundability */}
            <div>
                <SectionTitle onClear={filters.refundability !== 'all' ? () => onChange({ ...filters, refundability: 'all' }) : undefined}>
                    Remboursabilité
                </SectionTitle>
                <RadioGroup
                    value={filters.refundability}
                    onValueChange={(v) => onChange({ ...filters, refundability: v as Filters['refundability'] })}
                    className="space-y-2"
                >
                    {[
                        { v: 'all', l: 'Tous les billets' },
                        { v: 'refundable', l: 'Remboursable' },
                        { v: 'non_refundable', l: 'Non-remboursable' },
                    ].map((o) => (
                        <div key={o.v} className="flex items-center gap-2">
                            <RadioGroupItem value={o.v} id={`refund-${o.v}`} className="border-slate-400 text-[#3566E3]" />
                            <Label htmlFor={`refund-${o.v}`} className="text-sm text-slate-700 cursor-pointer">{o.l}</Label>
                        </div>
                    ))}
                </RadioGroup>
            </div>

            {/* Baggage */}

                        <div>
                            <SectionTitle onClear={filters.baggage !== 'all' ? () => onChange({ ...filters, baggage: 'all' }) : undefined}>
                                Bagages
                            </SectionTitle>
                            <RadioGroup
                                value={filters.baggage}
                                onValueChange={(v) => onChange({ ...filters, baggage: v as Filters['baggage'] })}
                                className="space-y-2"
                            >
                                {[
                                    { v: 'all', l: 'Peu importe' },
                                    { v: 'with', l: 'Avec bagage en soute' },
                                   { v: 'cabin_only', l: 'Cabine uniquement' },
                               ].map((o) => (
                                    <div key={o.v} className="flex items-center gap-2">
                                            <RadioGroupItem value={o.v} id={`baggage-${o.v}`} className="border-slate-400 text-[#3566E3]" />
                                            <Label htmlFor={`baggage-${o.v}`} className="text-sm text-slate-700 cursor-pointer">{o.l}</Label>
                                        </div>
                                ))}
                            </RadioGroup>
                        </div>

        </div>
    );
}