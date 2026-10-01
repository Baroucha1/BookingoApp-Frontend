import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Search, Wifi, Globe, Zap, Lock, Signal, Headset, ChevronRight, X, RotateCw
} from 'lucide-react';
import {
    searchLocations,
    getPackages,
    formatBytes,
    getDiscountedPrice,
    type Location,
    type EsimPackage,
} from '@/service/esim.service';
import { useLanguage } from '@/i18n/LanguageContext';

const esimTexts = {
    fr: {
        badge: "Connexion instantanée dans +180 pays",
        heroTitle1: "Restez connecté",
        heroTitle2: "partout dans le monde",
        heroSub: "Profitez d’une eSIM rapide et sécurisée sans changer de carte SIM physique. Activation immédiate en quelques secondes.",
        searchLabel: "Rechercher un pays",
        searchPlaceholder: "Sélectionnez votre destination",
        countries: "Pays",
        regions: "Régions",
        allDestinations: "Toutes les destinations",
        allRegions: "Toutes les régions",
        fromPrice: "À partir de",
        moreCountries1: "Et plus de",
        moreCountries2: "150 pays",
        feat1Title: "Activation immédiate",
        feat1Sub: "Recevez votre eSIM en quelques minutes.",
        feat2Title: "Sans carte SIM",
        feat2Sub: "Installez et activez votre eSIM facilement.",
        feat3Title: "Réseau fiable",
        feat3Sub: "Profitez d'une connexion stable et rapide.",
        feat4Title: "Support 7j/7",
        feat4Sub: "Notre équipe est là pour vous aider.",
        modalTitle: "Forfaits —",
        modalSub: "Choisissez un forfait eSIM",
        noPackage: "Aucun forfait retourné pour ce pays.",
        errorLoading: "Impossible de charger les forfaits pour cette destination.",
        retry: "Réessayer",
        noResultsTitle: "Aucune destination trouvée",
        noResultsSub: "Essayez de modifier votre recherche ou explorez nos autres destinations disponibles.",
        clearSearch: "Effacer la recherche",
        day: "jour",
        days: "jours",
    },
    en: {
        badge: "Instant connection in 180+ countries",
        heroTitle1: "Stay connected",
        heroTitle2: "anywhere in the world",
        heroSub: "Enjoy fast and secure eSIM without swapping physical SIM cards. Immediate activation in seconds.",
        searchLabel: "Search country",
        searchPlaceholder: "Select your destination",
        countries: "Countries",
        regions: "Regions",
        allDestinations: "All destinations",
        allRegions: "All regions",
        fromPrice: "Starting from",
        moreCountries1: "And more than",
        moreCountries2: "150 countries",
        feat1Title: "Instant activation",
        feat1Sub: "Receive your eSIM in minutes.",
        feat2Title: "No physical SIM",
        feat2Sub: "Install and activate your eSIM easily.",
        feat3Title: "Reliable network",
        feat3Sub: "Enjoy a stable and high-speed connection.",
        feat4Title: "24/7 Support",
        feat4Sub: "Our team is here to assist you anytime.",
        modalTitle: "Packages —",
        modalSub: "Choose an eSIM package",
        noPackage: "No packages available for this destination.",
        errorLoading: "Unable to load packages for this destination.",
        retry: "Retry",
        noResultsTitle: "No destinations found",
        noResultsSub: "Try adjusting your search or explore our other available destinations.",
        clearSearch: "Clear search",
        day: "day",
        days: "days",
    },
    ar: {
        badge: "اتصال فوري في أكثر من 180 دولة",
        heroTitle1: "ابقَ على اتصال",
        heroTitle2: "في جميع أنحاء العالم",
        heroSub: "استمتع بشريحة eSIM سريعة وآمنة دون الحاجة لتبديل الشريحة الفعلية. تفعيل فوري في ثوانٍ.",
        searchLabel: "البحث عن دولة",
        searchPlaceholder: "اختر وجهتك",
        countries: "الدول",
        regions: "المناطق",
        allDestinations: "جميع الوجهات",
        allRegions: "جميع المناطق",
        fromPrice: "ابتداءً من",
        moreCountries1: "وأكثر من",
        moreCountries2: "150 دولة",
        feat1Title: "تفعيل فوري",
        feat1Sub: "احصل على شريحتك في دقائق معدودة.",
        feat2Title: "بدون شريحة تقليدية",
        feat2Sub: "تثبيت وتفعيل مباشر وسلس.",
        feat3Title: "شبكة موثوقة",
        feat3Sub: "تمتع باتصال سريع ومستقر أينما كنت.",
        feat4Title: "دعم مستمر",
        feat4Sub: "فريق الدعم متواجد دائماً لمساعدتك.",
        modalTitle: "الباقات —",
        modalSub: "اختر باقة eSIM المناسبة لك",
        noPackage: "لا توجد باقات متاحة لهذه الوجهة حالياً.",
        errorLoading: "تعذر تحميل باقات هذه الوجهة حالياً.",
        retry: "إعادة المحاولة",
        noResultsTitle: "لم يتم العثور على أي وجهة",
        noResultsSub: "يرجى تغيير عبارة البحث أو استعراض الوجهات الأخرى المتاحة.",
        clearSearch: "مسح البحث",
        day: "يوم",
        days: "أيام",
    },
};

