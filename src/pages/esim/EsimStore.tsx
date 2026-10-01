import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Search, Wifi, Globe, Plane, Zap, Lock, Signal, Headset, ChevronRight, ChevronDown
} from 'lucide-react';
import {
    searchLocations,
    getPackages,
    formatBytes,
    getDiscountedPrice,
    type Location,
    type EsimPackage,
} from '@/service/esim.service';
import { pingEsimTest, testEsimFullFlow } from '@/service/GoSim/esim';
import { useLanguage } from '@/i18n/LanguageContext';

function useDebounce<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debounced;
}

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
    const { t, language } = useLanguage();
    const numberLocale = language === 'ar' ? 'ar-DZ' : language === 'en' ? 'en-US' : 'fr-FR';

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['esim-packages', locationCode],
        queryFn: () => getPackages(locationCode, 'dzd'),
    });

    const handleOrder = (pkg: EsimPackage) => {
        const params = new URLSearchParams({
            pkg: String(pkg.id),
            loc: locationCode,
            name: locationName,
            volume: String(pkg.volume),
            duration: String(pkg.duration),
            price: String(pkg.price),
            cover: cover,
        });
        navigate(`/esim/checkout?${params.toString()}`);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative z-10 w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl max-h-[85vh] overflow-y-auto shadow-2xl">
                <div className="flex justify-center pt-3 pb-1 sm:hidden">
                    <div className="w-10 h-1 bg-gray-300 rounded-full" />
                </div>
                <div className="p-5">
                    <h2 className="text-lg font-bold text-gray-900 mb-1">{t('esimPackagesFor')} — {locationName}</h2>
                    <p className="text-sm text-gray-500 mb-4">{t('esimChoosePackage')}</p>

                    {isLoading && (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    )}

                    {isError && (
                        <pre className="text-xs bg-red-950 text-red-300 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap mb-3">
                            `${t('esimPackagesLoadError')} ${error instanceof Error ? error.message : String(error)}`
                        </pre>
                    )}

                    {!isLoading && !isError && (!data?.packages || data.packages.length === 0) && (
                        <p className="text-xs text-gray-400 mb-3">{t('esimNoPackages')}</p>
                    )}

                    {data?.packages.map((pkg) => {
                        const discounted = getDiscountedPrice(pkg, pkg.duration);
                        const operators = pkg.locationNetworkList?.[0]?.operatorList ?? [];
                        return (
                            <div key={pkg.id} className="border border-gray-200 rounded-xl p-4 mb-3 hover:border-blue-400 transition-colors bg-white">
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <span className="font-semibold text-gray-900">{formatBytes(pkg.volume)}</span>
                                        <span className="text-gray-400 mx-1">·</span>
                                        <span className="text-gray-600 text-sm">{pkg.duration} {t('esimDays')}</span>
                                    </div>
                                    <div className="text-right">
                                        {discounted < pkg.price && (
                                            <div className="text-xs text-gray-400 line-through">{pkg.price.toLocaleString(numberLocale)} DZD</div>
                                        )}
                                        <div className="font-bold text-blue-600">{discounted.toLocaleString(numberLocale)} DZD</div>
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
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                                >
                                    {t('esimOrder')}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const EsimStore = () => {
    const { t, language } = useLanguage();
    const numberLocale = language === 'ar' ? 'ar-DZ' : language === 'en' ? 'en-US' : 'fr-FR';
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<'countries' | 'regions'>('countries');
    const [selectedLoc, setSelectedLoc] = useState<Location | null>(null);
    const [showAllLocations, setShowAllLocations] = useState(false);
    const debouncedSearch = useDebounce(search, 300);

    const { data, isLoading } = useQuery({
        queryKey: ['esim-locations', debouncedSearch],
        queryFn: () => searchLocations(debouncedSearch),
    });

    const baseLocations = activeTab === 'countries' ? (data?.countries ?? []) : (data?.regions ?? []);

    const filteredLocations = baseLocations.filter((loc) =>
        loc.name.toLowerCase().includes(debouncedSearch.toLowerCase())
    );

    const isSearching = debouncedSearch.trim() !== '';
    const displayedLocations = (showAllLocations || isSearching) ? filteredLocations : filteredLocations.slice(0, 17);
    const showMoreCard = !showAllLocations && !isSearching && filteredLocations.length > 17;

    return (
        <div className="min-h-screen bg-[#e2f1fb] relative overflow-hidden">

            {/* Image de fond — hauteur fixe (limitée au hero) + fondu progressif vers transparent en bas, opacité 100% */}
            <div
                className="absolute top-0 left-0 w-full h-[500px] md:h-[560px] overflow-hidden bg-[url('/esim2.png')] bg-no-repeat bg-top bg-cover pointer-events-none z-0"
                style={{
                    maskImage: 'linear-gradient(to bottom, black 0%, black 65%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 65%, transparent 100%)',
                }}
            />

            {/* Contenu principal */}
            <div className="relative z-10">
                {/* Hero Section */}
                <div className="relative min-h-[450px] flex items-center">
                    <div className="max-w-7xl mx-auto px-4 pt-10 pb-20 relative z-10 w-full flex flex-col md:flex-row items-center">
                        <div className="w-full md:w-1/2 pr-0 md:pr-8 mt-10 md:mt-0">
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#002161] leading-tight mb-4">
                                {t('esimHeroTitle')} <br />
                                <span
                                    className="text-orange-500 font-normal"
                                    style={{ fontFamily: "'Kaushan Script', cursive", fontSize: "1.15em" }}
                                >
                                    {t('esimHeroHighlight')}
                                </span>
                            </h1>
                            <p className="text-[#002161]/80 text-lg mb-8 max-w-md font-medium">
                                {t('esimHeroDescription')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Floating Search Bar */}
                <div className="max-w-3xl mx-auto px-3 -mt-16 relative z-20">
                    <div className="bg-white rounded-full shadow-xl py-3 px-4 flex items-center border border-gray-100">
                        <div className="flex items-center gap-4 flex-1 px-2">
                            <Search className="w-6 h-6 text-blue-600 shrink-0" />
                            <div className="flex-1 border-l pl-4 border-gray-200 flex flex-col justify-center">
                                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{t('esimSearchLabel')}</span>
                                <input
                                    type="text"
                                    placeholder={t('esimSearchPlaceholder')}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full outline-none text-gray-900 font-medium placeholder-gray-400 text-sm sm:text-base bg-transparent mt-0.5"
                                />
                            </div>
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
                                    ? <span className="flex items-center gap-2"><Globe className="w-4 h-4" />{t('esimCountriesTab')}</span>
                                    : <span className="flex items-center gap-2"><Wifi className="w-4 h-4" />{t('esimRegionsTab')}</span>
                                }
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl md:text-3xl font-bold text-[#002161]">
                            {activeTab === 'countries' ? t('esimAllDestinations') : t('esimAllRegions')}
                        </h2>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 pb-12">
                        {isLoading
                            ? Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)
                            : displayedLocations.map((loc) => (
                                <button
                                    key={loc.code}
                                    onClick={() => setSelectedLoc(loc)}
                                    className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all text-left flex flex-col group min-h-[240px]"
                                >
                                    <div className="relative h-36 w-full bg-gray-200">
                                        {loc.cover && (
                                            <img src={loc.cover} alt={loc.name} className="w-full h-full object-cover" />
                                        )}
                                        {loc.image && (
                                            <img src={loc.image} alt="" className="absolute bottom-3 left-3 w-8 h-6 object-cover rounded shadow-md" />
                                        )}
                                    </div>
                                    <div className="p-4 flex items-end justify-between flex-1">
                                        <div className="w-full">
                                            <h3 className="font-bold text-[#002161] text-base mb-1 truncate" title={loc.name}>{loc.name}</h3>
                                            {loc.fromPrice > 0 && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {t('esimStartingFrom')} <br />
                                                    <span className="font-bold text-blue-600 text-sm">{loc.fromPrice.toLocaleString(numberLocale)} DZD</span>
                                                </p>
                                            )}
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform shrink-0" />
                                    </div>
                                </button>
                            ))
                        }

                        {showMoreCard && (
                            <button
                                onClick={() => setShowAllLocations(true)}
                                className="bg-blue-50/50 rounded-2xl overflow-hidden border border-blue-100 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all text-center flex flex-col items-center justify-center min-h-[240px] relative"
                            >
                                <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('/assets/dotted-map.svg')] bg-cover bg-center" />
                                <div className="p-5 flex flex-col items-center justify-center relative z-10 w-full h-full">
                                    <h3 className="font-semibold text-[#002161] text-base mb-1">{t('esimMore')}</h3>
                                    <span className="font-extrabold text-[#002161] text-3xl">{t('esimCountries150')}</span>
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
                        <div className="w-full md:w-3/4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left">
                            <div>
                                <Zap className="w-6 h-6 text-blue-600 mx-auto md:mx-0 mb-3" />
                                <h4 className="font-bold text-[#002161] text-sm mb-1">{t('esimFeatureInstant')}</h4>
                                <p className="text-xs text-gray-500">{t('esimFeatureInstantDescription')}</p>
                            </div>
                            <div>
                                <Lock className="w-6 h-6 text-blue-600 mx-auto md:mx-0 mb-3" />
                                <h4 className="font-bold text-[#002161] text-sm mb-1">{t('esimFeatureNoSim')}</h4>
                                <p className="text-xs text-gray-500">{t('esimFeatureNoSimDescription')}</p>
                            </div>
                            <div>
                                <Signal className="w-6 h-6 text-blue-600 mx-auto md:mx-0 mb-3" />
                                <h4 className="font-bold text-[#002161] text-sm mb-1">{t('esimFeatureNetwork')}</h4>
                                <p className="text-xs text-gray-500">{t('esimFeatureNetworkDescription')}</p>
                            </div>
                            <div>
                                <Headset className="w-6 h-6 text-blue-600 mx-auto md:mx-0 mb-3" />
                                <h4 className="font-bold text-[#002161] text-sm mb-1">{t('esimFeatureSupport')}</h4>
                                <p className="text-xs text-gray-500">{t('esimFeatureSupportDescription')}</p>
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