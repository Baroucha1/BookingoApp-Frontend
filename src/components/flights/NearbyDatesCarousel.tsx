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

    const scroll = (dir: 'left' | 'right') => {
        scrollRef.current?.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' });
    };

    return (
        <div className="relative bg-blue-50 rounded-xl border border-slate-200 shadow-sm p-3 mb-6">
            <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-[#0454E8]">
                <Tag className="w-4 h-4" />
                Prix les plus bas sur les dates proches
            </div>

            <div
                ref={scrollRef}
                className="flex items-stretch gap-3 overflow-x-auto scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
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
                                'shrink-0 flex flex-col items-center justify-center gap-1 px-6 py-5 rounded-xl border text-center min-w-[150px] transition',
                                isSelected
                                    ? 'border-[#0454E8] bg-[#EFF6FF] shadow-sm'
                                    : 'border-slate-200 bg-white hover:border-[#0454E8]/40',
                            )}
                        >
                            <span className="text-sm text-slate-500">{dateLabel}</span>
                            <span className="text-2xl font-bold text-[#0B0F2E]">
        {d.price.toLocaleString('fr-FR')}
    </span>
                            <span className="text-xs text-slate-400 capitalize">{dayLabel}</span>
                            {isCheapest && (
                                <span className="mt-1 text-xs font-semibold text-white bg-[#0454E8] rounded-full px-2.5 py-1">
            Meilleur prix
        </span>
                            )}
                        </button>
                    );
                })}
            </div>


        </div>
    );
}