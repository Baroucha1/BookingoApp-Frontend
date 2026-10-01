import { ArrowRight, ChevronRight } from 'lucide-react';
import { deals } from '@/data/data.ts';
import { DealCard } from './DealCard';
import { Button } from '@/components/ui/button';

export const OffresDuMoment = () => {
    return (
        <section className="max-w-6xl mx-auto px-4 mt-16 overflow-x-hidden">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-[#002161]">Offres du moment</h2>
                <Button asChild variant="ghost" className="flex items-center gap-1 text-sm font-semibold text-[#0454E8] hover:text-[#0454E8]">
                    <a href="#">
                        Découvrir toutes les offres <ArrowRight className="w-4 h-4" />
                    </a>
                </Button>
            </div>

            <div className="relative">
                <div className="md:hidden pointer-events-none absolute inset-y-0 right-0 w-14 z-10 bg-gradient-to-l from-white to-transparent flex items-center justify-end pr-1">
                    <ChevronRight className="w-5 h-5 text-[#0454E8]" />
                </div>

                <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-2 md:grid md:grid-cols-4 md:gap-5 md:overflow-visible items-stretch [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {deals.map((d, i) => (
                        <div key={d.city} className="snap-start shrink-0 w-[78%] sm:w-[55%] md:w-auto">
                        <DealCard key={d.city} deal={d} index={i} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default OffresDuMoment;