import { useRef } from 'react';
import { ChevronLeft, ChevronRight, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NearbyDatePrice } from '@/service/flights_aggregator/aggregatedSearch.service';

interface Props {
    dates: NearbyDatePrice[];
    selectedDate: string;
    onSelectDate: (date: string) => void;
}

function fmtRange(dateStr: string) {
    const d = new Date(dateStr + 'T00:00:00');
    const end = new Date(d);
    end.setDate(end.getDate() + 6); // adjust if you want a real range per card; placeholder mirrors screenshot style
    const dayLabel = d.toLocaleDateString('fr-FR', { weekday: 'short' });
    const dateLabel = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    return { dayLabel, dateLabel };
}

export default function NearbyDatesCarousel({ dates, selectedDate, onSelectDate }: Props) {
    const scrollRef = useRef<HTMLDivElement>(null);

    if (!dates.length) return null;

    const cheapestPrice = Math.min(...dates.map((d) => d.price));

    return (
        <div className="relative bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-md p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#0865FE]">
                    <div className="p-1.5 rounded-lg bg-blue-50 text-[#0865FE]">
                        <Tag className="w-4 h-4" />
                    </div>
                    <span>Dates & Meilleures offres</span>
                </div>
                <span className="text-[10px] font-semibold text-slate-400">Glisser &rarr;</span>
            </div>

            <div
                ref={scrollRef}
                className="flex items-center gap-2.5 overflow-x-auto scroll-smooth snap-x snap-mandatory py-1 px-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
                {dates.map((d) => {
                    const { dayLabel, dateLabel } = fmtRange(d.date);
                    const isSelected = d.date === selectedDate;
                    const isCheapest = d.price === cheapestPrice;

                    return (
                        <button
                            key={d.date}
                            type="button"
                            onClick={() => onSelectDate(d.date)}
                            className={cn(
                                'snap-start shrink-0 flex flex-col items-center justify-between p-2.5 sm:p-3 rounded-xl border text-center min-w-[105px] sm:min-w-[125px] transition-all duration-200 active:scale-95',
                                isSelected
                                    ? 'border-[#0865FE] bg-gradient-to-b from-blue-50/90 to-blue-100/60 shadow-md ring-2 ring-[#0865FE]/20'
                                    : 'border-slate-200/90 bg-white hover:bg-slate-50/80 shadow-xs'
                            )}
                        >
                            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{dayLabel}</span>
                            <span className="text-xs font-bold text-slate-800 my-0.5">{dateLabel}</span>
                            <span className={cn('text-sm sm:text-base font-extrabold tabular-nums', isSelected ? 'text-[#0865FE]' : 'text-[#002161]')}>
                                {d.price.toLocaleString('fr-FR')} <span className="text-[10px] font-normal">{d.currency}</span>
                            </span>
                            {isCheapest ? (
                                <span className="mt-1.5 text-[9px] font-bold text-white bg-emerald-500 px-2 py-0.5 rounded-full shadow-xs">
                                    Moins cher
                                </span>
                            ) : (
                                <span className="h-4" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}