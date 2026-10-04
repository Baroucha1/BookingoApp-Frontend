import { useState, useRef } from 'react';
import { ChevronRight, ChevronDown, MapPin } from 'lucide-react';
import { budgetDestinations, budgetOptions } from '@/data/flights.ts';
import { cn } from '@/lib/utils.ts';
import { useLanguage } from '@/i18n/LanguageContext';

export const BudgetDestinations = () => {
    const { t } = useLanguage();
    const [budget, setBudget] = useState(budgetOptions[2]);
    const [budgetOpen, setBudgetOpen] = useState(false);
    const trackRef = useRef<HTMLDivElement>(null);

    const scrollNext = () => {
        trackRef.current?.scrollBy({ left: 240, behavior: 'smooth' });
    };

    return (
        <section className="max-w-6xl mx-auto px-4 mt-16">
            <div className="rounded-2xl bg-[#EAF1FF] p-6 md:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-center">
                    {/* Left panel */}
                    <div className="flex flex-col gap-4">
                        <div>
                            <h2 className="text-xl md:text-2xl font-bold text-[#002161] leading-snug">
                                {t('flightsBudgetTitle')}
                            </h2>
                            <p className="text-sm text-[#0454E8]/80 mt-2 leading-relaxed">
                                {t('flightsBudgetDescription')}
                            </p>
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-sm font-semibold text-[#0454E8]">{t('flightsBudgetAmount')}</span>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setBudgetOpen((v) => !v)}
                                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white border-2 border-[#1775FF] text-[#0454E8] font-bold text-base"
                                >
                                    {budget}
                                    <ChevronDown className={cn('w-4 h-4 transition-transform', budgetOpen && 'rotate-180')} />
                                </button>
                                {budgetOpen && (
                                    <div className="absolute z-20 left-0 right-0 mt-2 bg-white border border-[#E2E8F0] rounded-xl shadow-xl overflow-hidden">
                                        {budgetOptions.map((opt) => (
                                            <button
                                                key={opt}
                                                type="button"
                                                onClick={() => { setBudget(opt); setBudgetOpen(false); }}
                                                className="w-full text-left px-4 py-2.5 text-sm font-medium text-[#002161] hover:bg-[#F1F5F9] transition-colors"
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            type="button"
                            className="w-full py-3 rounded-xl bg-[#0454E8] hover:bg-[#0454E8]/90 text-white font-semibold text-sm transition-colors"
                        >
                            {t('flightsShowDestinations')}
                        </button>
                    </div>

                    {/* Right — destination cards */}
                    <div className="relative">
                        {/*<div className="pointer-events-none absolute inset-y-0 right-0 w-16 z-10 bg-gradient-to-l from-[#EAF1FF] to-transparent" />*/}

                        <div
                            ref={trackRef}
                            className="flex gap-4 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                        >
                            {budgetDestinations.map((d) => (
                                <div
                                    key={d.city}
                                    className="relative shrink-0 w-[180px] h-[240px] rounded-2xl overflow-hidden"
                                >
                                    <img
                                        src={d.image}
                                        alt={d.city}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                                    <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                                        <div className="font-bold text-base leading-tight">{d.city}</div>
                                        <div className="flex items-center gap-1 text-xs mt-1 text-white/90">
                                            <MapPin className="w-3 h-3 text-[#FFAA01] shrink-0" />
                                            {d.country}
                                        </div>
                                        <div className="text-[10px] text-white/70 mt-2">{t('flightsFrom')}</div>
                                        <div className="font-bold text-sm">{d.price} DZD</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/*<button
                            type="button"
                            onClick={scrollNext}
                            aria-label="Voir plus"
                            className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white shadow-lg items-center justify-center text-[#0454E8] hover:bg-[#F1F5F9] transition-colors"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>*/}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default BudgetDestinations;