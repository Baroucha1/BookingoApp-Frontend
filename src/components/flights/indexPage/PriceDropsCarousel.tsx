import { useRef } from 'react';
import { ArrowRight, ChevronRight, Clock, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button.tsx';
import {PriceDrop, priceDrops} from "@/data/flights.ts";
import { useLanguage } from '@/i18n/LanguageContext';



function PriceDropCard({ deal }: { deal: PriceDrop }) {
    const { t } = useLanguage();
    return (
        <div className="shrink-0 w-[280px] rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">


            {/* Route header with world-map texture */}
            <div
                className="relative px-4 pt-3 pb-2.5 bg-[#EAF1FF] h-16"
                style={{
                    backgroundImage: "url('/assets/flights/mp.jpg')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                }}
            >
                <div className="flex items-center gap-1.5 text-[#002161] font-bold text-sm">
                    {deal.originCity}
                    <ArrowRight className="w-3.5 h-3.5 text-[#0454E8] shrink-0" />
                    {deal.destCity}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[#64748B] mt-0.5">
                    <span>{deal.originCode}</span>
                    <span className="w-3.5" />
                    <span>{deal.destCode}</span>
                </div>
            </div>

            {/* Price row */}
            <div className="px-4 pt-3 flex items-center justify-between">
                <div>
                    <div className="text-[10px] uppercase tracking-wide text-[#94A3B8] font-medium">{t('flightsWas')}</div>
                    <div className="text-sm text-gray-400 line-through">{deal.oldPrice} DZD</div>
                </div>
                <div className="text-right">
                    <div className="text-[10px] uppercase tracking-wide text-[#94A3B8] font-medium">{t('flightsToday')}</div>
                    <div className="text-sm font-bold text-[#16A34A]">{deal.newPrice} DZD</div>
                </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 mt-2 border-t border-[#F1F5F9] flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
                    <Clock className="w-3.5 h-3.5 text-[#0454E8]" />
                    {t('flightsDepartureLabel')} {deal.departDate}
                </div>
                {deal.seatsRemaining != null && (
                    <div className="flex items-center gap-1 text-xs font-semibold text-red-500">
                        <Flame className="w-3.5 h-3.5" />
                        {deal.seatsRemaining} {t('flightsSeatsRemaining')}
                    </div>
                )}
            </div>
        </div>
    );
}

export const PriceDropsCarousel = () => {
    const { t } = useLanguage();
    const trackRef = useRef<HTMLDivElement>(null);

    const scrollNext = () => {
        trackRef.current?.scrollBy({ left: 296, behavior: 'smooth' });
    };

    return (
        <section className="max-w-6xl mx-auto px-4 mt-16">
            <div className="rounded-2xl bg-gradient-to-br from-[#DCE9FF] to-[#EAF1FF] p-6 md:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8 items-center">
                    {/* Left panel */}
                    <div className="flex flex-col gap-4">
                        <div>
                            <h2 className="text-xl md:text-2xl font-bold text-[#002161] leading-snug">
                                {t('flightsPriceOpportunities')}
                            </h2>
                            <p className="text-sm text-[#0454E8]/80 mt-2 leading-relaxed">
                                {t('flightsPriceDescription')}
                            </p>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full py-3 h-auto rounded-xl bg-white border-2 border-[#0454E8] text-[#0454E8] hover:bg-[#0454E8] hover:text-white font-semibold text-sm transition-colors"
                        >
                            {t('flightsShowDestinations')}
                        </Button>
                    </div>

                    {/* Right — price drop cards */}
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 z-10 bg-gradient-to-l from-[#EAF1FF] to-transparent" />

                        <div
                            ref={trackRef}
                            className="flex gap-4 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                        >
                            {priceDrops.map((deal) => (
                                <PriceDropCard key={`${deal.originCode}-${deal.destCode}`} deal={deal} />
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={scrollNext}
                            aria-label={t('flightsMore')}
                            className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white shadow-lg items-center justify-center text-[#0454E8] hover:bg-[#F1F5F9] transition-colors"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default PriceDropsCarousel;