import { useCallback, useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

import BottomSheet from './BottomSheet';
import { AmenitiesFilterSection, PriceFilterSection, StarsFilterSection, toggleItem } from './filterSections';
import type { HotelFiltersProps } from './HotelFilters';
import {EMPTY_FILTERS, HotelFilterState} from "@/service/hotels/hotels.service.ts";
import {formatPriceCompact, normalizeRange} from "@/lib/hotelPricee.ts";

type SheetKey = 'price' | 'stars' | 'amenities';

const SHEET_TITLES: Record<SheetKey, string> = {
    price: 'Prix par nuit',
    stars: 'Étoiles',
    amenities: 'Équipements',
};

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium border shadow-sm transition-colors ${
                active ? 'bg-[#1775FF] border-[#1775FF] text-white' : 'bg-white border-slate-200 text-slate-700'
            }`}
        >
            {label}
            <ChevronDown className="w-4 h-4" />
        </button>
    );
}

export default function HotelFilterPills({
                                             prices, priceBounds, filters, onChange, currency, className = '',
                                         }: HotelFiltersProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [sheet, setSheet] = useState<SheetKey>('price'); // kept after close so content doesn't vanish mid-animation
    const [draft, setDraft] = useState<HotelFilterState>(filters);

    const openSheet = (key: SheetKey) => {
        setDraft(filters);
        setSheet(key);
        setIsOpen(true);
    };
    const close = useCallback(() => setIsOpen(false), []);

    // Only commit the field belonging to the open sheet
    const mergeField = (source: HotelFilterState): HotelFilterState => {
        if (sheet === 'price') return { ...filters, priceRange: source.priceRange };
        if (sheet === 'stars') return { ...filters, stars: source.stars };
        return { ...filters, amenities: source.amenities };
    };

    const apply = () => { onChange(mergeField(draft)); close(); };
    const reset = () => { onChange(mergeField(EMPTY_FILTERS)); close(); };

    const priceLabel = filters.priceRange
        ? `${formatPriceCompact(filters.priceRange[0])} – ${formatPriceCompact(filters.priceRange[1])}${
            filters.priceRange[1] >= priceBounds[1] ? '+' : ''
        } ${currency}`
        : 'Prix';
    const starsLabel = filters.stars.length
        ? [...filters.stars].sort((a, b) => b - a).map((n) => `${n}★`).join(', ')
        : 'Étoiles';
    const amenitiesLabel = filters.amenities.length ? `Équipements (${filters.amenities.length})` : 'Équipements';
    const anyActive = filters.priceRange !== null || filters.stars.length > 0 || filters.amenities.length > 0;

    return (
        <>
            <div className={`flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 py-1 ${className}`}>
                {anyActive && (
                    <button
                        type="button"
                        onClick={() => onChange(EMPTY_FILTERS)}
                        aria-label="Réinitialiser les filtres"
                        className="shrink-0 w-9 h-9 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
                <FilterPill label={priceLabel} active={filters.priceRange !== null} onClick={() => openSheet('price')} />
                <FilterPill label={starsLabel} active={filters.stars.length > 0} onClick={() => openSheet('stars')} />
                <FilterPill label={amenitiesLabel} active={filters.amenities.length > 0} onClick={() => openSheet('amenities')} />
            </div>

            <BottomSheet
                open={isOpen}
                onClose={close}
                title={SHEET_TITLES[sheet]}
                footer={
                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            variant="outline"
                            className="h-12 rounded-xl border-[#1775FF] text-[#1775FF] hover:bg-[#DFECFF]/40"
                            onClick={reset}
                        >
                            Réinitialiser
                        </Button>
                        <Button className="h-12 rounded-xl bg-[#1775FF] hover:bg-[#1775FF]/90 text-white" onClick={apply}>
                            Appliquer
                        </Button>
                    </div>
                }
            >
                {sheet === 'price' && (
                    <PriceFilterSection
                        prices={prices}
                        bounds={priceBounds}
                        value={draft.priceRange ?? priceBounds}
                        onChange={(r) => setDraft((d) => ({ ...d, priceRange: normalizeRange(r, priceBounds) }))}
                        currency={currency}
                        showQuickOptions
                    />
                )}
                {sheet === 'stars' && (
                    <StarsFilterSection
                        variant="chips"
                        selected={draft.stars}
                        onToggle={(n) => setDraft((d) => ({ ...d, stars: toggleItem(d.stars, n) }))}
                    />
                )}
                {sheet === 'amenities' && (
                    <AmenitiesFilterSection
                        comfortable
                        selected={draft.amenities}
                        onToggle={(a) => setDraft((d) => ({ ...d, amenities: toggleItem(d.amenities, a) }))}
                    />
                )}
            </BottomSheet>
        </>
    );
}