import { Link } from 'react-router-dom';
import { Package, Users, Laptop, User, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

const timeline = [
    {
        year: '1989',
        icon: Package,
        textKey: 'aboutTimeline1989',
    },
    {
        year: '2013',
        icon: Users,
        textKey: 'aboutTimeline2013',
    },
    {
        year: '2019',
        icon: Laptop,
        textKey: 'aboutTimeline2019',
    },
    {
        year: '2024',
        icon: User,
        textKey: 'aboutTimeline2024',
    },
] as const;

const AboutPage = () => {
    const { t } = useLanguage();

    return (
        <div className="min-h-screen bg-white overflow-hidden">

            {/* ── Hero ── */}
            <section className="relative">
                <div className="relative">
                    <img
                        src="/cover.png"
                        alt={t('aboutHeroImageAlt')}
                        className="w-full h-[620px] sm:h-[540px] md:h-[560px] object-cover object-[62%_center] blur-[1px] scale-[1.01] md:object-center md:blur-0 md:scale-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/5 to-transparent md:bg-gradient-to-r md:from-white/70 md:via-white/20 md:to-transparent" />
                    <div className="absolute inset-x-0 top-0 h-24 md:hidden pointer-events-none">
                        <svg viewBox="0 0 1440 100" className="w-full h-full" preserveAspectRatio="none">
                            <path
                                d="M0,0 H1440 V35 C1080,5 360,85 0,35 Z"
                                fill="white"
                                fillOpacity="0.9"
                            />
                        </svg>
                    </div>
                    <svg
                        viewBox="0 0 1440 120"
                        className="absolute inset-x-0 bottom-0 h-40 w-full backdrop-blur-[2px] md:hidden pointer-events-none"
                        preserveAspectRatio="none"
                    >
                        <defs>
                            <linearGradient id="about-hero-bottom-fade" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#DFECFF" stopOpacity="0.1" />
                                <stop offset="100%" stopColor="#DFECFF" stopOpacity="0.82" />
                            </linearGradient>
                        </defs>
                        <path
                            d="M0,48 C360,8 1080,82 1440,28 V120 H0 Z"
                            fill="url(#about-hero-bottom-fade)"
                        />
                    </svg>

                    <div className="absolute inset-0 flex items-start pt-14 md:items-center md:pt-0">
                        <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-10 w-full">
                            <div className="max-w-xl">
                                <div className="relative top-[40%] left-[2%] md:top-0 md:left-0">
                                    <p className="text-xs sm:text-sm font-bold text-[#0865FE] tracking-wider">
                                        {t('aboutPageEyebrow')}
                                    </p>
                                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#0B1E5C] mt-3 leading-[1.15] md:leading-[1.2]">
                                        {t('aboutPageTitleBefore')}
                                        <span className="italic font-serif text-[#0865FE]">{t('aboutPageTitleHighlight')}</span>
                                        {t('aboutPageTitleAfter')}
                                    </h1>
                                </div>
                                <p className="absolute bottom-8 left-5 right-5 text-black text-sm leading-relaxed max-w-sm md:hidden">
                                    {t('aboutPageMobileIntro')}
                                </p>
                                <p className="hidden text-black mt-5 leading-relaxed text-base md:block">
                                    {t('aboutPageIntro')} {t('aboutPageServicesLead')}{' '}
                                    <Link to="/flights" className="font-semibold text-[#0865FE] hover:underline">
                                        {t('aboutPageFlights')}
                                    </Link>
                                    ,{' '}
                                    <Link to="/hotels" className="font-semibold text-[#0865FE] hover:underline">
                                        {t('aboutPageHotels')}
                                    </Link>
                                    ,{' '}
                                    <Link to="/visa" className="font-semibold text-[#0865FE] hover:underline">
                                        {t('aboutPageVisas')}
                                    </Link>
                                    {' '}{t('aboutPageConjunction')}{' '}
                                    <Link to="/esim" className="font-semibold text-[#0865FE] hover:underline">
                                        {t('aboutPageEsim')}
                                    </Link>
                                    . {t('aboutPageContinue')}
                                </p>
                                <div className="w-14 h-1 mt-5 rounded-full" style={{ background: '#FFB400' }} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative z-20 w-full leading-none -mb-1">
                    <svg viewBox="0 0 1440 100" className="w-full h-[60px] md:hidden" preserveAspectRatio="none">
                        <path
                            d="M0,0 C360,100 1080,100 1440,0 L1440,100 L0,100 Z"
                            fill="#EAF1FF"
                        />
                    </svg>
                    <svg viewBox="0 0 1440 100" className="hidden w-full h-[90px] md:block" preserveAspectRatio="none">
                        <path
                            d="M0,50 C360,10 1080,90 1440,40 L1440,100 L0,100 Z"
                            fill="#EAF1FF"
                        />
                    </svg>
                </div>
            </section>

            {/* ── Histoire — texte + timeline superposés sur hadj.png ── */}
            <section className="relative bg-[#EAF1FF]">
                <img
                    src="/hadj.png"
                    alt={t('aboutHistoryImageAlt')}
                    className="w-full h-auto min-h-[900px] md:min-h-[720px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#EAF1FF] via-[#EAF1FF]/90 md:via-[#EAF1FF]/80 to-transparent" />

                <div className="absolute inset-0 py-10 md:py-16 overflow-y-auto">
                    <div className="max-w-7xl mx-auto px-6 md:px-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

                        {/* Texte */}
                        <div>
                            <p className="text-sm font-bold text-[#0865FE] tracking-wider">
                                {t('aboutHistoryEyebrow')}
                            </p>
                            <h2 className="text-3xl md:text-4xl font-extrabold text-[#0B1E5C] mt-3 leading-tight">
                                {t('aboutHistoryTitleBefore')}
                                <span className="italic font-serif text-[#0865FE]">{t('aboutHistoryTitleHighlight')}</span>
                            </h2>

                            <p className="text-gray-600 mt-5 leading-relaxed text-base">
                                {t('aboutHistoryParagraphOne')}
                            </p>
                            <p className="text-gray-600 mt-3 leading-relaxed text-base">
                                {t('aboutHistoryParagraphTwo')}
                            </p>
                            <p className="text-gray-600 mt-3 leading-relaxed text-base">
                                {t('aboutHistoryParagraphThree')}
                            </p>

                            <p className="italic font-serif text-[#0865FE] font-medium mt-5 text-base">
                                {t('aboutHistoryTagline')}
                            </p>
                            <div className="w-14 h-1 mt-4 rounded-full" style={{ background: '#FFB400' }} />
                        </div>

                        {/* Timeline compacte, ligne pointillée fine */}
                        <div className="relative px-2 md:px-4">
                            <div
                                className="absolute left-[17px] top-3 bottom-3 border-l border-dotted"
                                style={{ borderColor: '#0865FE99', borderLeftWidth: '1.5px' }}
                            />
                            <div className="flex flex-col gap-7 relative">
                                {timeline.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <div key={item.year} className="flex items-start gap-4 relative">
                                            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shrink-0 z-10 shadow-sm">
                                                <Icon className="w-4 h-4 text-[#0865FE]" strokeWidth={2.2} />
                                            </div>
                                            <div className="pt-0.5">
                                                <p className="font-extrabold text-[#0B1E5C] text-base">{item.year}</p>
                                                <p className="text-sm text-gray-600 leading-relaxed mt-1 max-w-[240px]">
                                                    {t(item.textKey)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Elkawther Voyages — texte superposé sur kawther.png, arc en haut ── */}
            <section className="relative">
                <div className="relative">
                    <img
                        src="/kawther.png"
                        alt={t('aboutAgencyImageAlt')}
                        className="w-full h-[420px] md:h-[520px] object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />

                    {/* Arc en haut de la photo — même couleur que le fond de la section précédente */}
                    <div className="absolute top-0 left-0 right-0 leading-none">
                        <svg viewBox="0 0 1440 80" className="w-full h-[40px] md:h-[70px]" preserveAspectRatio="none">
                            <path
                                d="M0,0 L0,40 C360,80 1080,0 1440,40 L1440,0 Z"
                                fill="#EAF1FF"
                            />
                        </svg>
                    </div>

                    <div className="absolute inset-0 flex items-center pt-8 md:pt-0">
                        <div className="max-w-7xl mx-auto px-6 md:px-10 w-full">
                            <div className="max-w-lg">
                                <h2 className="text-2xl md:text-4xl font-extrabold text-white leading-tight">
                                    {t('aboutAgencyTitleBefore')}<br />
                                    {t('aboutAgencyTitleAfter')}<span style={{ color: '#FFB400' }}>GO</span>
                                </h2>
                                <div className="w-14 h-1 mt-4 rounded-full" style={{ background: '#FFB400' }} />

                                <p className="text-white/90 mt-5 leading-relaxed text-base max-w-md">
                                    {t('aboutAgencyDescription')}
                                </p>

                                <button className="inline-flex items-center gap-2 mt-6 bg-white text-[#0B1E5C] font-semibold text-sm px-6 py-3 rounded-full hover:bg-gray-100 transition-colors">
                                    {t('aboutAgencyCta')}
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AboutPage;