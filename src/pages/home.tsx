import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Hero } from '@/components/home/Hero';
import { ServiceCards } from '@/components/home/ServiceCards';
import { NewsletterBanner } from '@/components/home/NewsletterBanner';
import { OffresDuMoment } from '@/components/home/OffresDuMoment';
import { Partners } from '@/components/home/Partners';
import AppDownloadPromo from '@/components/home/AppDownloadPromo';
import { Sparkles } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

const HomePage = () => {
    const location = useLocation();
    const { t } = useLanguage();

    useEffect(() => {
        if (!location.hash) return;
        const id = location.hash.replace('#', '');
        const el = document.getElementById(id);
        if (el) {
            setTimeout(() => {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }, [location]);

    return (
        <div className="min-h-screen bg-[#DFECFF]">
            <Hero />
            <ServiceCards />
            <NewsletterBanner />

            {/* Offres du moment — suspendu */}
            <div id="offres" className="relative">
                <div className="pointer-events-none select-none blur-sm opacity-60">
                    <OffresDuMoment />
                </div>
                <div className="absolute inset-0 flex items-center justify-center px-6">
                    <div className="bg-white/90 backdrop-blur-sm border border-amber-200 rounded-2xl px-8 py-6 shadow-lg flex items-center gap-4 max-w-md text-center sm:text-left sm:flex-row flex-col">
                        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                            <Sparkles className="w-6 h-6 text-amber-500" />
                        </div>
                        <p className="font-semibold text-gray-800 text-lg">
                            {t('homeOffersSoon')}
                        </p>
                    </div>
                </div>
            </div>

            <Partners />
            <AppDownloadPromo />
        </div>
    );
};

export default HomePage;