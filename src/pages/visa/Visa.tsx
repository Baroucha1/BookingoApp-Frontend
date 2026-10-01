// import { useEffect, useRef, useState, useMemo } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import {
//   ArrowRight,
//   Globe,
//   FileText,
//   UserPlus,
//   Upload,
//   ClipboardCheck,
//   CreditCard,
//   CheckCircle2,
//   Hand,
//   ChevronLeft,
//   ChevronRight,
//   Search,
//   Shield,
//   Lock,
//   Clock,
//   Star,
//   HeadphonesIcon,
// } from 'lucide-react';
// import { motion } from 'framer-motion';
// import { useLanguage } from '@/i18n/LanguageContext';
// import { Button } from '@/components/ui/button';
//
//
// export interface CountryGroup {
//   id: string;
//   code: string;
//   nameFr: string; nameEn: string; nameAr: string;
//   descriptionFr: string | null; descriptionEn: string | null; descriptionAr: string | null;
//   images: {
//     url: string;
//     altTextFr: string | null;
//     imageType: 'FLAG' | 'HERO' | 'GALLERY' | 'THUMBNAIL';
//     isMain: boolean;
//   }[];
//   visaTypes: { price: number; currency: string }[];
// }
//
// const countryPhotos: Record<string, string> = {
//   tr: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=900&q=80',
//   eg: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?w=900&q=80',
//   jo: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=900&q=80',
//   az: 'https://images.unsplash.com/photo-1596386461350-326ccb383e9f?w=900&q=80',
//   vn: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=900&q=80',
//   id: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=900&q=80',
//   th: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=900&q=80',
//   ae: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=900&q=80',
//   ma: 'https://images.unsplash.com/photo-1553244297-c7c4f2bb5fb1?w=900&q=80',
//   sa: 'https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?w=900&q=80',
//   my: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=900&q=80',
//   sg: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=900&q=80',
//   in: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=900&q=80',
//   qa: 'https://images.unsplash.com/photo-1563299796-17596ed6b017?w=900&q=80',
//   ke: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=900&q=80',
//   tn: 'https://images.unsplash.com/photo-1605216663980-b7ca6e9f2451?w=900&q=80',
//   om: 'https://images.unsplash.com/photo-1578895101408-1a36b834405b?w=900&q=80',
//   am: 'https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?w=900&q=80',
// };
// const FALLBACK_PHOTO = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=900&q=80';
//
// const FEATURED_ORDER = ['tr', 'eg', 'th', 'jo', 'id', 'qa', 'az', 'am'];
//
// const visa = () => {
//   const { t, language } = useLanguage();
//   const navigate = useNavigate();
//
//   const [countryGroups, setCountryGroups] = useState<CountryGroup[]>([]);
//   useEffect(() => {
//     fetch(`${import.meta.env.VITE_API_URL}/api/countries`)
//         .then(r => r.json())
//         .then(data => { if (Array.isArray(data)) setCountryGroups(data); });
//   }, []);
//
//   const [heroSearch, setHeroSearch] = useState('');
//
//   const featuredCards = useMemo(() => {
//     const q = heroSearch.trim().toLowerCase();
//     if (q) {
//       return countryGroups.filter(g =>
//           g.nameFr.toLowerCase().includes(q) ||
//           g.nameEn.toLowerCase().includes(q) ||
//           (g.nameAr || '').toLowerCase().includes(q)
//       ).slice(0, 9);
//     }
//     const byCode = new Map(countryGroups.map(g => [g.code.toLowerCase(), g]));
//     const featuredSet = new Set(FEATURED_ORDER);
//     const featured = FEATURED_ORDER.map(c => byCode.get(c)).filter(Boolean) as CountryGroup[];
//     const rest = countryGroups.filter(g => !featuredSet.has(g.code.toLowerCase()));
//     return [...featured, ...rest].slice(0, 9);
//   }, [countryGroups, heroSearch]);
//
//   const trackRef = useRef<HTMLDivElement | null>(null);
//   const isDragging = useRef(false);
//   const [activeDot, setActiveDot] = useState(0);
//
//   const onTrackScroll = () => {
//     const el = trackRef.current;
//     if (!el) return;
//     const card = el.querySelector<HTMLElement>('[data-card]');
//     const w = card?.offsetWidth ?? 1;
//     setActiveDot(Math.round(el.scrollLeft / (w + 16)));
//   };
//
//   const scrollByCards = (dir: 1 | -1) => {
//     const el = trackRef.current;
//     if (!el) return;
//     const card = el.querySelector<HTMLElement>('[data-card]');
//     const w = (card?.offsetWidth ?? 200) + 16;
//     const start = el.scrollLeft;
//     const target = Math.max(0, Math.min(el.scrollWidth - el.clientWidth, start + dir * w));
//     const distance = target - start;
//     if (!distance) return;
//     const dur = 600;
//     const startTime = performance.now();
//     const step = (now: number) => {
//       const t = Math.min(1, (now - startTime) / dur);
//       el.scrollLeft = start + distance * (1 - Math.pow(1 - t, 3));
//       if (t < 1) requestAnimationFrame(step);
//     };
//     requestAnimationFrame(step);
//   };
//
//   useEffect(() => {
//     const el = trackRef.current;
//     if (!el) return;
//     let isDown = false, startX = 0, startScroll = 0;
//     const onDown = (e: PointerEvent) => {
//       if (e.pointerType === 'touch') return;
//       isDown = true; isDragging.current = false;
//       startX = e.clientX; startScroll = el.scrollLeft;
//       el.style.cursor = 'grabbing';
//     };
//     const onMove = (e: PointerEvent) => {
//       if (!isDown) return;
//       const dx = e.clientX - startX;
//       if (Math.abs(dx) > 8) isDragging.current = true;
//       if (isDragging.current) el.scrollLeft = startScroll - dx;
//     };
//     const onUp = () => {
//       isDown = false; el.style.cursor = '';
//       setTimeout(() => { isDragging.current = false; }, 50);
//     };
//     el.addEventListener('pointerdown', onDown);
//     el.addEventListener('pointermove', onMove);
//     el.addEventListener('pointerup', onUp);
//     el.addEventListener('pointercancel', onUp);
//     return () => {
//       el.removeEventListener('pointerdown', onDown);
//       el.removeEventListener('pointermove', onMove);
//       el.removeEventListener('pointerup', onUp);
//       el.removeEventListener('pointercancel', onUp);
//     };
//   }, [featuredCards.length]);
//
//   const localizedName = (g: CountryGroup) =>
//       language === 'ar' ? g.nameAr : language === 'fr' ? g.nameFr : g.nameEn;
//   const localizedDesc = (g: CountryGroup) =>
//       language === 'ar' ? g.descriptionAr : language === 'fr' ? g.descriptionFr : g.descriptionEn;
//   const goApply = (g: CountryGroup) => navigate(`/apply?country=${g.code}`);
//
//   const renderHeadline = () => {
//     if (language === 'fr') return (
//         <h1 className="mt-4 font-bold leading-[1.1] text-gray-900" style={{ fontSize: 'clamp(28px,5vw,52px)', letterSpacing: '-0.5px' }}>
//           Votre <span style={{ color: '#0865FE' }}>visa</span>. Simple, rapide, officiel.
//         </h1>
//     );
//     if (language === 'ar') return (
//         <h1 className="mt-4 font-bold leading-[1.1] text-gray-900" style={{ fontSize: 'clamp(28px,5vw,52px)', letterSpacing: '-0.5px' }}>
//           <span style={{ color: '#0865FE' }}>تأشيرتك</span>. بسيطة، سريعة، رسمية.
//         </h1>
//     );
//     return (
//         <h1 className="mt-4 font-bold leading-[1.1] text-gray-900" style={{ fontSize: 'clamp(28px,5vw,52px)', letterSpacing: '-0.5px' }}>
//           Your <span style={{ color: '#0865FE' }}>visa</span>. Simple, fast, official.
//         </h1>
//     );
//   };
//
//   const heroSub =
//       language === 'ar' ? 'اختر وجهتك وسافر بكل اطمئنان.'
//           : language === 'fr' ? "Choisissez votre destination et partez l'esprit tranquille."
//               : 'Choose your destination and travel with peace of mind.';
//
//   const stepDefs = [
//     { icon: Globe,          key: 'destination' },
//     { icon: FileText,       key: 'visaType' },
//     { icon: ClipboardCheck, key: 'info' },
//     { icon: UserPlus,       key: 'passengers' },
//     { icon: Upload,         key: 'documents' },
//     { icon: CreditCard,     key: 'payment' },
//     { icon: CheckCircle2,   key: 'confirmation' },
//   ];
//
//   const stepsLabels: Record<string, { fr: string; en: string; ar: string }> = {
//     destination:  { fr: 'Destination',  en: 'Destination',  ar: 'الوجهة' },
//     visaType:     { fr: 'Type de visa', en: 'visa type',    ar: 'نوع التأشيرة' },
//     info:         { fr: 'Informations', en: 'Information',  ar: 'المعلومات' },
//     passengers:   { fr: 'Passagers',    en: 'Passengers',   ar: 'المسافرون' },
//     documents:    { fr: 'Documents',    en: 'Documents',    ar: 'المستندات' },
//     payment:      { fr: 'Paiement',     en: 'Payment',      ar: 'الدفع' },
//     confirmation: { fr: 'Confirmation', en: 'Confirmation', ar: 'التأكيد' },
//   };
//
//   // ── Pourquoi nous choisir ─────────────────────────────────────────────────
//   const whyUs = [
//     {
//       icon: Clock,
//       iconBg: '#EFF6FF', iconColor: '#0865FE',
//       title: language === 'fr' ? 'Traitement rapide' : language === 'ar' ? 'معالجة سريعة' : 'Fast processing',
//       desc:  language === 'fr' ? 'Obtenez votre visa en moins de 48h grâce à notre processus optimisé.' : language === 'ar' ? 'احصل على تأشيرتك في أقل من 48 ساعة.' : 'Get your visa in less than 48h with our optimized process.',
//     },
//     {
//       icon: Shield,
//       iconBg: '#F0FDF4', iconColor: '#16a34a',
//       title: language === 'fr' ? 'Plateforme officielle' : language === 'ar' ? 'منصة رسمية' : 'Official platform',
//       desc:  language === 'fr' ? 'Vos données sont protégées et vos demandes traitées de manière officielle.' : language === 'ar' ? 'بياناتك محمية وطلباتك تُعالج بشكل رسمي.' : 'Your data is protected and your applications processed officially.',
//     },
//     {
//       icon: Star,
//       iconBg: '#FFFBEB', iconColor: '#d97706',
//       title: language === 'fr' ? 'Simple & intuitif' : language === 'ar' ? 'بسيط وسهل' : 'Simple & intuitive',
//       desc:  language === 'fr' ? 'Un formulaire clair en quelques étapes, sans paperasse inutile.' : language === 'ar' ? 'نموذج واضح في خطوات بسيطة، بدون أوراق غير ضرورية.' : 'A clear form in a few steps, without unnecessary paperwork.',
//     },
//     {
//       icon: HeadphonesIcon,
//       iconBg: '#FDF4FF', iconColor: '#9333ea',
//       title: language === 'fr' ? 'Support dédié' : language === 'ar' ? 'دعم متخصص' : 'Dedicated support',
//       desc:  language === 'fr' ? 'Notre équipe est disponible pour vous accompagner à chaque étape.' : language === 'ar' ? 'فريقنا متاح لمساعدتك في كل خطوة.' : 'Our team is available to guide you at every step.',
//     },
//   ];
//
//   return (
//       <div className="min-h-screen bg-white">
//
//
//
//         {/* ══════════════════ HERO ═════════════════════════════════════════════ */}
//         <section className="relative overflow-hidden" style={{ minHeight: '92vh' }}>
//           <div
//               className="absolute inset-0"
//               style={{
//                 backgroundImage: 'url(https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80)',
//                 backgroundSize: 'cover',
//                 backgroundPosition: 'center',
//               }}
//           />
//           <div
//               className="absolute inset-0"
//               style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.82) 50%, rgba(255,255,255,0.65) 100%)' }}
//           />
//
//
//
//           <div className="container relative z-10 flex flex-col items-center justify-center text-center py-16 md:py-24">
//
//             {renderHeadline()}
//             <p className="mt-3 text-gray-500 text-base md:text-lg max-w-md">{heroSub}</p>
//
//             {/* Search bar */}
//             <div className="mt-8 w-full max-w-[520px]">
//               <div
//                   className="flex items-center gap-2 rounded-full bg-white shadow-lg border border-gray-200 transition-shadow focus-within:shadow-xl"
//                   style={{ padding: '10px 10px 10px 22px' }}
//               >
//                 <Search className="w-4 h-4 text-gray-400 shrink-0" />
//                 <input
//                     value={heroSearch}
//                     onChange={e => setHeroSearch(e.target.value)}
//                     placeholder={
//                       language === 'ar' ? 'ابحث عن وجهة...'
//                           : language === 'fr' ? 'Rechercher une destination...'
//                               : 'Search a destination...'
//                     }
//                     className="flex-1 bg-transparent border-0 outline-none text-gray-800 placeholder:text-gray-400 text-sm py-1"
//                 />
//               </div>
//             </div>
//
//
//             {/* Destinations card */}
//             <div className="mt-8 w-full max-w-4xl">
//               <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-5 md:p-7">
//
//                 <div className="flex items-center justify-between mb-4 gap-3">
//                   <div className="flex items-center gap-2.5">
//                     <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#EFF6FF' }}>
//                       <svg className="w-4 h-4" fill="#0865FE" viewBox="0 0 20 20">
//                         <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//                       </svg>
//                     </div>
//                     <div>
//                       <h3 className="text-gray-900 text-base font-semibold">
//                         {language === 'ar' ? 'الوجهات الشائعة' : language === 'fr' ? 'Destinations populaires' : 'Popular destinations'}
//                       </h3>
//                       <div className="flex items-center gap-1.5 text-gray-400 text-xs mt-0.5">
//
//                         {countryGroups.length}{' '}
//                         {language === 'ar' ? 'وجهة متاحة' : language === 'fr' ? 'destinations disponibles' : 'destinations available'}
//                       </div>
//                     </div>
//                   </div>
//                   <Link
//                       to="/destinations"
//                       className="shrink-0 text-gray-600 hover:text-gray-900 text-xs font-medium inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-gray-200 hover:border-gray-400 transition-colors"
//                   >
//                     {language === 'ar' ? `كل ${countryGroups.length} وجهة` : language === 'fr' ? `Toutes les ${countryGroups.length} destinations` : `All ${countryGroups.length} destinations`}
//                     <ArrowRight className="w-3 h-3 rtl:rotate-180" />
//                   </Link>
//                 </div>
//
//                 {/* Swipable track */}
//                 <div className="relative group/track">
//                   <button type="button" aria-label="Précédent" onClick={() => scrollByCards(-1)}
//                           className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-9 h-9 rounded-full bg-white text-gray-800 shadow-lg border border-gray-100 items-center justify-center hover:bg-gray-50 hover:scale-110 transition-all opacity-0 group-hover/track:opacity-100">
//                     <ChevronLeft className="w-4 h-4" />
//                   </button>
//                   <button type="button" aria-label="Suivant" onClick={() => scrollByCards(1)}
//                           className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-9 h-9 rounded-full bg-white text-gray-800 shadow-lg border border-gray-100 items-center justify-center hover:bg-gray-50 hover:scale-110 transition-all opacity-0 group-hover/track:opacity-100">
//                     <ChevronRight className="w-4 h-4" />
//                   </button>
//
//                   <div
//                       ref={trackRef}
//                       onScroll={onTrackScroll}
//                       className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:cursor-grab select-none"
//                       style={{ overflowY: 'visible' }}
//                   >
//                     {featuredCards.length === 0 && Array.from({ length: 3 }).map((_, i) => (
//                         <div key={i} data-card className="shrink-0 w-[78%] sm:w-[calc((100%-2rem)/3)] h-[230px] rounded-2xl bg-gray-100 animate-pulse" />
//                     ))}
//
//                     {featuredCards.map((g) => {
//                       const heroImage = g.images?.find(img => img.imageType === 'HERO' || img.imageType === 'GALLERY');
//                       const photo = heroImage?.url || countryPhotos[g.code.toLowerCase()] || FALLBACK_PHOTO;
//                       const flagImage = g.images?.find(img => img.imageType === 'FLAG');
//                       const flagUrl = flagImage?.url || `https://flagcdn.com/w80/${g.code.toLowerCase()}.png`;
//                       return (
//                           <button
//                               key={g.code}
//                               data-card
//                               type="button"
//                               onClick={() => { if (!isDragging.current) goApply(g); }}
//                               className="group shrink-0 relative w-[78%] sm:w-[calc((100%-2rem)/3)] h-[230px] rounded-2xl overflow-hidden text-left shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.03]"
//                           >
//                             <img src={photo} alt={localizedName(g)} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
//                             <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
//                             <img src={flagUrl} alt="" className="absolute top-3 start-3 w-8 h-8 rounded-full border-2 border-white object-cover shadow" />
//                             <div className="absolute inset-x-0 bottom-0 p-3.5">
//                               <h4 className="text-white text-sm font-semibold leading-tight">{localizedName(g)}</h4>
//                             </div>
//                           </button>
//                       );
//                     })}
//                   </div>
//                 </div>
//
//                 {/* Progress dots */}
//                 {(() => {
//                   const maxDot = Math.max(0, featuredCards.length - 3);
//                   const dotCount = maxDot + 1;
//                   return (
//                       <div className="flex items-center justify-center gap-1.5 mt-4">
//                         {Array.from({ length: dotCount }).map((_, i) => (
//                             <span key={i} className="h-1.5 rounded-full transition-all duration-300"
//                                   style={{
//                                     width: i === activeDot ? 20 : 6,
//                                     background: i === activeDot ? '#0865FE' : i < activeDot ? 'rgba(8,101,254,0.4)' : 'rgba(8,101,254,0.15)',
//                                   }}
//                             />
//                         ))}
//                       </div>
//                   );
//                 })()}
//
//                 {/* CTA */}
//                 <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
//                   <Button
//                       size="lg"
//                       onClick={() => navigate('/apply')}
//                       className="rounded-full px-8 shadow-lg font-semibold text-white hover:opacity-90 transition-opacity"
//                       style={{ background: '#0865FE', borderRadius: '999px' }}
//                   >
//                     {language === 'ar' ? 'طلب تأشيرة' : language === 'fr' ? 'Demander un visa' : 'Apply for a visa'}
//                     <ArrowRight className="w-4 h-4 ms-1 rtl:rotate-180" />
//                   </Button>
//                   <span className="inline-flex items-center gap-1.5 text-gray-400 text-xs">
//                   <Hand className="w-3.5 h-3.5" />
//                     {language === 'ar' ? 'اسحب لاستكشاف المزيد' : language === 'fr' ? 'Glissez pour explorer' : 'Swipe to explore'}
//                 </span>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </section>
//
//         {/* ══════════════════ POURQUOI NOUS CHOISIR ═══════════════════════════ */}
//         <section className="container py-20 md:py-24">
//           <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               whileInView={{ opacity: 1, y: 0 }}
//               viewport={{ once: true }}
//               transition={{ duration: 0.5 }}
//               className="text-center mb-12"
//           >
//           <span className="inline-block text-xs font-semibold uppercase tracking-widest mb-3 px-3 py-1 rounded-full" style={{ background: '#EFF6FF', color: '#0865FE' }}>
//             {language === 'fr' ? 'Nos avantages' : language === 'ar' ? 'مميزاتنا' : 'Our advantages'}
//           </span>
//             <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
//               {language === 'fr' ? 'Pourquoi choisir BookinGO ?' : language === 'ar' ? 'لماذا تختار BookinGO ؟' : 'Why choose BookinGO?'}
//             </h2>
//             <p className="text-gray-400 mt-3 max-w-lg mx-auto text-sm">
//               {language === 'fr'
//                   ? 'Une solution complète pensée pour les voyageurs algériens.'
//                   : language === 'ar'
//                       ? 'حل متكامل مصمم للمسافرين الجزائريين.'
//                       : 'A complete solution designed for Algerian travelers.'}
//             </p>
//           </motion.div>
//
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
//             {whyUs.map((item, i) => (
//                 <motion.div
//                     key={i}
//                     initial={{ opacity: 0, y: 24 }}
//                     whileInView={{ opacity: 1, y: 0 }}
//                     viewport={{ once: true, margin: '-40px' }}
//                     transition={{ duration: 0.4, delay: i * 0.08 }}
//                     className="group bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
//                 >
//                   <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110" style={{ background: item.iconBg }}>
//                     <item.icon className="w-5 h-5" style={{ color: item.iconColor }} />
//                   </div>
//                   <h3 className="font-semibold text-gray-900 text-base mb-2">{item.title}</h3>
//                   <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
//                 </motion.div>
//             ))}
//           </div>
//         </section>
//
//         {/* ══════════════════ APPLICATION STEPS ═══════════════════════════════ */}
//         <section className="bg-gray-50 py-20 md:py-24">
//           <div className="container">
//             <motion.div
//                 initial={{ opacity: 0, y: 20 }}
//                 whileInView={{ opacity: 1, y: 0 }}
//                 viewport={{ once: true }}
//                 transition={{ duration: 0.5 }}
//                 className="text-center mb-14 max-w-2xl mx-auto"
//             >
//             <span className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-widest mb-3 px-3 py-1 rounded-full" style={{ background: '#EFF6FF', color: '#0865FE' }}>
//               <Lock className="w-3.5 h-3.5" />
//               {language === 'ar' ? 'العملية' : language === 'fr' ? 'LE PROCESSUS' : 'THE PROCESS'}
//             </span>
//               <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
//                 {language === 'ar' ? 'احصل على تأشيرتك في خطوات بسيطة' : language === 'fr' ? 'Obtenez votre visa en étapes simples' : 'Get your visa in simple steps'}
//               </h2>
//               <p className="text-gray-400 mt-3 text-sm">
//                 {language === 'ar' ? 'تجربة سلسة من الاختيار إلى تأكيد التأشيرة.'
//                     : language === 'fr' ? "Une expérience fluide, du choix de la destination à la confirmation du visa."
//                         : 'A smooth experience, from picking your destination to visa confirmation.'}
//               </p>
//             </motion.div>
//
//             <div className="relative">
//               <div className="hidden md:block absolute top-[23px] left-[calc(100%/14)] right-[calc(100%/14)] h-px bg-gray-200 z-0" />
//               <div className="grid grid-cols-2 md:grid-cols-7 gap-6 md:gap-2 relative z-10">
//                 {stepDefs.map((s, i) => (
//                     <motion.div
//                         key={s.key}
//                         initial={{ opacity: 0, y: 20 }}
//                         whileInView={{ opacity: 1, y: 0 }}
//                         viewport={{ once: true, margin: '-50px' }}
//                         transition={{ duration: 0.4, delay: i * 0.06 }}
//                         className="flex flex-col items-center text-center gap-2"
//                     >
//                       <div className="w-12 h-12 rounded-full border-2 border-gray-200 flex items-center justify-center bg-white shadow-sm hover:border-blue-300 hover:bg-blue-50 transition-colors">
//                         <s.icon className="w-5 h-5 text-gray-400" />
//                       </div>
//                       <span className="text-[10px] font-bold" style={{ color: '#0865FE' }}>{String(i + 1).padStart(2, '0')}</span>
//                       <span className="text-xs font-medium text-gray-600 leading-tight">{stepsLabels[s.key][language]}</span>
//                     </motion.div>
//                 ))}
//               </div>
//             </div>
//
//             <div className="text-center mt-12">
//               <Button
//                   size="lg"
//                   onClick={() => navigate('/apply')}
//                   className="rounded-full px-8 shadow-lg hover:opacity-90 transition-opacity text-white font-semibold"
//                   style={{ background: '#0865FE' }}
//               >
//                 {language === 'ar' ? 'ابدأ طلب التأشيرة' : language === 'fr' ? 'Démarrer ma demande' : 'Start my application'}
//                 <ArrowRight className="w-4 h-4 ms-1" />
//               </Button>
//             </div>
//           </div>
//         </section>
//
//         {/* ══════════════════ VISA-FREE CTA ════════════════════════════════════ */}
//         <section className="container py-20">
//           <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               whileInView={{ opacity: 1, y: 0 }}
//               viewport={{ once: true }}
//               transition={{ duration: 0.5 }}
//               className="relative rounded-3xl overflow-hidden shadow-xl"
//               style={{ background: '#0865FE' }}
//           >
//             <div className="absolute left-0 top-0 bottom-0 w-2/5 hidden md:block pointer-events-none overflow-hidden">
//               <img
//                   src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=700&q=80"
//                   alt=""
//                   className="w-full h-full object-cover"
//                   style={{ opacity: 0.2, mixBlendMode: 'luminosity' }}
//               />
//               <div className="absolute inset-0 flex items-center justify-center">
//                 <svg width="80" height="80" viewBox="0 0 24 24" fill="white" opacity="0.5">
//                   <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
//                 </svg>
//               </div>
//             </div>
//             <div className="relative z-10 p-10 md:p-14 text-center">
//               <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">{t('visaFreeCountries')}</h2>
//               <p className="text-white/80 mb-6 max-w-md mx-auto text-sm">{t('visaFreeDesc')}</p>
//               <Link to="/visa-free">
//                 <Button
//                     variant="secondary"
//                     size="lg"
//                     className="font-semibold rounded-full px-8 bg-white hover:bg-gray-50 transition-colors"
//                     style={{ color: '#0865FE' }}
//                 >
//                   {t('viewDetails')} <ArrowRight className="w-4 h-4 ms-1" />
//                 </Button>
//               </Link>
//             </div>
//           </motion.div>
//         </section>
//
//       </div>
//   );
// };
//
// export default visa;
import { useEffect, useRef, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Globe,
  FileText,
  UserPlus,
  Upload,
  ClipboardCheck,
  CreditCard,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Search,

} from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/i18n/LanguageContext.tsx';
import { Button } from '@/components/ui/button.tsx';

