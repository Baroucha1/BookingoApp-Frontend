import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils.ts';
import MobileFilterSheet from './MobileFilterSheet';
import StopsSheetContent from './sheets/StopsSheetContent';
import TimingSheetContent from './sheets/TimingSheetContent';
import PriceSheetContent from './sheets/PriceSheetContent';
import AirlineSheetContent from './sheets/AirlineSheetContent';
import RefundabilitySheetContent from './sheets/RefundabilitySheetContent';
import BaggageSheetContent from './sheets/BaggageSheetContent';
import {
    type Filters,
    defaultFilters,
    isStopsActive,
    isTimingActive,
    isPriceActive,
    isAirlineActive,
    isBaggageActive,
    isRefundabilityActive,
} from '@/service/flights_aggregator/filterHelpers';
import type { DisplayOffer } from '@/service/flights_aggregator/aggregatedNormalize';

type SheetKey = 'price' | 'timing' | 'stops' | 'airline' | 'refund' | 'baggage' | null;

interface Props {
    filters: Filters;
    onChange: (f: Filters) => void;
    offers: DisplayOffer[];
    maxAvailablePrice: number;
    isRoundTrip: boolean;
}

export default function FilterPillBar({ filters, onChange, offers, maxAvailablePrice, isRoundTrip }: Props) {
    const [openSheet, setOpenSheet] = useState<SheetKey>(null);
    const [draft, setDraft] = useState<Filters>(filters);

    const openWithDraft = (key: Exclude<SheetKey, null>) => {
        setDraft(filters); // always start the sheet from the last *committed* state
        setOpenSheet(key);
    };

    const close = () => setOpenSheet(null);

    const apply = () => {
        onChange(draft);
        close();
    };

    // resets only the slice belonging to the currently open sheet
    const resetSlice = () => {
        const fresh = defaultFilters(maxAvailablePrice);
        setDraft((d) => {
            switch (openSheet) {
                case 'price': return { ...d, minPrice: fresh.minPrice, maxPrice: fresh.maxPrice };
                case 'timing': return { ...d, departureTimeBlocks: fresh.departureTimeBlocks, arrivalTimeBlocks: fresh.arrivalTimeBlocks };
                case 'stops': return { ...d, stops: fresh.stops };
                case 'airline': return { ...d, airlines: fresh.airlines };
                case 'baggage': return { ...d, baggage: fresh.baggage };
                case 'refund': return { ...d, refundability: fresh.refundability };
                default: return d;
            }
        });
    };

    const pills: { key: Exclude<SheetKey, null>; label: string; active: boolean }[] = [
        { key: 'price', label: 'Prix', active: isPriceActive(filters) },
        { key: 'timing', label: 'Horaires', active: isTimingActive(filters) },
        { key: 'stops', label: 'Escales', active: isStopsActive(filters) },
        { key: 'airline', label: 'Compagnie', active: isAirlineActive(filters) },
        { key: 'refund', label: 'Remboursabilité', active: isRefundabilityActive(filters) },
        { key: 'baggage', label: 'Bagages', active: isBaggageActive(filters) },
    ];

    return (
        <>
            <div className="md:hidden -mx-4 px-4 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex items-center gap-2 min-w-max py-1">
                    {pills.map((p) => (
                        <button
                            key={p.key}
                            type="button"
                            onClick={() => openWithDraft(p.key)}
                            className={cn(
                                'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border shrink-0 transition',
                                p.active ? 'bg-[#3566E3] text-white border-[#3566E3]' : 'bg-white text-slate-700 border-slate-200'
                            )}
                        >
                            {p.label}
                            <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                        </button>
                    ))}
                </div>
            </div>

            <MobileFilterSheet open={openSheet === 'price'} title="Prix" onClose={close} onReset={resetSlice} onApply={apply}>
                <PriceSheetContent draft={draft} setDraft={setDraft} offers={offers} maxAvailablePrice={maxAvailablePrice} />
            </MobileFilterSheet>

            <MobileFilterSheet open={openSheet === 'timing'} title="Horaires" onClose={close} onReset={resetSlice} onApply={apply}>
                <TimingSheetContent draft={draft} setDraft={setDraft} isRoundTrip={isRoundTrip} />
            </MobileFilterSheet>

            <MobileFilterSheet open={openSheet === 'stops'} title="Escales" onClose={close} onReset={resetSlice} onApply={apply}>
                <StopsSheetContent draft={draft} setDraft={setDraft} isRoundTrip={isRoundTrip} />
            </MobileFilterSheet>

            <MobileFilterSheet open={openSheet === 'airline'} title="Compagnies aériennes" onClose={close} onReset={resetSlice} onApply={apply}>
                <AirlineSheetContent draft={draft} setDraft={setDraft} offers={offers} />
            </MobileFilterSheet>

            <MobileFilterSheet open={openSheet === 'refund'} title="Remboursabilité" onClose={close} onReset={resetSlice} onApply={apply}>
                <RefundabilitySheetContent draft={draft} setDraft={setDraft} />
            </MobileFilterSheet>
            <MobileFilterSheet open={openSheet === 'baggage'} title="Bagages" onClose={close} onReset={resetSlice} onApply={apply}>
                        <BaggageSheetContent draft={draft} setDraft={setDraft} />
                      </MobileFilterSheet>
        </>
    );
}