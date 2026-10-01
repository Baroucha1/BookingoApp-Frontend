import { useState } from 'react';
import { cn } from '@/lib/utils';
import AggregatedSearchForm from '../flights/search/AggregatedSearchForm.tsx';
import { encodeSearchParams } from "@/service/flights_aggregator/SearchParmsCodec.ts";
import { useNavigate } from "react-router-dom";
import { useLanguage } from '@/i18n/LanguageContext';

type SearchTab = 'vols' | 'hotels' | 'visas';

const heroContent = {
    fr: {
        title1: "Le monde à portée de main,",
        title2: "vos voyages, notre priorité",
        sub1: "Réservez vos vols, hôtels et visas",
        sub2: "en toute simplicité et au meilleur prix",
        vols: "Vols",
        hotels: "Hôtels",
        visas: "E-Visas",
        hotelsComingSoon: "Recherche d'hôtels — bientôt disponible",
        visasComingSoon: "Recherche de visas — bientôt disponible",
    },
    en: {
        title1: "The world at your fingertips,",
        title2: "your travels, our priority",
        sub1: "Book your flights, hotels and visas",
        sub2: "with ease and at the best price",
        vols: "Flights",
        hotels: "Hotels",
        visas: "E-Visas",
        hotelsComingSoon: "Hotel search — coming soon",
        visasComingSoon: "Visa search — coming soon",
    },
    ar: {
        title1: "العالم بين يديك،",
        title2: "رحلاتك، أولويتنا",
        sub1: "احجز رحلاتك وفنادقك وتأشيراتك",
        sub2: "بكل سهولة وبأفضل الأسعار",
        vols: "طيران",
        hotels: "فنادق",
        visas: "تأشيرات",
        hotelsComingSoon: "البحث عن الفنادق — قريباً",
        visasComingSoon: "البحث عن التأشيرات — قريباً",
    },
};

export const Hero = () => {
    const navigate = useNavigate();
    const { language } = useLanguage();
    const content = heroContent[language] || heroContent.fr;

    return (
        <section className="relative mb-10">
            <img
                src="/assets/home/home.webp"
                alt="Destination"
                className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/5 to-[#DFECFF] z-10" />

            <div className="relative z-20 px-5 md:px-16 pt-32 md:pt-32 pb-10 md:pb-16">
                <div className="max-w-xl text-left rtl:text-right mb-8 md:mb-12">
                    <h1 className="font-title text-white text-2xl md:text-[33px] lg:text-5xl leading-tight mb-1">
                        {content.title1}
                    </h1>
                    <p className="font-title text-[#FFAA01] text-2xl md:text-[33px] lg:text-5xl mb-4">
                        {content.title2}
                    </p>
                    <p className="font-semibold text-white text-sm md:text-lg">
                        {content.sub1}
                    </p>
                    <p className="font-semibold text-white text-sm md:text-lg">
                        {content.sub2}
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