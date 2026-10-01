// components/flights/TopAirlinesCarousel.tsx
import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button.tsx';
import { useLanguage } from '@/i18n/LanguageContext';

interface Airline {
    name: string;
    logo: string;
    totalDestinations: number;
    domesticDestinations: number;
    internationalDestinations: number;
    countries: number;
}

const topAirlines: Airline[] = [
    {
        name: 'AIR ALGERIE',
        logo: '/assets/home/airalg.webp',
        totalDestinations: 97,
        domesticDestinations: 33,
        internationalDestinations: 64,
        countries: 41,
    },
    {
        name: 'QATAR AIRWAYS',
        logo: '/assets/home/qr.webp',
        totalDestinations: 189,
        domesticDestinations: 1,
        internationalDestinations: 188,
        countries: 90,
    },
    {
        name: 'TURKISH AIRLINES',
        logo: '/assets/home/tk.webp',
        totalDestinations: 288,
        domesticDestinations: 46,
        internationalDestinations: 242,
        countries: 127,
    },
    {
        name: 'LUFTHANSA',
        logo: '/assets/home/lufthansa.webp',
        totalDestinations: 217,
        domesticDestinations: 18,
        internationalDestinations: 199,
        countries: 73,
    },

];

function AirlineCard({ airline }: { airline: Airline }) {
    const { t } = useLanguage();
    return (
        <div className="shrink-0 w-[240px] rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow p-3 flex flex-col items-center text-center ">
            <img
                src={airline.logo}
                alt={airline.name}
                className="h-[100px] w-auto object-contain"
            />

            <div className="flex flex-col gap-1 text-sm">
                <div className="font-bold text-[#0454E8]">
                    {airline.totalDestinations} {t('flightsDestinationsCount')}
                </div>
                <div className="text-[#0454E8]/80">
                    {airline.domesticDestinations} {t(airline.domesticDestinations === 1 ? 'flightsDomesticDestination' : 'flightsDomesticDestinations')}
                </div>
                <div className="text-[#0454E8]/80">
                    {airline.internationalDestinations} {t('flightsInternationalDestinations')} {airline.countries} {t('flightsCountries')}
                </div>
            </div>
        </div>
    );
}

export const TopAirlinesCarousel = () => {
    const { t } = useLanguage();
    const trackRef = useRef<HTMLDivElement>(null);

    const scroll = (dir: 'left' | 'right') => {
        trackRef.current?.scrollBy({ left: dir === 'left' ? -256 : 256, behavior: 'smooth' });
    };

    return (
        <section className="max-w-6xl mx-auto px-4 mt-16">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-[#002161]">
                    {t('flightsTopAirlines')}
                </h2>
                <Button
                    type="button"
                    variant="outline"
                    className="hidden md:inline-flex border-2 border-[#0454E8] text-[#0454E8] hover:bg-[#0454E8] hover:text-white font-semibold text-sm rounded-lg"
                >
                    {t('flightsAllAirlines')}
                </Button>
            </div>

            <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 w-16 z-10 bg-gradient-to-r from-[#EAF1FF] to-transparent md:hidden" />
                <div className="pointer-events-none absolute inset-y-0 right-0 w-16 z-10 bg-gradient-to-l from-[#EAF1FF] to-transparent md:hidden" />

                <button
                    type="button"
                    onClick={() => scroll('left')}
                    aria-label={t('flightsPrevious')}
                    className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white shadow-lg items-center justify-center text-[#0454E8] hover:bg-[#F1F5F9] transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>

                <div
                    ref={trackRef}
                    className="flex gap-4 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                >
                    {topAirlines.map((airline) => (
                        <AirlineCard key={airline.name} airline={airline} />
                    ))}
                </div>

                <button
                    type="button"
                    onClick={() => scroll('right')}
                    aria-label={t('flightsNext')}
                    className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white shadow-lg items-center justify-center text-[#0454E8] hover:bg-[#F1F5F9] transition-colors"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </section>
    );
};

export default TopAirlinesCarousel;