import { Hero } from '@/components/flights/indexPage/Hero.tsx';
import { Partners } from '@/components/home/Partners';
import BudgetDestinations from "@/components/flights/indexPage/BudgetDestinations.tsx";
import PriceDropsCarousel from "@/components/flights/indexPage/PriceDropsCarousel.tsx";
import TopAirlinesCarousel from "@/components/flights/indexPage/TopAirlinesCarousel.tsx";
import TravelInspiration from "@/components/flights/indexPage/TravelInspiration.tsx";
import {Sparkles} from "lucide-react";
import { useLanguage } from '@/i18n/LanguageContext';


const FlightPage = () => {
    const { t } = useLanguage();
    return (
        <div className="min-h-screen bg-[#DFECFF]">
            <Hero />
            {/* Offres du moment — suspendu */}
            <div className="relative">
                <div className="pointer-events-none select-none blur-sm opacity-60">
                    <BudgetDestinations />
                    <PriceDropsCarousel />
                </div>
                <div className="absolute inset-0 flex items-center justify-center px-6">
                    <div className="bg-white/90 backdrop-blur-sm border border-amber-200 rounded-2xl px-8 py-6 shadow-lg flex items-center gap-4 max-w-md text-center sm:text-left sm:flex-row flex-col">
                        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                            <Sparkles className="w-6 h-6 text-amber-500" />
                        </div>
                        <p className="font-semibold text-gray-800 text-lg">
                            {t('homeOffersSoon')}
                        </p>
                    </div>
                </div>
            </div>


            <TopAirlinesCarousel />
            <TravelInspiration />
            <Partners />
        </div>
    );
};

export default FlightPage;