function useDebounce<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debounced;
}

const formatDuration = (days: number, lang: string) => {
    if (days <= 1) {
        if (lang === 'ar') return '1 يوم';
        if (lang === 'en') return '1 day';
        return '1 jour';
    }
    if (lang === 'ar') return `${days} أيام`;
    if (lang === 'en') return `${days} days`;
    return `${days} jours`;
};

const SkeletonCard = () => (
    <div className="rounded-2xl overflow-hidden border border-gray-100 bg-white animate-pulse">
        <div className="h-40 bg-gray-200" />
        <div className="p-4 flex justify-between items-center">
            <div className="space-y-2 w-full">
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
            </div>
            <div className="w-5 h-5 bg-gray-200 rounded-full shrink-0" />
        </div>
    </div>
);

interface PackageModalProps {
    locationCode: string;
    locationName: string;
    onClose: () => void;
    cover: string;
}

const PackageModal = ({ locationCode, locationName, onClose, cover }: PackageModalProps) => {
    const navigate = useNavigate();
    const { language } = useLanguage();
    const t = esimTexts[language] || esimTexts.fr;

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['esim-packages', locationCode],
        queryFn: () => getPackages(locationCode, 'dzd'),
    });

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = originalOverflow;
        };
    }, [onClose]);

    const handleOrder = (pkg: EsimPackage) => {
        const discounted = getDiscountedPrice(pkg, pkg.duration);
        const params = new URLSearchParams({
            pkg: String(pkg.id),
            loc: locationCode,
            name: locationName,
            volume: String(pkg.volume),
            duration: String(pkg.duration),
            price: String(discounted),
            cover: cover,
        });
        navigate(`/esim/checkout?${params.toString()}`);
    };

    const sortedPackages = useMemo(() => {
        if (!data?.packages) return [];
        return [...data.packages].sort((a, b) => {
            if (a.duration !== b.duration) {
                return a.duration - b.duration;
            }
            return a.volume - b.volume;
        });
    }, [data?.packages]);

    return (
        <div 
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" 
            role="dialog" 
            aria-modal="true"
            style={{
                paddingTop: 'env(safe-area-inset-top, 0px)',
            }}
        >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={onClose} />
            <div 
                className="relative z-10 w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden mb-0 sm:mb-0"
                style={{
                    paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.5rem)',
                }}
            >
                <div className="flex justify-center pt-3 pb-1 sm:hidden">
                    <div className="w-10 h-1 bg-gray-300 rounded-full" />
                </div>
                
                {/* Header */}
                <div className="px-5 pt-3 pb-2 flex items-start justify-between border-b border-gray-100">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 mb-0.5">{t.modalTitle} {locationName}</h2>
                        <p className="text-sm text-gray-500">{t.modalSub}</p>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="p-1.5 -mr-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Packages list with comfortable bottom margin */}
                <div className="p-5 pt-3 overflow-y-auto space-y-3 pb-12 sm:pb-8 mb-2 sm:mb-0">
                    {isLoading && (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    )}

                    {isError && (
                        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-center space-y-2 mb-3">
                            <p className="text-sm font-medium text-red-700">{t.errorLoading}</p>
                            <button
                                onClick={() => refetch()}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                            >
                                <RotateCw className="w-3.5 h-3.5" />
                                {t.retry}
                            </button>
                        </div>
                    )}

                    {!isLoading && !isError && sortedPackages.length === 0 && (
                        <p className="text-xs text-gray-400 mb-3">{t.noPackage}</p>
                    )}

                    {sortedPackages.map((pkg) => {
                        const discounted = getDiscountedPrice(pkg, pkg.duration);
                        const operators = pkg.locationNetworkList?.[0]?.operatorList ?? [];
                        return (
                            <div key={pkg.id} className="border border-gray-200 rounded-xl p-4 hover:border-blue-400 transition-colors bg-white shadow-xs">
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <span className="font-semibold text-gray-900">{formatBytes(pkg.volume)}</span>
                                        <span className="text-gray-400 mx-1">·</span>
                                        <span className="text-gray-600 text-sm">
                                            {formatDuration(pkg.duration, language)}
                                        </span>
                                    </div>
                                    <div className="text-right rtl:text-left">
                                        {discounted < pkg.price && (
                                            <div className="text-xs text-gray-400 line-through">{pkg.price.toLocaleString()} DZD</div>
                                        )}
                                        <div className="font-bold text-blue-600">{discounted.toLocaleString()} DZD</div>
                                    </div>
                                </div>
                                {operators.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-3">
                                        {operators.map((op, i) => (
                                            <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                                {op.operatorName} · {op.networkType}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <button
                                    onClick={() => handleOrder(pkg)}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors shadow-xs active:scale-[0.99]"
                                >
                                    {language === 'ar' ? 'طلب' : language === 'en' ? 'Order' : 'Commander'}
                                </button>
                            </div>
                        );
                    })}

                    {/* Bottom margin spacer for mobile navigation & safe area */}
                    <div className="h-6 sm:h-2" aria-hidden="true" />
                </div>
            </div>
        </div>
    );
};

const EsimStore = () => {
    const { language } = useLanguage();
    const t = esimTexts[language] || esimTexts.fr;
    const [searchParams] = useSearchParams();
    const [search, setSearch] = useState(() => searchParams.get('search') || searchParams.get('q') || '');
    const [activeTab, setActiveTab] = useState<'countries' | 'regions'>('countries');
    const [selectedLoc, setSelectedLoc] = useState<Location | null>(null);
    const [showAllLocations, setShowAllLocations] = useState(false);
    const debouncedSearch = useDebounce(search, 300);

    const { data, isLoading } = useQuery({
        queryKey: ['esim-locations', debouncedSearch],
        queryFn: () => searchLocations(debouncedSearch),
    });

    const baseLocations = activeTab === 'countries' ? (data?.countries ?? []) : (data?.regions ?? []);

    const filteredLocations = useMemo(() => {
        const query = debouncedSearch.trim().toLowerCase();
        if (!query) return baseLocations;
        return baseLocations.filter((loc) => {
            const nameMatch = (loc?.name || '').toLowerCase().includes(query);
            const codeMatch = (loc?.code || '').toLowerCase().includes(query);
            return nameMatch || codeMatch;
        });
    }, [baseLocations, debouncedSearch]);

    const isSearching = debouncedSearch.trim() !== '';
    const displayedLocations = (showAllLocations || isSearching) ? filteredLocations : filteredLocations.slice(0, 17);
    const showMoreCard = !showAllLocations && !isSearching && filteredLocations.length > 17;

    return (
        <div className="min-h-screen bg-[#e2f1fb] relative overflow-hidden">

            {/* Image de fond — hauteur fixe (limitée au hero) + fondu progressif vers transparent en bas */}
            <div
                className="absolute top-0 left-0 w-full h-[620px] md:h-[660px] overflow-hidden bg-[url('/esim2.png')] bg-no-repeat bg-top bg-cover pointer-events-none z-0"
                style={{
                    maskImage: 'linear-gradient(to bottom, black 0%, black 70%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 70%, transparent 100%)',
                }}
            />

            {/* Scrim overlay pour garantir une lisibilité optimale du texte */}
            <div
                className="absolute top-0 left-0 w-full h-[620px] md:h-[660px] pointer-events-none z-[1] bg-gradient-to-b from-[#e2f1fb]/95 via-[#e2f1fb]/80 to-transparent md:bg-gradient-to-r md:from-[#e2f1fb] md:via-[#e2f1fb]/90 md:via-48% md:to-transparent"
            />

            {/* Contenu principal */}
            <div className="relative z-10">
                {/* Hero Section */}
                <div className="relative w-full">
                    <div
                        className="max-w-7xl mx-auto px-4 pb-20 md:pb-24 relative z-10 w-full flex flex-col md:flex-row items-center pt-32 sm:pt-36 md:pt-40"
                        style={{
                            paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8.5rem)',
                        }}
                    >
                        <div className="w-full md:w-1/2 pr-0 md:pr-8 rtl:md:pr-0 rtl:md:pl-8">
                            {/* Badge */}
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 border border-blue-200/80 shadow-xs mb-4 backdrop-blur-sm">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-xs font-bold text-[#0454E8] tracking-wide">
                                    {t.badge}
                                </span>
                            </div>

                            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-[#002161] leading-[1.18] mb-4 tracking-tight drop-shadow-xs">
                                {t.heroTitle1} <br />
                                <span
                                    className="text-[#FF8A00] font-normal inline-block"
                                    style={{
                                        fontFamily: "'Kaushan Script', cursive",
                                        fontSize: "1.15em",
                                        textShadow: "0 2px 10px rgba(255, 138, 0, 0.25)"
                                    }}
                                >
                                    {t.heroTitle2}
                                </span>
                            </h1>
                            <p className="text-slate-700 text-base sm:text-lg mb-8 max-w-md font-medium leading-relaxed drop-shadow-xs">
                                {t.heroSub}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Floating Search Bar */}
                <div className="max-w-3xl mx-auto px-3 -mt-16 relative z-20">
                    <div className="bg-white rounded-full shadow-xl py-3 px-4 flex items-center border border-gray-100">
                        <div className="flex items-center gap-4 flex-1 px-2">
                            <Search className="w-6 h-6 text-blue-600 shrink-0" />
                            <div className="flex-1 border-l rtl:border-l-0 rtl:border-r pl-4 rtl:pl-0 rtl:pr-4 border-gray-200 flex flex-col justify-center">
                                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{t.searchLabel}</span>
                                <input
                                    type="text"
                                    placeholder={t.searchPlaceholder}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full outline-none text-gray-900 font-medium placeholder-gray-400 text-sm sm:text-base bg-transparent mt-0.5"
                                />
                            </div>
                            {search && (
                                <button
                                    onClick={() => setSearch('')}
                                    aria-label={t.clearSearch}
                                    className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabs & Grid Section */}
                <div className="max-w-7xl mx-auto px-4 pt-12 relative z-10">

                    {/* Tabs */}
                    <div className="flex gap-2 mb-8">
                        {(['countries', 'regions'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => {
                                    setActiveTab(tab);
                                    setShowAllLocations(false);
                                }}
                                className={`px-6 py-2.5 rounded-full text-sm font-medium transition-colors shadow-sm ${
                                    activeTab === tab
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                                }`}
                            >
                                {tab === 'countries'
                                    ? <span className="flex items-center gap-2"><Globe className="w-4 h-4" />{t.countries}</span>
                                    : <span className="flex items-center gap-2"><Wifi className="w-4 h-4" />{t.regions}</span>
                                }
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl md:text-3xl font-bold text-[#002161]">
                            {activeTab === 'countries' ? t.allDestinations : t.allRegions}
                        </h2>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 pb-12">
                        {isLoading
                            ? Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)
                            : displayedLocations.map((loc) => (
                                <button
                                    key={loc.code}
                                    onClick={() => setSelectedLoc(loc)}
                                    className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all text-left rtl:text-right flex flex-col group min-h-[240px]"
                                >
                                    <div className="relative h-36 w-full bg-slate-100 flex items-center justify-center overflow-hidden">
                                        {loc.cover ? (
                                            <img
                                                src={loc.cover}
                                                alt={loc.name}
                                                loading="lazy"
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                onError={(e) => {
                                                    (e.currentTarget as HTMLElement).style.display = 'none';
                                                }}
                                            />
                                        ) : (
                                            <Globe className="w-10 h-10 text-slate-300" />
                                        )}
                                        {loc.image && (
                                            <img
                                                src={loc.image}
                                                alt=""
                                                loading="lazy"
                                                className="absolute bottom-3 left-3 rtl:left-auto rtl:right-3 w-8 h-6 object-cover rounded shadow-md border border-white"
                                                onError={(e) => {
                                                    (e.currentTarget as HTMLElement).style.display = 'none';
                                                }}
                                            />
                                        )}
                                    </div>
                                    <div className="p-4 flex items-end justify-between flex-1">
                                        <div className="w-full">
                                            <h3 className="font-bold text-[#002161] text-base mb-1 truncate" title={loc.name}>{loc.name}</h3>
                                            {loc.fromPrice > 0 && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {t.fromPrice} <br />
                                                    <span className="font-bold text-blue-600 text-sm">{loc.fromPrice.toLocaleString()} DZD</span>
                                                </p>
                                            )}
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-blue-600 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 rtl:rotate-180 transition-transform shrink-0" />
                                    </div>
                                </button>
                            ))
                        }

                        {!isLoading && displayedLocations.length === 0 && (
                            <div className="col-span-full py-12 px-6 text-center flex flex-col items-center justify-center bg-white/70 backdrop-blur-xs rounded-3xl border border-blue-100/70 shadow-sm">
                                <Globe className="w-12 h-12 text-blue-400 mb-3" />
                                <h3 className="text-lg font-bold text-[#002161] mb-1">{t.noResultsTitle}</h3>
                                <p className="text-sm text-gray-500 max-w-md mb-4">{t.noResultsSub}</p>
                                {isSearching && (
                                    <button
                                        onClick={() => setSearch('')}
                                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-xs active:scale-95"
                                    >
                                        {t.clearSearch}
                                    </button>
                                )}
                            </div>
                        )}

                        {showMoreCard && (
                            <button
                                onClick={() => setShowAllLocations(true)}
                                className="bg-blue-50/50 rounded-2xl overflow-hidden border border-blue-100 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all text-center flex flex-col items-center justify-center min-h-[240px] relative"
                            >
                                <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('/assets/dotted-map.svg')] bg-cover bg-center" />
                                <div className="p-5 flex flex-col items-center justify-center relative z-10 w-full h-full">
                                    <h3 className="font-semibold text-[#002161] text-base mb-1">{t.moreCountries1}</h3>
                                    <span className="font-extrabold text-[#002161] text-3xl">{t.moreCountries2}</span>
                                </div>
                            </button>
                        )}
                    </div>
                </div>

                {/* Features Info Banner */}
                <div className="max-w-7xl mx-auto px-4 py-8 mb-16 relative z-10">
                    <div className="bg-white rounded-3xl p-8 border border-white shadow-xl flex flex-col md:flex-row items-center gap-8">
                        <div className="w-full md:w-1/4 flex justify-center">
                            <div className="bg-blue-50 rounded-full p-6 shadow-inner">
                                <Wifi className="w-16 h-16 text-blue-600" />
                            </div>
                        </div>
                        <div className="w-full md:w-3/4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left rtl:md:text-right">
                            <div>
                                <Zap className="w-6 h-6 text-blue-600 mx-auto md:mx-0 mb-3" />
                                <h4 className="font-bold text-[#002161] text-sm mb-1">{t.feat1Title}</h4>
                                <p className="text-xs text-gray-500">{t.feat1Sub}</p>
                            </div>
                            <div>
                                <Lock className="w-6 h-6 text-blue-600 mx-auto md:mx-0 mb-3" />
                                <h4 className="font-bold text-[#002161] text-sm mb-1">{t.feat2Title}</h4>
                                <p className="text-xs text-gray-500">{t.feat2Sub}</p>
                            </div>
                            <div>
                                <Signal className="w-6 h-6 text-blue-600 mx-auto md:mx-0 mb-3" />
                                <h4 className="font-bold text-[#002161] text-sm mb-1">{t.feat3Title}</h4>
                                <p className="text-xs text-gray-500">{t.feat3Sub}</p>
                            </div>
                            <div>
                                <Headset className="w-6 h-6 text-blue-600 mx-auto md:mx-0 mb-3" />
                                <h4 className="font-bold text-[#002161] text-sm mb-1">{t.feat4Title}</h4>
                                <p className="text-xs text-gray-500">{t.feat4Sub}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {selectedLoc && (
                    <PackageModal
                        locationCode={selectedLoc.code}
                        locationName={selectedLoc.name}
                        onClose={() => setSelectedLoc(null)}
                        cover={selectedLoc.cover ?? ''}
                    />
                )}
            </div>
        </div>
    );
};

export default EsimStore;