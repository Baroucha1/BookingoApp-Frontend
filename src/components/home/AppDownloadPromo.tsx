import { useLanguage } from '@/i18n/LanguageContext';

const promoTexts = {
    fr: {
        title: "Téléchargez notre application",
        desc: "Réservez où que vous soyez et profitez des meilleurs offres en un clic",
        payments: "Paiements acceptés",
    },
    en: {
        title: "Download our app",
        desc: "Book wherever you are and enjoy the best deals in one click",
        payments: "Accepted payments",
    },
    ar: {
        title: "حمّل تطبيقنا",
        desc: "احجز أينما كنت واستمتع بأفضل العروض بنقرة واحدة",
        payments: "طرق الدفع المقبولة",
    },
};

const AppDownloadPromo = () => {
    const { language } = useLanguage();
    const t = promoTexts[language] || promoTexts.fr;

    return (
        <section className="max-w-6xl mx-auto p-10">
            <div
                className="relative rounded-sm overflow-hidden border-2 w-full flex flex-col md:block"
                style={{ borderColor: '#FFB400' }}
            >
                {/* Background image */}
                <img
                    src="/app.png"
                    alt="BookinGO App"
                    className="w-full h-[180px] md:h-[500px] object-cover block"
                    style={{ objectPosition: 'center 20%' }}
                />

                {/* Card: static block on mobile, absolute overlay on desktop */}
                <div className="bg-white md:bg-white/50 md:backdrop-blur-sm rounded-md shadow-lg p-5 md:p-8
                                w-full md:absolute md:inset-y-0 md:right-64 rtl:md:right-auto rtl:md:left-64 md:my-auto md:h-fit md:w-auto md:max-w-sm md:ml-[340px] rtl:md:ml-0 rtl:md:mr-[340px]">
                    <h3 className="text-xl md:text-2xl font-bold">
                        <span className="text-blue-900">Bookin</span>
                        <span className="text-orange-500">GO</span>
                    </h3>

                    <h4 className="text-lg md:text-xl font-bold text-gray-900 mt-2">
                        {t.title}
                    </h4>

                    <p className="text-gray-600 text-sm md:text-base mt-1">
                        {t.desc}
                    </p>

                    <div className="flex flex-wrap gap-3 mt-4">
                        <a href="#">
                            <img src="/app-store-fr.svg" alt="App Store" className="h-10" />
                        </a>
                        <a href="#">
                            <img src="/google-play-fr.svg" alt="Google Play" className="h-10" />
                        </a>
                    </div>

                    <div className="mt-4">
                        <p className="text-xs font-semibold text-blue-900">
                            {t.payments}
                        </p>
                        <div className="flex gap-3 mt-2">
                            <img src="/dhahabiaCIB.png" alt="Edahabia" className="h-9" />
                            <img src="/cash.png" alt="Cash" className="h-9" />
                            <img src="/delivery.png" alt="Delivery" className="h-9" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AppDownloadPromo;