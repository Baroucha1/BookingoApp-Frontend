import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import AggregatedSearchForm from '../flights/search/AggregatedSearchForm.tsx';
import { encodeSearchParams } from '@/service/flights_aggregator/SearchParmsCodec.ts';
import { useLanguage } from '@/i18n/LanguageContext';

type TabLabelKey = 'homeTabFlights' | 'homeTabHotels' | 'homeTabVisas' | 'homeTabEsim';

// No `path` → stays on the homepage (inline form). With `path` → navigates to that page.
const TABS: { key: string; label: TabLabelKey; path?: string }[] = [
    { key: 'vols', label: 'homeTabFlights' },
    { key: 'hotels', label: 'homeTabHotels', path: '/hotels' },
    { key: 'visas', label: 'homeTabVisas', path: '/visa' },
    { key: 'esim', label: 'homeTabEsim', path: '/esim' },
];

const tabClass = (active: boolean) =>
    cn(
        'shrink-0 px-4 sm:px-6 py-2.5 text-sm font-semibold transition-all rounded-t',
        active
            ? 'bg-[#0454E8] text-white shadow-lg'
            : 'bg-white text-[#0454E8] hover:bg-[#F1F5F9] shadow-md',
    );

export const Hero = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();

    return (
        <section className="relative mb-10">
            <img
                src="/assets/home/home.webp"
                alt="Destination"
                className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/5 to-[#DFECFF] z-10" />

            <div className="relative z-20 px-[max(1.25rem,env(safe-area-inset-left,0px))] md:px-16 pt-[calc(7.5rem+env(safe-area-inset-top,0px))] md:pt-32 pb-10 md:pb-16">
                <div className="max-w-xl text-left mb-8 md:mb-12">
                    <h1 className="font-title text-white text-2xl md:text-[33px] lg:text-5xl leading-tight mb-1">
                        {t('homeHeroLine1')}
                    </h1>
                    <p className="font-title text-[#FFAA01] text-2xl md:text-[33px] lg:text-5xl mb-4">
                        {t('homeHeroLine2')}
                    </p>
                    <p className="font-semibold text-white text-sm md:text-lg">{t('homeHeroDesc1')}</p>
                    <p className="font-semibold text-white text-sm md:text-lg">{t('homeHeroDesc2')}</p>
                </div>

                <div className="max-w-7xl mx-auto">
                    <div className="flex gap-2 overflow-x-auto no-scrollbar md:ml-10">
                        {TABS.map((tab) =>
                            tab.path ? (
                                <Link key={tab.key} to={tab.path} className={tabClass(false)}>
                                    {t(tab.label)}
                                </Link>
                            ) : (
                                <span key={tab.key} className={tabClass(true)} aria-current="page">
                                    {t(tab.label)}
                                </span>
                            ),
                        )}
                    </div>

                    <AggregatedSearchForm
                        onSubmit={(params) => {
                            const sp = encodeSearchParams(params);
                            navigate(`/flights/v2?${sp.toString()}`);
                        }}
                    />
                </div>
            </div>
        </section>
    );
};

export default Hero;