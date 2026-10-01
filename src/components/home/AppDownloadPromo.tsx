import { useLanguage } from '@/i18n/LanguageContext';

const AppDownloadPromo = () => {
    const { t } = useLanguage();
    return (
        <section className="max-w-6xl mx-auto p-10">
            <div
                className="relative rounded-sm overflow-hidden border-2 w-full flex flex-col md:block"
                style={{ borderColor: '#FFB400' }}
            >
                {/* Background image */}
                <img
                    src="/app.png"
                    alt={t('homeAppDownloadAlt')}
                    className="w-full h-[180px] md:h-[500px] object-cover block"
                    style={{ objectPosition: 'center 20%' }}
                />

                {/* Card: static block on mobile, absolute overlay on desktop */}
                <div className="bg-white md:bg-white/50 md:backdrop-blur-sm rounded-md shadow-lg p-5 md:p-8
                                w-full md:absolute md:inset-y-0 md:right-64 md:my-auto md:h-fit md:w-auto md:max-w-sm md:ml-[340px]">
                    <h3 className="text-xl md:text-2xl font-bold">
                        <span className="text-blue-900">Bookin</span>
                        <span className="text-orange-500">GO</span>
                    </h3>

                    <h4 className="text-lg md:text-xl font-bold text-gray-900 mt-2">
                        {t('homeAppDownloadTitle')}
                    </h4>

                    <p className="text-gray-600 text-sm md:text-base mt-1">
                        {t('homeAppDownloadDesc')}
                    </p>

                    <div className="flex flex-wrap gap-3 mt-4">
                        <a href="#" aria-label={t('homeAppStoreAlt')} className="min-h-10 rounded-lg bg-black px-3 py-2 text-xs font-semibold text-white flex flex-col justify-center">
                            <span className="text-[9px] font-normal">{t('homeDownloadOn')}</span>
                            <span>App Store</span>
                        </a>
                        <a href="#" aria-label={t('homeGooglePlayAlt')} className="min-h-10 rounded-lg bg-black px-3 py-2 text-xs font-semibold text-white flex flex-col justify-center">
                            <span className="text-[9px] font-normal">{t('homeGetItOn')}</span>
                            <span>Google Play</span>
                        </a>
                    </div>

                    <div className="mt-4">
                        <p className="text-xs font-semibold text-blue-900">
                            {t('homeAcceptedPayments')}
                        </p>
                        <div className="flex gap-3 mt-2">
                            <img src="/dhahabiaCIB.png" alt="Edahabia" className="h-9" />
                            <img src="/cash.png" alt="Edahabia" className="h-9" />
                            <img src="/delivery.png" alt="Edahabia" className="h-9" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AppDownloadPromo;