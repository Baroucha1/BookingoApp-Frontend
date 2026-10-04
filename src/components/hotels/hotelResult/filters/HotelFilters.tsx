import type { ReactNode } from 'react';

import { AmenitiesFilterSection, PriceFilterSection, StarsFilterSection, toggleItem } from './filterSections';
import {EMPTY_FILTERS, HotelFilterState} from "@/service/hotels/hotels.service.ts";
import {normalizeRange, PriceRange} from "@/lib/hotelPricee.ts";

export interface HotelFiltersProps {
    prices: number[];
    priceBounds: PriceRange;
    filters: HotelFilterState;
    onChange: (next: HotelFilterState) => void;
    currency: string;
    className?: string;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <div className="mb-5 last:mb-0">
            <div className="text-xs font-semibold text-slate-600 mb-2">{title}</div>
            {children}
        </div>
    );
}

export default function HotelFilters({
                                         prices, priceBounds, filters, onChange, currency, className = '',
                                     }: HotelFiltersProps) {
    return (
        <div className={`bg-white rounded-xl border border-slate-100 p-4 ${className}`}>
            <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-sm text-slate-700">Filtres</span>
                <button onClick={() => onChange(EMPTY_FILTERS)} className="text-xs text-[#1775FF] hover:underline">
                    Réinitialiser
                </button>
            </div>

            <Section title="Prix par nuit">
                <PriceFilterSection
                    prices={prices}
                    bounds={priceBounds}
                    value={filters.priceRange ?? priceBounds}
                    onChange={(r) => onChange({ ...filters, priceRange: normalizeRange(r, priceBounds) })}
                    currency={currency}
                />
            </Section>

            <Section title="Étoiles">
                <StarsFilterSection
                    selected={filters.stars}
                    onToggle={(n) => onChange({ ...filters, stars: toggleItem(filters.stars, n) })}
                />
            </Section>

            <Section title="Équipements">
                <AmenitiesFilterSection
                    selected={filters.amenities}
                    onToggle={(a) => onChange({ ...filters, amenities: toggleItem(filters.amenities, a) })}
                />
            </Section>
        </div>
    );
}