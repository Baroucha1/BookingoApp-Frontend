// components/home/TravelInspiration.tsx
import { Umbrella, Mountain, Building2, Landmark, Snowflake, Palmtree } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import type { TranslationKey } from '@/i18n/translations';

interface InspirationCategory {
    titleKey: TranslationKey;
    taglineKey: TranslationKey;
    image: string;
    icon: React.ComponentType<{ className?: string }>;
}

const categories: InspirationCategory[] = [
    {
        titleKey: 'flightsCategoryBeaches',
        taglineKey: 'flightsCategoryBeachesTagline',
        image: '/assets/flights/beach.webp',
        icon: Umbrella,
    },
    {
        titleKey: 'flightsCategoryMountains',
        taglineKey: 'flightsCategoryMountainsTagline',
        image: '/assets/flights/montain.webp',
        icon: Mountain,
    },
    {
        titleKey: 'flightsCategoryCityBreak',
        taglineKey: 'flightsCategoryCityBreakTagline',
        image: '/assets/flights/city.webp',
        icon: Building2,
    },
    {
        titleKey: 'flightsCategoryCulture',
        taglineKey: 'flightsCategoryCultureTagline',
        image: '/assets/flights/culture.webp',
        icon: Landmark,
    },
    {
        titleKey: 'flightsCategorySnow',
        taglineKey: 'flightsCategorySnowTagline',
        image: '/assets/flights/snow.webp',
        icon: Snowflake,
    },
    {
        titleKey: 'flightsCategoryIsland',
        taglineKey: 'flightsCategoryIslandTagline',
        image: '/assets/flights/island.webp',
        icon: Palmtree,
    },
];

export const TravelInspiration = () => {
    const { t } = useLanguage();
    return (
        <section className="max-w-6xl mx-auto px-4 mt-16">
            <h2 className="text-xl md:text-2xl font-bold text-[#002161] mb-6">
                {t('flightsInspiration')}
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6  md:gap-4">
                {categories.map((c) => (
                    <button
                        key={c.titleKey}
                        type="button"
                        className="group relative h-[180px]  overflow-hidden border-2 text-left"
                    >
                        <img
                            src={c.image}
                            alt={t(c.titleKey)}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                        <div className="relative z-10 h-full flex flex-col justify-end p-3">
                            <div className="w-7 h-7 rounded-full bg-[#0454E8] flex items-center justify-center mb-1.5 shrink-0">
                                <c.icon className="w-3.5 h-3.5 text-white" />
                            </div>
                            <div className="font-bold text-white text-sm leading-tight">{t(c.titleKey)}</div>
                            <div className="text-white/85 text-xs leading-snug mt-0.5">{t(c.taglineKey)}</div>
                        </div>
                    </button>
                ))}
            </div>
        </section>
    );
};

export default TravelInspiration;