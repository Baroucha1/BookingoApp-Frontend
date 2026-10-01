// import { useState, useEffect, useMemo } from 'react';
// import { Search, SlidersHorizontal, X, ArrowDownUp, Clock, Wallet } from 'lucide-react';
// import { useLanguage } from '@/i18n/LanguageContext';
// import VisaDestinationCard from '@/components/VisaDestinationCard';
// import { Input } from '@/components/ui/input';
// import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';
// import { Slider } from '@/components/ui/slider';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
// import { Checkbox } from '@/components/ui/checkbox';
// import { ScrollArea } from '@/components/ui/scroll-area';
// import { motion } from 'framer-motion';
// import {getAllVisaTypes, getPublicVisaTypes, VisaType} from '../service/visaType.service.ts';
// import type { Country } from '../lib/types.ts';
//
//
// export interface CountryGroup {
//   code:            string;
//   nameFr:          string;
//   nameEn:          string;
//   nameAr:          string;
//   country:         Country;          // full country — descriptions, points forts, etc.
//   flag_url:        string | null;    // uploaded FLAG image or null
//   hero_url:        string | null;    // uploaded HERO image or null
//   thumb_url:       string | null;    // uploaded THUMBNAIL image or null
//   min_price:       number;
//   currency:        string;
//   min_stay:        number;
//   processing_days: number;
//   visa_count:      number;
//   visaTypes:       VisaType[];
// }
//
// // ── Group helpers ─────────────────────────────────────────────────────────────
// function groupByCountry(visas: VisaType[]): CountryGroup[] {
//   const map = new Map<string, VisaType[]>();
//   for (const v of visas) {
//     const arr = map.get(v.country.code) ?? [];
//     arr.push(v);
//     map.set(v.country.code, arr);
//   }
//
//   return Array.from(map.values()).map(arr => {
//     const cheapest = arr.reduce((a, b) => (a.price <= b.price ? a : b));
//     const c = cheapest.country as Country; // full country from include: { country: true }
//     const imgs = c.images ?? [];
//
//     return {
//       code:            c.code,
//       nameFr:          c.nameFr,
//       nameEn:          c.nameEn,
//       nameAr:          c.nameAr,
//       country:         c,
//       flag_url:        imgs.find(i => i.imageType === 'FLAG')?.url
//           ?? `https://flagcdn.com/w80/${c.code.toLowerCase()}.png`,
//       hero_url:        imgs.find(i => i.imageType === 'HERO')?.url ?? null,
//       thumb_url:       imgs.find(i => i.imageType === 'THUMBNAIL')?.url ?? null,
//       min_price:       cheapest.price,
//       currency:        cheapest.currency,
//       min_stay:        cheapest.duration,
//       processing_days: cheapest.processingDelay,
//       visa_count:      arr.length,
//       visaTypes:       arr,
//     };
//   });
// }
//
// // ── Types ─────────────────────────────────────────────────────────────────────
// type SortKey     = 'name_asc' | 'price_asc' | 'price_desc' | 'processing_asc' | 'processing_desc';
// type SpeedBucket = 'express' | 'fast' | 'standard' | 'slow';
//
// const SPEED_BUCKETS: Record<SpeedBucket, {
//   label: { fr: string; en: string; ar: string };
//   test:  (d: number) => boolean;
// }> = {
//   express:  { label: { fr: 'Express (< 24 h)',  en: 'Express (< 24 h)',  ar: 'سريع (أقل من 24 ساعة)' }, test: d => d < 1              },
//   fast:     { label: { fr: '1 à 3 jours',        en: '1 to 3 days',       ar: '1 إلى 3 أيام'           }, test: d => d >= 1 && d <= 3   },
//   standard: { label: { fr: '4 à 7 jours',        en: '4 to 7 days',       ar: '4 إلى 7 أيام'           }, test: d => d > 3  && d <= 7   },
//   slow:     { label: { fr: 'Plus de 7 jours',    en: 'More than 7 days',  ar: 'أكثر من 7 أيام'         }, test: d => d > 7              },
// };
//
// // ── Component ─────────────────────────────────────────────────────────────────
// const Destinations = () => {
//   const { t, language } = useLanguage();
//   const [search,   setSearch]   = useState('');
//   const [allVisas, setAllVisas] = useState<VisaType[]>([]);
//   const [loading,  setLoading]  = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [sortKey,           setSortKey]           = useState<SortKey>('name_asc');
//   const [priceRange,        setPriceRange]        = useState<[number, number] | null>(null);
//   const [selectedSpeeds,    setSelectedSpeeds]    = useState<SpeedBucket[]>([]);
//   const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
//
//   useEffect(() => {
//     (async () => {
//       setLoading(true);
//       setError(null);
//       try {
//         const data = await getPublicVisaTypes();
//         setAllVisas(data);
//       } catch (err) {
//         const message = err instanceof Error ? err.message : String(err);
//         console.error(message);
//         setError(message);
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, []);
//
//
//
//
//   const groups = useMemo(() => groupByCountry(allVisas), [allVisas]);
//
//   const priceBounds = useMemo<[number, number]>(() => {
//     if (!groups.length) return [0, 50000];
//     const prices = groups.map(g => g.min_price);
//     return [Math.min(...prices), Math.max(...prices)];
//   }, [groups]);
//
//   useEffect(() => {
//     if (priceRange === null && groups.length > 0) setPriceRange(priceBounds);
//   }, [groups.length, priceBounds, priceRange]);
//
//   const localizedName = (g: CountryGroup) =>
//       language === 'ar' ? g.nameAr : language === 'fr' ? g.nameFr : g.nameEn;
//
//   const filtered = useMemo(() => {
//     const result = groups.filter(g => {
//       if (search && !localizedName(g).toLowerCase().includes(search.toLowerCase())) return false;
//       if (priceRange && (g.min_price < priceRange[0] || g.min_price > priceRange[1])) return false;
//       if (selectedSpeeds.length > 0) {
//         const d = g.processing_days;
//         if (!selectedSpeeds.some(s => SPEED_BUCKETS[s].test(d))) return false;
//       }
//       if (selectedCountries.length > 0 && !selectedCountries.includes(g.code)) return false;
//       return true;
//     });
//
//     return [...result].sort((a, b) => {
//       switch (sortKey) {
//         case 'price_asc':       return a.min_price - b.min_price;
//         case 'price_desc':      return b.min_price - a.min_price;
//         case 'processing_asc':  return a.processing_days - b.processing_days;
//         case 'processing_desc': return b.processing_days - a.processing_days;
//         default:                return localizedName(a).localeCompare(localizedName(b));
//       }
//     });
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [groups, search, priceRange, selectedSpeeds, selectedCountries, sortKey, language]);
//
//   const activeFilterCount =
//       selectedSpeeds.length +
//       selectedCountries.length +
//       (priceRange && (priceRange[0] !== priceBounds[0] || priceRange[1] !== priceBounds[1]) ? 1 : 0);
//
//   const resetFilters = () => {
//     setSelectedSpeeds([]);
//     setSelectedCountries([]);
//     setPriceRange(priceBounds);
//     setSortKey('name_asc');
//     setSearch('');
//   };
//
//   const toggleSpeed   = (s: SpeedBucket) => setSelectedSpeeds(p   => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);
//   const toggleCountry = (c: string)      => setSelectedCountries(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c]);
//
//   const tx = {
//     sortBy:       language === 'ar' ? 'الترتيب حسب'      : language === 'fr' ? 'Trier par'                    : 'Sort by',
//     name:         language === 'ar' ? 'الاسم (أ-ي)'       : language === 'fr' ? 'Nom (A-Z)'                    : 'Name (A-Z)',
//     priceLow:     language === 'ar' ? 'السعر : من الأدنى' : language === 'fr' ? 'Prix croissant'               : 'Price: Low to High',
//     priceHigh:    language === 'ar' ? 'السعر : من الأعلى' : language === 'fr' ? 'Prix décroissant'             : 'Price: High to Low',
//     procFast:     language === 'ar' ? 'الأسرع معالجة'      : language === 'fr' ? 'Traitement le plus rapide'    : 'Fastest processing',
//     procSlow:     language === 'ar' ? 'الأبطأ معالجة'      : language === 'fr' ? 'Traitement le plus lent'      : 'Slowest processing',
//     filters:      language === 'ar' ? 'الفلاتر'           : language === 'fr' ? 'Filtres'                      : 'Filters',
//     reset:        language === 'ar' ? 'إعادة تعيين'        : language === 'fr' ? 'Réinitialiser'                : 'Reset',
//     priceRange:   language === 'ar' ? 'نطاق السعر'        : language === 'fr' ? 'Fourchette de prix'           : 'Price range',
//     processing:   language === 'ar' ? 'مدة المعالجة'      : language === 'fr' ? 'Délai de traitement'          : 'Processing time',
//     countries:    language === 'ar' ? 'الدول'             : language === 'fr' ? 'Pays'                         : 'Countries',
//     resultsFound: language === 'ar' ? 'وجهة'              : language === 'fr' ? 'destinations'                 : 'destinations',
//     noResults:    language === 'ar' ? 'لا توجد نتائج'     : language === 'fr' ? 'Aucun résultat trouvé'        : 'No results found',
//   };
//
//   return (
//       <div className="container py-10 md:py-14">
//         <motion.div
//             initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
//             className="mb-8"
//         >
//           <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{t('allDestinations')}</h1>
//           <p className="text-muted-foreground mt-2 max-w-xl">
//             {language === 'ar'
//                 ? 'اكتشف جميع الوجهات المتاحة وقدّم طلب التأشيرة في دقائق.'
//                 : language === 'fr'
//                     ? 'Découvrez toutes les destinations disponibles et lancez votre demande de visa en quelques minutes.'
//                     : 'Browse all available destinations and start your visa application in minutes.'}
//           </p>
//         </motion.div>
//
//         {/* Toolbar */}
//         <div className="flex flex-col lg:flex-row gap-3 mb-6">
//           <div className="relative flex-1">
//             <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
//             <Input
//                 value={search}
//                 onChange={e => setSearch(e.target.value)}
//                 placeholder={t('searchPlaceholder')}
//                 className="ps-10 h-11"
//             />
//           </div>
//
//           <Select value={sortKey} onValueChange={v => setSortKey(v as SortKey)}>
//             <SelectTrigger className="h-11 lg:w-[220px]">
//               <ArrowDownUp className="w-4 h-4 me-2 text-muted-foreground" />
//               <SelectValue placeholder={tx.sortBy} />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="name_asc">{tx.name}</SelectItem>
//               <SelectItem value="price_asc">{tx.priceLow}</SelectItem>
//               <SelectItem value="price_desc">{tx.priceHigh}</SelectItem>
//               <SelectItem value="processing_asc">{tx.procFast}</SelectItem>
//               <SelectItem value="processing_desc">{tx.procSlow}</SelectItem>
//             </SelectContent>
//           </Select>
//
//           <Popover>
//             <PopoverTrigger asChild>
//               <Button variant="outline" className="h-11 lg:w-auto relative">
//                 <SlidersHorizontal className="w-4 h-4 me-2" />
//                 {tx.filters}
//                 {activeFilterCount > 0 && (
//                     <Badge variant="secondary" className="ms-2 h-5 px-1.5 bg-primary text-primary-foreground hover:bg-primary">
//                       {activeFilterCount}
//                     </Badge>
//                 )}
//               </Button>
//             </PopoverTrigger>
//             <PopoverContent className="w-[340px] p-0" align="end">
//               <div className="p-4 border-b border-border flex items-center justify-between">
//                 <p className="font-semibold text-sm">{tx.filters}</p>
//                 {activeFilterCount > 0 && (
//                     <Button variant="ghost" size="sm" onClick={resetFilters} className="h-7 text-xs">
//                       <X className="w-3 h-3 me-1" /> {tx.reset}
//                     </Button>
//                 )}
//               </div>
//
//               <div className="p-4 space-y-5 max-h-[60vh] overflow-y-auto">
//                 {priceRange && (
//                     <div className="space-y-3">
//                       <div className="flex items-center gap-2 text-sm font-medium">
//                         <Wallet className="w-4 h-4 text-primary" /> {tx.priceRange}
//                       </div>
//                       <Slider
//                           value={priceRange}
//                           min={priceBounds[0]}
//                           max={priceBounds[1]}
//                           step={500}
//                           onValueChange={v => setPriceRange([v[0], v[1]])}
//                           className="mt-2"
//                       />
//                       <div className="flex items-center justify-between text-xs text-muted-foreground">
//                         <span>{priceRange[0].toLocaleString()} DA</span>
//                         <span>{priceRange[1].toLocaleString()} DA</span>
//                       </div>
//                     </div>
//                 )}
//
//                 <div className="space-y-2">
//                   <div className="flex items-center gap-2 text-sm font-medium">
//                     <Clock className="w-4 h-4 text-primary" /> {tx.processing}
//                   </div>
//                   <div className="space-y-2 pt-1">
//                     {(Object.keys(SPEED_BUCKETS) as SpeedBucket[]).map(key => (
//                         <label key={key} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded-md p-1.5 -mx-1.5 transition-colors">
//                           <Checkbox checked={selectedSpeeds.includes(key)} onCheckedChange={() => toggleSpeed(key)} />
//                           <span className="text-sm">{SPEED_BUCKETS[key].label[language]}</span>
//                         </label>
//                     ))}
//                   </div>
//                 </div>
//
//                 {groups.length > 0 && (
//                     <div className="space-y-2">
//                       <div className="flex items-center gap-2 text-sm font-medium">🌍 {tx.countries}</div>
//                       <ScrollArea className="h-44 -mx-1 pe-2">
//                         <div className="px-1 space-y-1">
//                           {[...groups]
//                               .sort((a, b) => localizedName(a).localeCompare(localizedName(b)))
//                               .map(g => (
//                                   <label key={g.code} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded-md p-1.5 transition-colors">
//                                     <Checkbox checked={selectedCountries.includes(g.code)} onCheckedChange={() => toggleCountry(g.code)} />
//                                     <img
//                                         src={g.flag_url ?? `https://flagcdn.com/w40/${g.code.toLowerCase()}.png`}
//                                         alt={g.nameFr}
//                                         className="w-5 h-5 rounded-full object-cover"
//                                     />
//                                     <span className="text-sm">{localizedName(g)}</span>
//                                   </label>
//                               ))}
//                         </div>
//                       </ScrollArea>
//                     </div>
//                 )}
//               </div>
//             </PopoverContent>
//           </Popover>
//         </div>
//
//         {/* Active filter chips */}
//         {activeFilterCount > 0 && (
//             <div className="flex flex-wrap items-center gap-2 mb-6">
//               {selectedSpeeds.map(s => (
//                   <Badge key={s} variant="secondary" className="gap-1 cursor-pointer" onClick={() => toggleSpeed(s)}>
//                     <Clock className="w-3 h-3" /> {SPEED_BUCKETS[s].label[language]} <X className="w-3 h-3" />
//                   </Badge>
//               ))}
//               {selectedCountries.map(c => {
//                 const g = groups.find(gr => gr.code === c);
//                 if (!g) return null;
//                 return (
//                     <Badge key={c} variant="secondary" className="gap-1 cursor-pointer" onClick={() => toggleCountry(c)}>
//                       {localizedName(g)} <X className="w-3 h-3" />
//                     </Badge>
//                 );
//               })}
//               {priceRange && (priceRange[0] !== priceBounds[0] || priceRange[1] !== priceBounds[1]) && (
//                   <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setPriceRange(priceBounds)}>
//                     <Wallet className="w-3 h-3" />
//                     {priceRange[0].toLocaleString()} – {priceRange[1].toLocaleString()} DA
//                     <X className="w-3 h-3" />
//                   </Badge>
//               )}
//               <Button variant="ghost" size="sm" onClick={resetFilters} className="h-7 text-xs">{tx.reset}</Button>
//             </div>
//         )}
//
//         <p className="text-sm text-muted-foreground mb-5">
//           <span className="font-semibold text-foreground">{filtered.length}</span> {tx.resultsFound}
//         </p>
//
//         {loading ? (
//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
//               {Array.from({ length: 6 }).map((_, i) => (
//                   <div key={i} className="h-72 rounded-2xl bg-muted animate-pulse" />
//               ))}
//             </div>
//         ) : error ? (
//             <div className="text-center py-16">
//               <p className="text-destructive font-medium mb-2">Failed to load destinations</p>
//               <p className="text-xs text-muted-foreground font-mono">{error}</p>
//             </div>
//         ) : filtered.length > 0 ? (
//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
//               {filtered.map((g, i) => (
//                   <VisaDestinationCard key={g.code} group={g} index={i} />
//               ))}
//             </div>
//         ) : (
//             <div className="text-center py-16">
//               <p className="text-muted-foreground mb-4">{tx.noResults}</p>
//               <Button variant="outline" onClick={resetFilters}>{tx.reset}</Button>
//             </div>
//         )}
//
//       </div>
//   );
// };
//
// export default Destinations;

