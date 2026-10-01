// DealCard.tsx
import { Star } from 'lucide-react';
import type { deals } from '../../data/data.ts';
import { useLanguage } from '@/i18n/LanguageContext';

type Deal = (typeof deals)[number];

const dealTranslations = {
    Dubai: { country: 'homeDealCountryUae', type: 'homeDealFlightHotel5' },
    Paris: { country: 'homeDealCountryFrance', type: 'homeDealFlightHotel4' },
    Istanbul: { country: 'homeDealCountryTurkey', type: 'homeDealFlightHotel4' },
    Bali: { country: 'homeDealCountryIndonesia', type: 'homeDealFlightHotel5' },
} as const;

export const DealCard = ({ deal, index = 0 }: { deal: Deal; index?: number }) => {
    const { t } = useLanguage();
    const copy = dealTranslations[deal.city as keyof typeof dealTranslations];
    return (
    <div
        className="group snap-start shrink-0 rounded-lg overflow-hidden bg-white shadow-md hover:shadow-xl transition-all duration-300 flex flex-col h-full hover:-translate-y-1.5 animate-fade-in"
        style={{
            animationDelay: `${index * 100}ms`,
            animationFillMode: 'backwards',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'translateZ(0)',
        }}
    >
        <div className="relative h-56 md:h-45 shrink-0">
            <img
                src={deal.image}
                alt={deal.city}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <span className="absolute top-2 left-2 bg-[#F5A623] text-white text-xs font-bold px-2.5 py-1 rounded-lg">
        {deal.discount}
      </span>
        </div>

        <div className="relative -mt-4 bg-white px-5 pt-3 pb-6 flex flex-col flex-1 gap-1 rounded-t-md">
            <h4 className="font-bold text-[#002161] text-base">{deal.city}</h4>
            <p className="text-xs text-gray-400">{copy ? t(copy.country) : deal.country}</p>

            <p className="text-xs text-[#002161] mt-2">{copy ? t(copy.type) : deal.type}</p>

            <div className="flex items-baseline gap-2 mt-1">
                <span className="font-bold text-[#002161]">{deal.price} DZD</span>
                <span className="text-xs text-gray-400 line-through">{deal.oldPrice} DZD</span>
            </div>

            <div className="flex items-center gap-1 text-xs text-gray-500 mt-auto pt-3">
                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                <span className="font-medium text-[#002161]">{deal.rating}</span>
                <span className="text-gray-400">({deal.reviews} {t('homeDealReviews')})</span>
            </div>
        </div>
    </div>
    );
};

export default DealCard;