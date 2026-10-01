import { useState } from 'react';
import AggregatedSearchForm from '../search/AggregatedSearchForm.tsx';
import {useNavigate} from "react-router-dom";
import { encodeSearchParams } from '@/service/flights_aggregator/SearchParmsCodec.ts';
import { useLanguage } from '@/i18n/LanguageContext';

type SearchTab = 'vols' | 'hotels' | 'visas';



export const Hero = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();

    return (
        <section className="relative mb-10">
            <img
                src="/assets/flights/hero.webp"
                alt="Destination"
                className="absolute inset-0 w-full h-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/5 to-[#DFECFF] z-10" />

            <div className="relative z-20 px-[max(1.25rem,env(safe-area-inset-left,0px))] md:px-16 pt-[calc(7.5rem+env(safe-area-inset-top,0px))] md:pt-24 pb-10 md:pb-5">
                <div className="max-w-xl text-left mb-8 md:mb-5">
                    <h1 className="font-title text-white text-2xl md:text-[33px] lg:text-5xl leading-tight mb-1">
                        {t('homeHeroLine1')}
                    </h1>
                    <p className="font-title text-[#FFAA01] text-2xl md:text-[33px] lg:text-5xl mb-5">
                        {t('homeHeroLine2')}
                    </p>
                    <p className="font-semibold text-white text-sm md:text-lg">
                        {t('homeHeroDesc1')}
                    </p>
                    <p className="font-semibold text-white text-sm md:text-lg">
                        {t('homeHeroDesc2')}
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