import { useState, useEffect, useMemo } from 'react';
import {
  Search,
  SlidersHorizontal,
  X,
  ArrowDownUp,
  Clock,
  Wallet,
  LayoutGrid,
  List,
} from 'lucide-react';

import { useLanguage } from '@/i18n/LanguageContext.tsx';
import VisaDestinationCard from '@/components/VisaDestinationCard.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Slider } from '@/components/ui/slider.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover.tsx';
import { Checkbox } from '@/components/ui/checkbox.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { motion } from 'framer-motion';

import {
  getPublicVisaTypes,
  VisaType,
} from '../../service/visaType.service.ts';

import type { Country } from '../../lib/types.ts';

export interface CountryGroup {
  code: string;
  nameFr: string;
  nameEn: string;
  nameAr: string;
  country: Country;
  flag_url: string | null;
  hero_url: string | null;
  thumb_url: string | null;
  min_price: number;
  currency: string;
  min_stay: number;
  processing_days: number;
  visa_count: number;
  visaTypes: VisaType[];
}

// ── Group helpers ─────────────────────────────────────────────────────────────

function groupByCountry(visas: VisaType[]): CountryGroup[] {
  const map = new Map<string, VisaType[]>();

  for (const v of visas) {
    const arr = map.get(v.country.code) ?? [];
    arr.push(v);
    map.set(v.country.code, arr);
  }

  return Array.from(map.values()).map((arr) => {
    const cheapest = arr.reduce((a, b) =>
        a.price <= b.price ? a : b
    );

    const c = cheapest.country as Country;
    const imgs = c.images ?? [];

    return {
      code: c.code,
      nameFr: c.nameFr,
      nameEn: c.nameEn,
      nameAr: c.nameAr,
      country: c,

      flag_url:
          imgs.find((i) => i.imageType === 'FLAG')?.url ??
          `https://flagcdn.com/w80/${c.code.toLowerCase()}.png`,

      hero_url:
          imgs.find((i) => i.imageType === 'GALLERY' && i.isMain)?.url ??
          imgs.find((i) => i.imageType === 'GALLERY')?.url ??
          imgs.find((i) => i.imageType === 'HERO' && i.isMain)?.url ??
          imgs.find((i) => i.imageType === 'HERO')?.url ??
          null,

      thumb_url:
          imgs.find((i) => i.imageType === 'THUMBNAIL')?.url ?? null,

      min_price: cheapest.price,
      currency: cheapest.currency,
      min_stay: cheapest.duration,
      processing_days: cheapest.processingDelay,
      visa_count: arr.length,
      visaTypes: arr,
    };
  });
}

