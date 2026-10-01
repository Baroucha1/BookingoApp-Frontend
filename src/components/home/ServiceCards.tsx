import { ArrowRight } from 'lucide-react';
import { Link } from "react-router-dom";
import { useLanguage } from '@/i18n/LanguageContext';

const serviceData = {
    fr: [
        {
            title: 'VOLS',
            desc: "Comparez des centaines de compagnies et réservez vos billets d'avion au meilleur prix",
            cta: 'Rechercher un vol',
            image: '/assets/home/vols.webp',
            link: '/flights',
        },
        {
            title: 'Hôtels',
            desc: "Trouvez l'hébergement parfait parmi des milliers d'hôtels dans le monde entier",
            cta: 'Découvrir les hôtels',
            image: '/assets/home/hotel.webp',
            link: '/hotels',
        },
        {
            title: 'Visas',
            desc: 'Demandez votre visa en ligne rapidement et en toute sécurité',
            cta: 'Faire une demande',
            image: '/assets/home/visa.webp',
            link: '/visa',
        },
        {
            title: 'e-SIM',
            desc: "Profitez d'Internet haut débit partout dans le monde avec une eSIM simple à activer dès votre arrivée",
            cta: 'Explorer les forfaits',
            image: '/assets/home/gosim.webp',
            link: '/esim',
        },
    ],
    en: [
        {
            title: 'FLIGHTS',
            desc: "Compare hundreds of airlines and book your flight tickets at the best rates",
            cta: 'Search a flight',
            image: '/assets/home/vols.webp',
            link: '/flights',
        },
        {
            title: 'Hotels',
            desc: "Find the ideal accommodation among thousands of hotels around the globe",
            cta: 'Explore hotels',
            image: '/assets/home/hotel.webp',
            link: '/hotels',
        },
        {
            title: 'Visas',
            desc: 'Apply for your visa online with speed, confidence and safety',
            cta: 'Apply now',
            image: '/assets/home/visa.webp',
            link: '/visa',
        },
        {
            title: 'e-SIM',
            desc: "Stay connected worldwide with high-speed internet and instant eSIM activation upon landing",
            cta: 'Explore plans',
            image: '/assets/home/gosim.webp',
            link: '/esim',
        },
    ],
    ar: [
        {
            title: 'رحلات الطيران',
            desc: "قارن بين مئات شركات الطيران واحجز تذاكر سفرك بأفضل الأسعار",
            cta: 'ابحث عن رحلة',
            image: '/assets/home/vols.webp',
            link: '/flights',
        },
        {
            title: 'الفنادق',
            desc: "اعثر على الإقامة المثالية بين آلاف الفنادق في جميع أنحاء العالم",
            cta: 'استكشف الفنادق',
            image: '/assets/home/hotel.webp',
            link: '/hotels',
        },
        {
            title: 'التأشيرات',
            desc: 'قدّم طلب تأشيرتك الإلكترونية عبر الإنترنت بكل سهولة وأمان',
            cta: 'تقديم طلب',
            image: '/assets/home/visa.webp',
            link: '/visa',
        },
        {
            title: 'شريحة e-SIM',
            desc: "تمتع بإنترنت عالي السرعة في أكثر من 180 دولة مع تفعيل فوري وسريع",
            cta: 'استكشف الباقات',
            image: '/assets/home/gosim.webp',
            link: '/esim',
        },
    ],
};

export const ServiceCards = () => {
    const { language } = useLanguage();
    const list = serviceData[language] || serviceData.fr;

    return (
        <section id="services" className="relative max-w-6xl mx-auto px-4 py-6 z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-5 md:gap-6">
                {list.map((s) => (
                    <Link
                        key={s.title}
                        to={s.link}
                        className="group rounded-[24px] shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden bg-white dark:bg-slate-900 hover:-translate-y-1.5 active:scale-[0.98] border border-slate-100 dark:border-slate-800 flex flex-col cursor-pointer"
                    >
                        {/* Image Container */}
                        <div className="relative block h-32 sm:h-40 md:h-44 w-full overflow-hidden border-b-2 border-[#FFAA01]">
                            <img
                                src={s.image}
                                alt={s.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                        </div>

                        {/* Content */}
                        <div className="p-3.5 sm:p-4 flex flex-col flex-1 bg-white dark:bg-slate-900">
                            <h3 className="font-extrabold text-sm sm:text-base text-[#002161] dark:text-white line-clamp-1 group-hover:text-[#0454E8] transition-colors">
                                {s.title}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug mt-1.5 line-clamp-2">
                                {s.desc}
                            </p>
                            <div className="text-xs font-bold text-[#FFAA01] mt-auto pt-3 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                <span>{s.cta}</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
};

export default ServiceCards;