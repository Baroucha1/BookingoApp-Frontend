import { useState } from 'react';
import { cn } from '@/lib/utils.ts';
import AggregatedSearchForm from '../search/AggregatedSearchForm.tsx';
import { useNavigate } from "react-router-dom";
import { encodeSearchParams } from '@/service/flights_aggregator/SearchParmsCodec.ts';
import { useLanguage } from '@/i18n/LanguageContext';

type SearchTab = 'vols' | 'hotels' | 'visas';

export const Hero = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<SearchTab>('vols');

    return (
        <section className="relative mb-0">
            <img
                src="/assets/flights/hero.webp"
                alt="Destination"
                className="absolute inset-0 w-full h-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/5 to-[#DFECFF] z-10" />

            <div
                className="relative z-20 px-5 md:px-16 pb-10 md:pb-5"
                style={{
                    paddingTop: 'calc(env(safe-area-inset-top, 0px) + 7.5rem)',
                }}
            >
                <div className="max-w-xl text-left rtl:text-right mb-8 md:mb-5">
                    <h1 className="font-title text-white text-2xl md:text-[33px] lg:text-5xl leading-tight mb-1">
                        {t('heroTitle')}
                    </h1>
                    <p className="font-title text-[#FFAA01] text-2xl md:text-[33px] lg:text-5xl mb-5">
                        {t('heroTitleHighlight')}
                    </p>
                    <p className="font-semibold text-white text-sm md:text-lg">
                        {t('heroSubtitle1')}
                    </p>
                    <p className="font-semibold text-white text-sm md:text-lg">
                        {t('heroSubtitle2')}
                    </p>
                </div>

                <div className="max-w-7xl mx-auto">
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