// ── visa status ───────────────────────────────────────────────────────────────

type VisaStatus = 'free' | 'arrival' | 'required';

function getVisaStatus(g: CountryGroup): VisaStatus {
  const req =
      (g.country as any)?.visaRequirement ??
      (g.country as any)?.visa_status ??
      null;

  if (
      req === 'FREE' ||
      req === 'sans_visa' ||
      req === 'NO_VISA'
  ) {
    return 'free';
  }

  if (
      req === 'ON_ARRIVAL' ||
      req === 'visa_arrivee' ||
      req === 'ARRIVAL'
  ) {
    return 'arrival';
  }

  return 'required';
}

// ── Types ─────────────────────────────────────────────────────────────────────

type SortKey =
    | 'name_asc'
    | 'price_asc'
    | 'price_desc'
    | 'processing_asc'
    | 'processing_desc';

type SpeedBucket =
    | 'express'
    | 'fast'
    | 'standard'
    | 'slow';

type ViewMode = 'grid' | 'list';

const SPEED_BUCKETS: Record<
    SpeedBucket,
    {
      label: {
        fr: string;
        en: string;
        ar: string;
      };
      test: (d: number) => boolean;
    }
> = {
  express: {
    label: {
      fr: 'Express (< 24 h)',
      en: 'Express (< 24 h)',
      ar: 'سريع (أقل من 24 ساعة)',
    },
    test: (d) => d < 1,
  },

  fast: {
    label: {
      fr: '1 à 3 jours',
      en: '1 to 3 days',
      ar: '1 إلى 3 أيام',
    },
    test: (d) => d >= 1 && d <= 3,
  },

  standard: {
    label: {
      fr: '4 à 7 jours',
      en: '4 to 7 days',
      ar: '4 إلى 7 أيام',
    },
    test: (d) => d > 3 && d <= 7,
  },

  slow: {
    label: {
      fr: 'Plus de 7 jours',
      en: 'More than 7 days',
      ar: 'أكثر من 7 أيام',
    },
    test: (d) => d > 7,
  },
};

