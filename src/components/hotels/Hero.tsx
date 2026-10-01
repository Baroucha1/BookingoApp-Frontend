import HotelSearchForm from "@/components/hotels/HotelsSearchForm.tsx";
import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";

export const Hero = () => {
    const [imgSrc] = useState('/assets/hotels/hero.png');
    const { t } = useLanguage();

    return (
        <section className="relative w-full flex-1 min-h-[calc(100vh-5rem)] flex flex-col justify-center bg-gradient-to-b from-[#0A2558] via-[#103E8A] to-[#DFECFF] overflow-hidden">
            <img
                src={imgSrc}
                alt="Hôtels BookinGO"
                className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Dual gradient overlays: left-to-right shadow for text readability + vertical transition */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-black/15 z-10 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-[#DFECFF] z-10 pointer-events-none" />

            <div
                className="relative z-20 w-full max-w-7xl mx-auto px-3.5 sm:px-6 md:px-12 flex flex-col justify-center py-6 sm:py-10"
                style={{
                    paddingTop: 'calc(env(safe-area-inset-top, 0px) + 4.5rem)',
                }}
            >
                <div className="max-w-2xl text-start mb-4 sm:mb-6">
                    <h1 className="font-title text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-[1.15] mb-1 [text-shadow:_0_2px_14px_rgba(0,0,0,0.85),_0_1px_3px_rgba(0,0,0,0.9)]">
                        {t('hotelHeroTitle')}
                    </h1>
                    <p className="font-title text-[#FFAA01] text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-2.5 [text-shadow:_0_2px_14px_rgba(0,0,0,0.85),_0_1px_3px_rgba(0,0,0,0.9)]">
                        {t('hotelHeroHighlight')}
                    </p>
                    <div className="inline-flex items-center px-3.5 py-1.5">
                        <p className="font-medium text-white text-xs sm:text-sm md:text-base">
                            {t('hotelHeroSubtitle')}
                        </p>
                    </div>
                </div>

                <div className="w-full">
                    <HotelSearchForm />
                </div>
            </div>
        </section>
    );
};

export default Hero;