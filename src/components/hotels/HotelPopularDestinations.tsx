// src/components/hotels/HotelPopularDestinations.tsx
import { ChevronRight } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

interface Destination {
    city: string;
    countryKey: 'hotelCountryUae' | 'hotelCountryFrance' | 'hotelCountryTurkey' | 'hotelCountryMorocco' | 'hotelCountryTunisia';
    image: string;
    priceFrom: number;
    currency: string;
}

// TODO: replace mock prices with real data once hotel inventory/pricing exists
const destinations: Destination[] = [
    { city: 'Dubai',    countryKey: 'hotelCountryUae', image: '/assets/home/dubai.webp',    priceFrom: 8900,  currency: 'DZD' },
    { city: 'Paris',    countryKey: 'hotelCountryFrance', image: '/assets/home/paris.webp',    priceFrom: 7200,  currency: 'DZD' },
    { city: 'Istanbul', countryKey: 'hotelCountryTurkey', image: '/assets/home/istanbul.webp', priceFrom: 6100,  currency: 'DZD' },
    { city: 'Marrakech',countryKey: 'hotelCountryMorocco', image: '/assets/hotels/marrakach.png',priceFrom: 4300,  currency: 'DZD' },
    { city: 'Tunisie',  countryKey: 'hotelCountryTunisia', image: '/assets/hotels/tunisie.png',  priceFrom: 4200,  currency: 'DZD' },
];

export default function HotelPopularDestinations() {
    const { t, language } = useLanguage();
    const numberLocale = language === 'ar' ? 'ar-DZ' : language === 'en' ? 'en-US' : 'fr-FR';

    return (
        <section className="max-w-6xl mx-auto px-4 mt-16">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-[#002161]">{t('hotelPopularDestinations')}</h2>
                <button className="flex items-center gap-1 text-sm font-semibold text-[#0454E8] bg-[#DFECFF] hover:bg-[#0454E8] hover:text-white transition-colors rounded-full px-4 py-1.5">
                    {t('hotelExploreDestinations')} <ChevronRight className="w-3.5 h-3.5" />
                </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
                {destinations.map((d) => (
                    <button
                        key={d.city}
                        type="button"
                        className="group relative h-[160px] rounded-xl overflow-hidden text-left shadow-sm"
                    >
                        <img
                            src={d.image}
                            alt={d.city}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-blue-700/75 via-black/10 to-transparent" />

                        <div className="relative z-10 h-full flex flex-col justify-end p-3">
                            <div className="font-bold text-white text-sm leading-tight">{d.city}</div>
                            <div className="text-white/90 text-xs mt-0.5">
                                {t('hotelStartingFrom')} {d.priceFrom.toLocaleString(numberLocale)} {d.currency}
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </section>
    );
}