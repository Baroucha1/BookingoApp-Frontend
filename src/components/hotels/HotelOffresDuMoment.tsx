// src/components/hotels/HotelOffresDuMoment.tsx
import { ChevronRight } from 'lucide-react';
import { MapPin } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

interface Offer {
    id: string;
    discountPct: number;
    city: string;
    countryKey: 'hotelCountryAlgeria' | 'hotelCountryFrance' | 'hotelCountryUae';
    priceFrom: number;
    currency: string;
    image: string;
}

// TODO: replace with real GET /api/hotel-offers or similar once backend exists
const offers: Offer[] = [
    { id: '1', discountPct: 15, city: 'Béjaia',  countryKey: 'hotelCountryAlgeria', priceFrom: 8500,  currency: 'DZD', image: '/assets/hotels/bejaia.png' },
    { id: '2', discountPct: 20, city: 'Djanet',  countryKey: 'hotelCountryAlgeria', priceFrom: 12000, currency: 'DZD', image: '/assets//hotels/djanet.png' },
    { id: '3', discountPct: 18, city: 'Paris',   countryKey: 'hotelCountryFrance', priceFrom: 25000, currency: 'DZD', image: '/assets//hotels/paris.png' },
    { id: '4', discountPct: 10, city: 'Dubai',   countryKey: 'hotelCountryUae', priceFrom: 30000, currency: 'DZD', image: '/assets//hotels/dubai.png' },
];

export default function HotelOffresDuMoment() {
    const { t, language } = useLanguage();
    const numberLocale = language === 'ar' ? 'ar-DZ' : language === 'en' ? 'en-US' : 'fr-FR';

    return (
        <section className="max-w-6xl mx-auto px-4 mt-16 pb-20 ">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-[#002161]">{t('hotelCurrentOffers')}</h2>
                <button className="flex items-center gap-1 text-sm font-semibold text-[#0454E8] bg-[#DFECFF] hover:bg-[#0454E8] hover:text-white transition-colors rounded px-4 py-1.5">
                    {t('hotelExploreOffers')} <ChevronRight className="w-3.5 h-3.5" />
                </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {offers.map((o) => (
                    <div
                        key={o.id}
                        className="group rounded-sm overflow-hidden bg-[#F5F5F5] shadow-sm hover:shadow-md transition-shadow"
                    >
                        {/* Portrait image */}
                        <div className="relative h-64 sm:h-72">
                            <img
                                src={o.image}
                                alt={o.city}
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />

                            {/* discount badge */}
                            <span className="absolute top-2 left-2 bg-[#F5A623] text-[#0B2A5C] text-xs font-bold px-2 py-0.5 rounded-full shadow">
                    -{o.discountPct}%
                </span>

                            {/* bottom info overlay, flush with image edges, no gap/margin */}
                            <div className="absolute bottom-0 left-0 right-0 bg-[#F5F5F5]/80  p-3">
                                <div className="font-bold text-[#002161] text-sm">{o.city}</div>
                                <div className="flex items-center gap-1 text-xs text-[#1775FF] mt-0.5">
                                    <MapPin className="w-3 h-3" /> {t(o.countryKey)}
                                </div>
                                <div className="flex items-center justify-between mt-2.5">
                                    <div>
                                        <div className="text-[10px] text-[#797272]">{t('hotelStartingFrom')}</div>
                                        <div className="font-bold text-[#002161] text-sm">
                                            {o.priceFrom.toLocaleString(numberLocale)} {o.currency}
                                            <span className="text-[10px] text-[#797272]"> {t('hotelPerNight')} </span>
                                        </div>

                                    </div>
                                    <button className="w-7 h-7 rounded-full bg-[#DFECFF] text-[#0454E8] flex items-center justify-center group-hover:bg-[#0454E8] group-hover:text-white transition-colors">
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}