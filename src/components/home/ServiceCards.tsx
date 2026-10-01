import { ChevronRight } from 'lucide-react';
import { services } from '@/data/data.ts';
import {Link} from "react-router-dom";
import { useLanguage } from '@/i18n/LanguageContext';
import type { TranslationKey } from '@/i18n/translations';

const serviceCopy: Record<string, { title: TranslationKey; desc: TranslationKey; cta: TranslationKey }> = {
    '/flights': { title: 'homeServiceFlightsTitle', desc: 'homeServiceFlightsDesc', cta: 'homeServiceFlightsCta' },
    '/hotels': { title: 'homeServiceHotelsTitle', desc: 'homeServiceHotelsDesc', cta: 'homeServiceHotelsCta' },
    '/visa': { title: 'homeServiceVisasTitle', desc: 'homeServiceVisasDesc', cta: 'homeServiceVisasCta' },
    '/esim': { title: 'homeServiceEsimTitle', desc: 'homeServiceEsimDesc', cta: 'homeServiceEsimCta' },
};

export const ServiceCards = () => {
    const { t } = useLanguage();
    return (
        <section id="services" className="relative max-w-6xl mx-auto px-3 z-10 overflow-x-hidden">
            <div className="relative">
                <div className="md:hidden pointer-events-none absolute inset-y-0 right-0 w-14 z-10 bg-gradient-to-l from-[#EAF1FF] to-transparent flex items-center justify-end pr-1">
                    <ChevronRight className="w-5 h-5 text-[#0454E8]" />
                </div>

                <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 pb-2 md:grid md:grid-cols-4 md:gap-6 md:overflow-visible [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {services.map((s, i) => {
                        const copy = serviceCopy[s.link];
                        const title = copy ? t(copy.title) : s.title;
                        const description = copy ? t(copy.desc) : s.desc;
                        const cta = copy ? t(copy.cta) : s.cta;
                        return (
                        <div
                            key={s.link}
                            className="group snap-start shrink-0 w-[78%] sm:w-[55%] md:w-auto rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden bg-white hover:-translate-y-1.5 animate-fade-in"
                            style={{
                                animationDelay: `${i * 100}ms`,
                                animationFillMode: 'backwards',
                                backfaceVisibility: 'hidden',
                                WebkitBackfaceVisibility: 'hidden',
                                transform: 'translateZ(0)',
                            }}
                        >
                            {/* MOBILE — portrait image, text overlaid, no white box */}
                            <a href={s.link} className="md:hidden relative block h-64 w-full overflow-hidden rounded-2xl border-2 border-[#FFAA01]">
                                <img
                                    src={s.image}
                                    alt={title}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                {/* scrim so text reads over any part of the image */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                                <div className="absolute inset-x-0 bottom-0 p-4">
                                    <h3 className="font-extrabold text-lg text-white drop-shadow">{title}</h3>
                                    <p className="text-[13px] text-white/85 leading-relaxed mt-1.5 line-clamp-2">{description}</p>
                                    <span className="inline-block text-[13px] font-semibold mt-3" style={{ color: '#FFAA01' }}>
                                        {cta}
                                    </span>
                                </div>
                            </a>

                            {/* DESKTOP — existing layout, unchanged */}
                            <div className="hidden md:flex md:flex-col">
                                <div className="border-b-0 shrink-0 h-40 w-full overflow-hidden rounded-t-2xl border-2 border-[#FFAA01]">
                                    <img
                                        src={s.image}
                                        alt={title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                </div>

                                <div className="relative -mt-4 rounded-t-2xl bg-white px-5 pt-3 pb-6 flex flex-col flex-1 min-h-[190px]">
                                    <h3 className="font-extrabold text-[15px] text-[#002161]">{title}</h3>
                                    <p className="text-[13px] text-[#002161] leading-relaxed mt-2">{description}</p>
                                    <Link to={s.link} className="text-[13px] font-semibold text-[#FFAA01] hover:underline mt-auto pt-3">
                                        {cta}
                                    </Link>
                                </div>
                            </div>
                        </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default ServiceCards;