export interface CountryGroup {
  id: string;
  code: string;
  nameFr: string; nameEn: string; nameAr: string;
  descriptionFr: string | null; descriptionEn: string | null; descriptionAr: string | null;
  images: {
    url: string;
    altTextFr: string | null;
    imageType: 'FLAG' | 'HERO' | 'GALLERY' | 'THUMBNAIL';
    isMain: boolean;
  }[];
  visaTypes: { price: number; currency: string }[];
}

const getCountryPhoto = (images: CountryGroup['images']): string | null => {
  const usableImages = images.filter((image) => image.url.trim());
  const galleryImages = usableImages.filter((image) => image.imageType === 'GALLERY');
  const heroImages = usableImages.filter((image) => image.imageType === 'HERO');

  return (
      galleryImages.find((image) => image.isMain)?.url.trim() ??
      galleryImages[0]?.url.trim() ??
      heroImages.find((image) => image.isMain)?.url.trim() ??
      heroImages[0]?.url.trim() ??
      null
  );
};

const FEATURED_ORDER = ['tr', 'eg', 'th', 'jo', 'id', 'qa', 'az', 'am'];

const Visa = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [countryGroups, setCountryGroups] = useState<CountryGroup[]>([]);
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/countries`)
        .then(r => r.json())
        .then(data => { if (Array.isArray(data)) setCountryGroups(data); });
  }, []);

  const [heroSearch, setHeroSearch] = useState('');

  const featuredCards = useMemo(() => {
    const q = heroSearch.trim().toLowerCase();
    if (q) {
      return countryGroups.filter(g =>
          g.nameFr.toLowerCase().includes(q) ||
          g.nameEn.toLowerCase().includes(q) ||
          (g.nameAr || '').toLowerCase().includes(q)
      ).slice(0, 9);
    }
    const byCode = new Map(countryGroups.map(g => [g.code.toLowerCase(), g]));
    const featuredSet = new Set(FEATURED_ORDER);
    const featured = FEATURED_ORDER.map(c => byCode.get(c)).filter(Boolean) as CountryGroup[];
    const rest = countryGroups.filter(g => !featuredSet.has(g.code.toLowerCase()));
    return [...featured, ...rest].slice(0, 9);
  }, [countryGroups, heroSearch]);

  const trackRef = useRef<HTMLDivElement | null>(null);
  const isDragging = useRef(false);
  const [activeDot, setActiveDot] = useState(0);
  const destinationsRef = useRef<HTMLElement>(null);
  const scrollToDestinations = () => {
    destinationsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  const onTrackScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-card]');
    const w = card?.offsetWidth ?? 1;
    setActiveDot(Math.round(el.scrollLeft / (w + 16)));
  };

  const scrollByCards = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-card]');
    const w = (card?.offsetWidth ?? 200) + 16;
    const start = el.scrollLeft;
    const target = Math.max(0, Math.min(el.scrollWidth - el.clientWidth, start + dir * w));
    const distance = target - start;
    if (!distance) return;
    const dur = 600;
    const startTime = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - startTime) / dur);
      el.scrollLeft = start + distance * (1 - Math.pow(1 - t, 3));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    let isDown = false, startX = 0, startScroll = 0;
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      isDown = true; isDragging.current = false;
      startX = e.clientX; startScroll = el.scrollLeft;
      el.style.cursor = 'grabbing';
    };
    const onMove = (e: PointerEvent) => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 8) isDragging.current = true;
      if (isDragging.current) el.scrollLeft = startScroll - dx;
    };
    const onUp = () => {
      isDown = false; el.style.cursor = '';
      setTimeout(() => { isDragging.current = false; }, 50);
    };
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
    };
  }, [featuredCards.length]);

  const localizedName = (g: CountryGroup) =>
      language === 'ar' ? g.nameAr : language === 'fr' ? g.nameFr : g.nameEn;
  const goApply = (g: CountryGroup) => navigate(`/apply?country=${g.code}`);

  const stepDefs = [
    { icon: Globe,          label: 'visaStepDestination' },
    { icon: FileText,       label: 'visaStepType' },
    { icon: ClipboardCheck, label: 'visaStepInformation' },
    { icon: UserPlus,       label: 'visaStepPassengers' },
    { icon: Upload,         label: 'visaStepDocuments' },
    { icon: CreditCard,     label: 'visaStepPayment' },
    { icon: CheckCircle2,   label: 'visaStepConfirmation' },
  ];

  return (
      <div className="min-h-screen bg-[#e6f0fa] relative overflow-hidden flex flex-col w-full">


        <div className="absolute top-0 left-0 w-full z-0 pointer-events-none">
          <img
              src="/assets/visa/visa-bg3.webp"
              alt=""
              className="w-full h-auto object-cover min-h-[300px] md:min-h-[auto] block"
          />
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-b from-transparent to-[#e6f0fa]" />
        </div>

        <div className="relative z-10 w-full">

          {/* ══════════════════ HERO ═════════════════════════════════════════════ */}
          <section className="relative min-h-[550px] md:min-h-[650px] flex items-center w-full">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center pt-[calc(6rem+env(safe-area-inset-top,0px))] md:pt-24">

              <div className="w-full md:w-7/12 lg:w-1/2 text-left mt-10 md:mt-0">
                <h1 className="font-extrabold leading-[1.1] text-[#002161]" style={{ fontSize: 'clamp(36px,5vw,64px)', fontFamily: "'Kaushan Script', cursive" }}>
                  <span style={{ color: '#0865FE' }}>{t('visaHeroTitleStart')}</span><br />{t('visaHeroTitleEnd')}
                </h1>
                <p className="mt-4 text-[#002161]/80 text-base sm:text-lg md:text-xl max-w-md font-medium">
                  {t('visaHeroSubtitle')}
                </p>

                {/* Search bar */}
                <div className="mt-8 w-full max-w-[480px]">
                  <div className="flex items-center gap-2 sm:gap-3 rounded-full bg-white shadow-xl py-2 px-2 sm:px-3 border border-gray-100">
                    <div className="pl-2 sm:pl-3">
                      <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    </div>
                    <input
                        value={heroSearch}
                        onChange={e => setHeroSearch(e.target.value)}
                        placeholder={t('searchPlaceholder')}
                        aria-label={t('visaSearchAriaLabel')}
                        className="flex-1 bg-transparent border-0 outline-none text-gray-900 placeholder:text-gray-400 text-sm sm:text-base w-full"
                    />
                    <button aria-label={t('visaSearchAriaLabel')} className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-full flex items-center justify-center text-gray-400 hover:text-[#002161] hover:bg-blue-50 transition-colors">
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>

              </div>

            </div>
          </section>

          {/* ══════════════════ DESTINATIONS POPULAIRES ═══════════════════════════ */}
          <section className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 -mt-10" ref={destinationsRef}>

            {/* Header Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-[#002161]">
                  {t('popularDestinations')}
                </h2>
                <p className="text-[#0a192f]/70 mt-1 text-sm sm:text-base font-medium">
                  {countryGroups.length} {t('visaDestinationCountLabel')}
                </p>
              </div>
              <Link
                  to="/destinations"
                  className="shrink-0 w-full sm:w-auto justify-center bg-white/80 backdrop-blur text-[#002161] hover:text-blue-600 font-semibold text-sm inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white hover:border-blue-200 shadow-sm transition-all"
              >
                {t('allDestinations')}
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </Link>
            </div>

            {/* Cards Track */}
            <div className="relative group/track -mx-4 sm:mx-0 px-4 sm:px-0">
              <div
                  ref={trackRef}
                  onScroll={onTrackScroll}
                  className="flex gap-4 sm:gap-5 overflow-x-auto pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:cursor-grab select-none snap-x snap-mandatory"
              >
                {featuredCards.length === 0 && Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} data-card className="shrink-0 w-[240px] sm:w-[260px] h-[320px] rounded-2xl bg-white/50 backdrop-blur animate-pulse snap-start" />
                ))}

                {featuredCards.map((g) => {
                  const photo = getCountryPhoto(g.images ?? []);
                  const flagImage = g.images?.find(img => img.imageType === 'FLAG');
                  const flagUrl = (flagImage?.url || `https://flagcdn.com/w80/${g.code.toLowerCase()}.png`).trim();

                  const lowestPrice = g.visaTypes && g.visaTypes.length > 0
                      ? Math.min(...g.visaTypes.map(v => v.price))
                      : 0;

                  return (
                      <button
                          key={g.code}
                          data-card
                          type="button"
                          onClick={() => { if (!isDragging.current) goApply(g); }}
                          className="group shrink-0 w-[240px] sm:w-[260px] bg-white rounded-2xl border border-white/60 flex flex-col text-left shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 snap-start overflow-visible relative"
                      >
                        <div className="absolute top-3 left-3 z-10">
                          <img src={flagUrl} alt="" className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-md bg-white" />
                        </div>

                        <div className="w-full h-[150px] sm:h-[160px] overflow-hidden rounded-t-2xl relative bg-white">
                          {photo && (
                              <img
                                  src={photo}
                                  alt={localizedName(g)}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                  loading="lazy"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.parentElement?.querySelector('[data-photo-overlay]')?.remove();
                                  }}
                              />
                          )}
                          {photo && <div data-photo-overlay className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />}
                        </div>

                        <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between bg-white rounded-b-2xl">
                          <div>
                            <h4 className="text-[#002161] text-base sm:text-lg font-bold leading-tight">{localizedName(g)}</h4>
                            <p className="text-gray-500 text-xs font-medium mt-1">{t('visaElectronicCardLabel')}</p>
                          </div>

                          <div className="mt-4 sm:mt-5 flex items-end justify-between border-t border-gray-50 pt-4">
                            <div>
                              <p className="text-[10px] text-gray-400 font-semibold mb-0.5 uppercase tracking-wide">
                                {t('startingFrom')}
                              </p>
                              <p className="font-bold text-[#002161] text-base sm:text-lg leading-none">
                                {lowestPrice > 0 ? `${new Intl.NumberFormat(language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-DZ' : 'en-GB').format(lowestPrice)} DZD` : '—'}
                              </p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                              <ChevronRight className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                      </button>
                  );
                })}
              </div>

              {/* Slider Navigation */}
              <div className="flex items-center justify-center gap-4 mt-2 sm:mt-4">
                <button aria-label={t('visaPreviousDestinations')} onClick={() => scrollByCards(-1)} className="text-blue-600 hover:text-blue-800 transition-colors p-2">
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {(() => {
                  const maxDot = Math.max(0, featuredCards.length - 1);
                  const dotCount = maxDot + 1;
                  return (
                      <div className="flex items-center gap-1.5">
                        {Array.from({ length: dotCount > 5 ? 5 : dotCount }).map((_, i) => (
                            <span key={i} className="h-2 rounded-full transition-all duration-300"
                                  style={{
                                    width: i === activeDot % 5 ? 24 : 8,
                                    background: i === activeDot % 5 ? '#0865FE' : '#cbd5e1',
                                  }}
                            />
                        ))}
                      </div>
                  );
                })()}

                <button aria-label={t('visaNextDestinations')} onClick={() => scrollByCards(1)} className="text-blue-600 hover:text-blue-800 transition-colors p-2">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </section>

          {/* ══════════════════ APPLICATION STEPS ═══════════════════════════════ */}
          <section className="mt-4 sm:mt-8 rounded-t-[2rem] sm:rounded-t-[3rem] px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="bg-white rounded-2xl sm:rounded-2xl py-12 sm:py-16 px-4 md:px-8 lg:px-12 border border-blue-50/50">
              <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="text-center mb-10 sm:mb-16 max-w-2xl mx-auto"
              >
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-[#002161]">
                  {t('visaStepsTitle')}
                </h2>
                <p className="text-gray-500 mt-3 sm:mt-4 text-sm font-medium">
                    {t('visaStepsDescription')}
                </p>
              </motion.div>

              <div className="relative max-w-6xl mx-auto">
                {/* Horizontal line hidden on mobile and small tablets */}
                <div className="hidden lg:block absolute top-[28px] left-[calc(100%/14)] right-[calc(100%/14)] border-t-2 border-dashed border-blue-200 z-0" />

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-8 sm:gap-6 lg:gap-2 relative z-10">
                  {stepDefs.map((s, i) => (
                      <motion.div
                          key={s.key}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, margin: '-50px' }}
                          transition={{ duration: 0.4, delay: i * 0.06 }}
                          className="flex flex-col items-center text-center gap-3 bg-transparent"
                      >
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-blue-100 flex items-center justify-center bg-white shadow-sm text-[#002161]">
                          <s.icon className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] font-bold text-gray-400 mb-0.5">{String(i + 1).padStart(2, '0')}</span>
                          <span className="text-xs font-bold text-[#002161] leading-tight">{t(s.label)}</span>
                        </div>
                      </motion.div>
                  ))}
                </div>
              </div>

              <div className="text-center mt-12 sm:mt-16">
                <Button
                    size="lg"
                    onClick={scrollToDestinations}
                    className="w-full bg-[#002161] sm:w-auto rounded-2xl px-8 py-6 text-base shadow-xl shadow-blue-600/20 hover:opacity-90 transition-opacity text-white font-bold"
                >
                  {t('visaStartApplication')}
                  <ArrowRight className="w-5 h-5 ms-2" />
                </Button>
              </div>
            </div>
          </section>

          {/* ══════════════════ VISA-FREE CTA ════════════════════════════════════ */}
          <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20 mt-8 sm:mt-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="relative rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between"
                style={{ background: 'linear-gradient(90deg, #023BA6 0%, #0865FE 100%)' }}
            >
              <div className="w-full md:w-1/3 h-32 sm:h-48 md:h-64 relative overflow-hidden hidden sm:block">
                <img
                    src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=700&q=80"
                    alt="Airplane"
                    className="w-full h-full object-cover mix-blend-screen"
                />
              </div>

              <div className="relative z-10 p-8 sm:p-10 md:p-12 text-center flex-1 flex flex-col items-center w-full">
                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-white mb-3 sm:mb-4 leading-tight">
                  {t('visaFreeCountries')}
                </h2>
                <p className="text-blue-100 mb-6 sm:mb-8 max-w-sm mx-auto text-xs sm:text-sm font-medium">
                  {t('visaFreeDesc')}
                </p>
                <Link to="/visa-free" className="w-full sm:w-auto">
                  <Button
                      variant="secondary"
                      size="lg"
                      className="w-full sm:w-auto font-bold rounded-full px-8 bg-white hover:bg-gray-50 text-[#002161] transition-colors shadow-lg"
                  >
                    {t('visaFreeViewList')} <ArrowRight className="w-4 h-4 ms-2" />
                  </Button>
                </Link>
              </div>

            </motion.div>
          </section>

        </div>
      </div>
  );
};

export default Visa;