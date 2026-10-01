import HotelSearchForm from "@/components/hotels/HotelsSearchForm.tsx";
import { useLanguage } from '@/i18n/LanguageContext';

export const Hero = () => {
    const { t } = useLanguage();

    return (
        <section className="relative mb-10">
            <img
                src="/assets/hotels/hero.png"
                alt="Destination"
                className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/5 to-black/40" />

            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/5 to-[#DFECFF] z-10" />


            <div className="relative z-20 px-5 md:px-16 pt-32 md:pt-32 pb-10 md:pb-16 ">
                <div className="max-w-xl text-left mb-8 md:mb-12">
                    <h1 className="font-title text-white text-2xl md:text-[33px] lg:text-5xl leading-tight mb-1">
                        {t('hotelHeroTitle')}
                    </h1>
                    <p className="font-title text-[#FFAA01] text-2xl md:text-[33px] lg:text-5xl mb-4">
                        {t('hotelHeroHighlight')}
                    </p>
                    <p className="font-semibold text-white text-sm md:text-lg">
                        {t('hotelHeroDescription')}
                    </p>
                </div>

                <HotelSearchForm onSubmit={() => {}} />
            </div>
        </section>
    );
};

export default Hero;