const PAGE_SIZE = 20;
const LOAD_MORE_STEP = 8;

// ── Component ─────────────────────────────────────────────────────────────────

const Destinations = () => {
  const { t, language } = useLanguage();

  const [search, setSearch] = useState('');
  const [allVisas, setAllVisas] = useState<VisaType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sortKey, setSortKey] =
      useState<SortKey>('name_asc');

  const [priceRange, setPriceRange] =
      useState<[number, number] | null>(null);

  const [selectedSpeeds, setSelectedSpeeds] =
      useState<SpeedBucket[]>([]);

  const [selectedCountries, setSelectedCountries] =
      useState<string[]>([]);

  const [viewMode, setViewMode] =
      useState<ViewMode>('grid');

  const [visibleCount, setVisibleCount] =
      useState(PAGE_SIZE);

  // ── Fetch visas ───────────────────────────────────────────────────────────

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getPublicVisaTypes();
        setAllVisas(data);
      } catch (err) {
        const message =
            err instanceof Error
                ? err.message
                : String(err);

        console.error(message);
        setError(message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Groups ────────────────────────────────────────────────────────────────

  const groups = useMemo(
      () => groupByCountry(allVisas),
      [allVisas]
  );

  const priceBounds = useMemo<
      [number, number]
  >(() => {
    if (!groups.length) return [0, 50000];

    const prices = groups.map(
        (g) => g.min_price
    );

    return [
      Math.min(...prices),
      Math.max(...prices),
    ];
  }, [groups]);

  useEffect(() => {
    if (
        priceRange === null &&
        groups.length > 0
    ) {
      setPriceRange(priceBounds);
    }
  }, [
    groups.length,
    priceBounds,
    priceRange,
  ]);

  const localizedName = (
      g: CountryGroup
  ) =>
      language === 'ar'
          ? g.nameAr
          : language === 'fr'
              ? g.nameFr
              : g.nameEn;

  // ── Filtering ─────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const result = groups.filter((g) => {
      if (
          search &&
          !localizedName(g)
              .toLowerCase()
              .includes(search.toLowerCase())
      ) {
        return false;
      }

      if (
          priceRange &&
          (g.min_price < priceRange[0] ||
              g.min_price > priceRange[1])
      ) {
        return false;
      }

      if (selectedSpeeds.length > 0) {
        const d = g.processing_days;

        if (
            !selectedSpeeds.some((s) =>
                SPEED_BUCKETS[s].test(d)
            )
        ) {
          return false;
        }
      }

      if (
          selectedCountries.length > 0 &&
          !selectedCountries.includes(g.code)
      ) {
        return false;
      }

      return true;
    });

    return [...result].sort((a, b) => {
      switch (sortKey) {
        case 'price_asc':
          return a.min_price - b.min_price;

        case 'price_desc':
          return b.min_price - a.min_price;

        case 'processing_asc':
          return (
              a.processing_days -
              b.processing_days
          );

        case 'processing_desc':
          return (
              b.processing_days -
              a.processing_days
          );

        default:
          return localizedName(a).localeCompare(
              localizedName(b)
          );
      }
    });
  }, [
    groups,
    search,
    priceRange,
    selectedSpeeds,
    selectedCountries,
    sortKey,
    language,
  ]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [
    search,
    priceRange,
    selectedSpeeds,
    selectedCountries,
    sortKey,
  ]);

  const visible = filtered.slice(
      0,
      visibleCount
  );

  const hasMore =
      visibleCount < filtered.length;

  const activeFilterCount =
      selectedSpeeds.length +
      selectedCountries.length +
      (priceRange &&
      (priceRange[0] !== priceBounds[0] ||
          priceRange[1] !== priceBounds[1])
          ? 1
          : 0);

  const resetFilters = () => {
    setSelectedSpeeds([]);
    setSelectedCountries([]);
    setPriceRange(priceBounds);
    setSortKey('name_asc');
    setSearch('');
  };

  const toggleSpeed = (
      s: SpeedBucket
  ) => {
    setSelectedSpeeds((p) =>
        p.includes(s)
            ? p.filter((x) => x !== s)
            : [...p, s]
    );
  };

  const toggleCountry = (
      c: string
  ) => {
    setSelectedCountries((p) =>
        p.includes(c)
            ? p.filter((x) => x !== c)
            : [...p, c]
    );
  };

  const tx = {
    heroTitle:
        language === 'ar'
            ? 'جميع الوجهات'
            : language === 'fr'
                ? 'Toutes les destinations'
                : 'All destinations',

    sortBy:
        language === 'ar'
            ? 'الترتيب حسب'
            : language === 'fr'
                ? 'Trier par'
                : 'Sort by',

    name:
        language === 'ar'
            ? 'الاسم (أ-ي)'
            : language === 'fr'
                ? 'Nom (A-Z)'
                : 'Name (A-Z)',

    priceLow:
        language === 'ar'
            ? 'السعر : من الأدنى'
            : language === 'fr'
                ? 'Prix croissant'
                : 'Price: Low to High',

    priceHigh:
        language === 'ar'
            ? 'السعر : من الأعلى'
            : language === 'fr'
                ? 'Prix décroissant'
                : 'Price: High to Low',

    procFast:
        language === 'ar'
            ? 'الأسرع معالجة'
            : language === 'fr'
                ? 'Traitement le plus rapide'
                : 'Fastest processing',

    procSlow:
        language === 'ar'
            ? 'الأبطأ معالجة'
            : language === 'fr'
                ? 'Traitement le plus lent'
                : 'Slowest processing',

    filters:
        language === 'ar'
            ? 'الفلاتر'
            : language === 'fr'
                ? 'Filtres'
                : 'Filters',

    reset:
        language === 'ar'
            ? 'إعادة تعيين'
            : language === 'fr'
                ? 'Réinitialiser'
                : 'Reset',

    priceRange:
        language === 'ar'
            ? 'نطاق السعر'
            : language === 'fr'
                ? 'Fourchette de prix'
                : 'Price range',

    processing:
        language === 'ar'
            ? 'مدة المعالجة'
            : language === 'fr'
                ? 'Délai de traitement'
                : 'Processing time',

    countries:
        language === 'ar'
            ? 'الدول'
            : language === 'fr'
                ? 'Pays'
                : 'Countries',

    resultsFound:
        language === 'ar'
            ? 'وجهة'
            : language === 'fr'
                ? 'destinations'
                : 'destinations',

    noResults:
        language === 'ar'
            ? 'لا توجد نتائج'
            : language === 'fr'
                ? 'Aucun résultat trouvé'
                : 'No results found',

    explore:
        language === 'ar'
            ? 'استكشف العالم'
            : language === 'fr'
                ? 'Explorez le monde'
                : 'Explore the world',

    chooseNext:
        language === 'ar'
            ? 'اختر وجهتك القادمة'
            : language === 'fr'
                ? 'Choisissez votre prochaine destination'
                : 'Choose your next destination',

    loadMore:
        language === 'ar'
            ? 'تحميل المزيد من الوجهات'
            : language === 'fr'
                ? 'Charger plus de destinations'
                : 'Load more destinations',
  };

  return (
      <div className="min-h-screen bg-[#e6f0fa] text-[#002161]">

        <div className="relative overflow-hidden h-[420px] sm:h-[460px] md:h-[500px]">

          {/* Background image */}
          <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage:
                    "url('/destination-bg.png')",
              }}
          />

          {/* White gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-b from-transparent to-[#e6f0fa]" />

          {/* Hero text */}
          <div className="relative container pt-10 sm:pt-14 md:pt-16">
            <motion.div
                initial={{
                  opacity: 0,
                  y: 20,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.5,
                }}
                className="max-w-xl"
            >
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#002161]">
                {tx.heroTitle}
              </h1>

              <p className="text-muted-foreground mt-2">
                {language === 'ar'
                    ? 'اكتشف جميع الوجهات المتاحة وقدّم طلب التأشيرة في دقائق.'
                    : language === 'fr'
                        ? 'Découvrez toutes les destinations disponibles et lancez votre demande de visa en quelques minutes.'
                        : 'Browse all available destinations and start your visa application in minutes.'}
              </p>
            </motion.div>
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* SEARCH BAR */}
        {/* Position stays the same relative to the hero bottom */}
        {/* ───────────────────────────────────────────────────────────── */}

        <div className="container -mt-16 sm:-mt-20 relative z-10">
          <div className="bg-white rounded-2xl shadow-lg border border-border/50 p-3 flex flex-col lg:flex-row gap-3">

            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

              <Input
                  value={search}
                  onChange={(e) =>
                      setSearch(e.target.value)
                  }
                  placeholder={t('searchPlaceholder')}
                  className="ps-10 h-11 border-none shadow-none focus-visible:ring-1"
              />
            </div>

            <Select
                value={sortKey}
                onValueChange={(v) =>
                    setSortKey(v as SortKey)
                }
            >
              <SelectTrigger className="h-11 lg:w-[180px]">
                <ArrowDownUp className="w-4 h-4 me-2 text-muted-foreground" />

                <SelectValue
                    placeholder={tx.sortBy}
                />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="name_asc">
                  {tx.name}
                </SelectItem>

                <SelectItem value="price_asc">
                  {tx.priceLow}
                </SelectItem>

                <SelectItem value="price_desc">
                  {tx.priceHigh}
                </SelectItem>

                <SelectItem value="processing_asc">
                  {tx.procFast}
                </SelectItem>

                <SelectItem value="processing_desc">
                  {tx.procSlow}
                </SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className="h-11 lg:w-auto relative"
                >
                  <SlidersHorizontal className="w-4 h-4 me-2" />

                  {tx.filters}

                  {activeFilterCount > 0 && (
                      <Badge
                          variant="secondary"
                          className="ms-2 h-5 px-1.5 bg-primary text-primary-foreground hover:bg-primary"
                      >
                        {activeFilterCount}
                      </Badge>
                  )}
                </Button>
              </PopoverTrigger>

              <PopoverContent
                  className="w-[340px] p-0"
                  align="end"
              >
                <div className="p-4 border-b border-border flex items-center justify-between">

                  <p className="font-semibold text-sm">
                    {tx.filters}
                  </p>

                  {activeFilterCount > 0 && (
                      <Button
                          variant="ghost"
                          size="sm"
                          onClick={resetFilters}
                          className="h-7 text-xs"
                      >
                        <X className="w-3 h-3 me-1" />
                        {tx.reset}
                      </Button>
                  )}
                </div>

                <div className="p-4 space-y-5 max-h-[60vh] overflow-y-auto">

                  {priceRange && (
                      <div className="space-y-3">

                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Wallet className="w-4 h-4 text-primary" />
                          {tx.priceRange}
                        </div>

                        <Slider
                            value={priceRange}
                            min={priceBounds[0]}
                            max={priceBounds[1]}
                            step={500}
                            onValueChange={(v) =>
                                setPriceRange([
                                  v[0],
                                  v[1],
                                ])
                            }
                            className="mt-2"
                        />

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {priceRange[0].toLocaleString()} DA
                      </span>

                          <span>
                        {priceRange[1].toLocaleString()} DA
                      </span>
                        </div>
                      </div>
                  )}

                  <div className="space-y-2">

                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Clock className="w-4 h-4 text-primary" />
                      {tx.processing}
                    </div>

                    <div className="space-y-2 pt-1">
                      {(
                          Object.keys(
                              SPEED_BUCKETS
                          ) as SpeedBucket[]
                      ).map((key) => (
                          <label
                              key={key}
                              className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded-md p-1.5 -mx-1.5 transition-colors"
                          >
                            <Checkbox
                                checked={selectedSpeeds.includes(
                                    key
                                )}
                                onCheckedChange={() =>
                                    toggleSpeed(key)
                                }
                            />

                            <span className="text-sm">
                          {
                            SPEED_BUCKETS[key]
                                .label[language]
                          }
                        </span>
                          </label>
                      ))}
                    </div>
                  </div>

                  {groups.length > 0 && (
                      <div className="space-y-2">

                        <div className="flex items-center gap-2 text-sm font-medium">
                          🌍 {tx.countries}
                        </div>

                        <ScrollArea className="h-44 -mx-1 pe-2">
                          <div className="px-1 space-y-1">

                            {[...groups]
                                .sort((a, b) =>
                                    localizedName(
                                        a
                                    ).localeCompare(
                                        localizedName(b)
                                    )
                                )
                                .map((g) => (
                                    <label
                                        key={g.code}
                                        className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded-md p-1.5 transition-colors"
                                    >
                                      <Checkbox
                                          checked={selectedCountries.includes(
                                              g.code
                                          )}
                                          onCheckedChange={() =>
                                              toggleCountry(
                                                  g.code
                                              )
                                          }
                                      />

                                      <img
                                          src={
                                              g.flag_url ??
                                              `https://flagcdn.com/w40/${g.code.toLowerCase()}.png`
                                          }
                                          alt={g.nameFr}
                                          className="w-5 h-5 rounded-full object-cover"
                                      />

                                      <span className="text-sm">
                                {localizedName(
                                    g
                                )}
                              </span>
                                    </label>
                                ))}
                          </div>
                        </ScrollArea>
                      </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* MAIN CONTENT */}
        {/* ───────────────────────────────────────────────────────────── */}

        <div className="container py-8 md:py-10">

          <div className="flex items-center justify-between mb-1">

            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">
                {tx.explore}
              </h2>
            </div>

            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">

              <button
                  onClick={() =>
                      setViewMode('grid')
                  }
                  className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${
                      viewMode === 'grid'
                          ? 'bg-white shadow-sm'
                          : 'text-muted-foreground'
                  }`}
                  aria-label="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>

              <button
                  onClick={() =>
                      setViewMode('list')
                  }
                  className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${
                      viewMode === 'list'
                          ? 'bg-white shadow-sm'
                          : 'text-muted-foreground'
                  }`}
                  aria-label="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-5">
            {tx.chooseNext}
          </p>

          {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-6">

                {selectedSpeeds.map((s) => (
                    <Badge
                        key={s}
                        variant="secondary"
                        className="gap-1 cursor-pointer"
                        onClick={() =>
                            toggleSpeed(s)
                        }
                    >
                      <Clock className="w-3 h-3" />

                      {
                        SPEED_BUCKETS[s]
                            .label[language]
                      }

                      <X className="w-3 h-3" />
                    </Badge>
                ))}

                {selectedCountries.map((c) => {
                  const g = groups.find(
                      (gr) => gr.code === c
                  );

                  if (!g) return null;

                  return (
                      <Badge
                          key={c}
                          variant="secondary"
                          className="gap-1 cursor-pointer"
                          onClick={() =>
                              toggleCountry(c)
                          }
                      >
                        {localizedName(g)}

                        <X className="w-3 h-3" />
                      </Badge>
                  );
                })}

                {priceRange &&
                    (priceRange[0] !==
                        priceBounds[0] ||
                        priceRange[1] !==
                        priceBounds[1]) && (
                        <Badge
                            variant="secondary"
                            className="gap-1 cursor-pointer"
                            onClick={() =>
                                setPriceRange(
                                    priceBounds
                                )
                            }
                        >
                          <Wallet className="w-3 h-3" />

                          {priceRange[0].toLocaleString()} –
                          {' '}
                          {priceRange[1].toLocaleString()} DA

                          <X className="w-3 h-3" />
                        </Badge>
                    )}

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetFilters}
                    className="h-7 text-xs"
                >
                  {tx.reset}
                </Button>
              </div>
          )}

          <p className="text-sm text-muted-foreground mb-5">
          <span className="font-semibold text-foreground">
            {filtered.length}
          </span>
            {' '}
            {tx.resultsFound}
          </p>

          {loading ? (
              <div
                  className={
                    viewMode === 'grid'
                        ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                        : 'grid grid-cols-1 gap-4'
                  }
              >
                {Array.from({
                  length: 8,
                }).map((_, i) => (
                    <div
                        key={i}
                        className="h-72 rounded-2xl bg-muted animate-pulse"
                    />
                ))}
              </div>
          ) : error ? (
              <div className="text-center py-16">

                <p className="text-destructive font-medium mb-2">
                  Failed to load destinations
                </p>

                <p className="text-xs text-muted-foreground font-mono">
                  {error}
                </p>
              </div>
          ) : filtered.length > 0 ? (
              <>
                <div
                    className={
                      viewMode === 'grid'
                          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                          : 'grid grid-cols-1 gap-4'
                    }
                >
                  {visible.map((g, i) => (
                      <VisaDestinationCard
                          key={g.code}
                          group={g}
                          index={i}
                      />
                  ))}
                </div>

                {hasMore && (
                    <div className="flex justify-center mt-8">
                      <Button
                          variant="outline"
                          className="rounded-full px-6"
                          onClick={() =>
                              setVisibleCount(
                                  (v) =>
                                      v +
                                      LOAD_MORE_STEP
                              )
                          }
                      >
                        {tx.loadMore}
                      </Button>
                    </div>
                )}
              </>
          ) : (
              <div className="text-center py-16">

                <p className="text-muted-foreground mb-4">
                  {tx.noResults}
                </p>

                <Button
                    variant="outline"
                    onClick={resetFilters}
                >
                  {tx.reset}
                </Button>
              </div>
          )}
        </div>
      </div>
  );
};

export default Destinations;