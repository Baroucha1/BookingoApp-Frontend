// import { useState, useMemo, useEffect, useRef } from 'react';
// import { useNavigate, useSearchParams } from 'react-router-dom';
// import { motion, AnimatePresence } from 'framer-motion';
// import { Button } from '@/components/ui/button';
// import { Label } from '@/components/ui/label';
// import { Badge } from '@/components/ui/badge';
// import { useToast } from '@/hooks/use-toast';
// import {
//   ArrowLeft, ArrowRight, Check, Plus, Trash2, Upload,
//   FileText, CheckCircle2, Clock, Calendar, Save,
//   ScanLine, Loader2, MapPin, X, Briefcase,
//   GraduationCap, Palmtree, Lock, Mail, Phone,
//   Info, ChevronRight, Edit2, Users,
// } from 'lucide-react';
// import { cn } from '@/lib/utils';
// import { useAuth } from '@/hooks/useAuth';
// import PassportScanner, { type MrzResult } from '@/components/PassportScanner';
// import { uploadFile } from '../service/upload.service';
// import { createFullApplication } from '../service/visaApplication.service';
// import type { VisaType, VisaTypeDocumentRequirement, PassengerInput } from '../lib/types';
// import { initiateSatimPayment } from '../service/payment.service.ts';
// import dhahabiaCIB from '../../public/dhahabiaCIB.png';
// import logoCIB1 from '../../public/logoCIB1.png';
//
// const formatAmount = (amount: number) => `${amount.toFixed(2)} DA`;
//
// const STEPS = [
//   { id: 1, label: 'Destination' },
//   { id: 2, label: 'Voyageurs & Docs' },
//   { id: 3, label: 'Paiement' },
// ];
//
// type Passenger = PassengerInput & { id: string };
//
// const newPassenger = (): Passenger => ({
//   id: `pax-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
//   firstName: '', lastName: '', birthDate: '', birthPlace: '',
//   nationality: 'Algérienne', passportNumber: '',
//   passportIssueDate: '', passportExpiryDate: '', email: '',
// });
//
// declare global { interface Window { grecaptcha: any; } }
//
// const COUNTRY_PHOTOS: Record<string, string> = {
//   tr: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=600&q=80',
//   eg: 'https://images.unsplash.com/photo-1539768942893-daf53e448371?w=600&q=80',
//   th: 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=600&q=80',
//   jo: 'https://images.unsplash.com/photo-1580834341580-8c17a3a630ca?w=600&q=80',
//   id: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80',
//   qa: 'https://images.unsplash.com/photo-1565552645632-d725f8bfc19a?w=600&q=80',
//   az: 'https://images.unsplash.com/photo-1596402184320-417e7178b2cd?w=600&q=80',
//   am: 'https://images.unsplash.com/photo-1610116306796-6fea9f4fae38?w=600&q=80',
//   ae: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80',
//   tn: 'https://images.unsplash.com/photo-1605216663980-b7ca6e9f2451?w=600&q=80',
//   ma: 'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=600&q=80',
//   sa: 'https://images.unsplash.com/photo-1578895101408-1a36b834405b?w=600&q=80',
//   cn: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=600&q=80',
// };
// const FALLBACK_COUNTRY_PHOTO = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=80';
//
// const Apply = () => {
//   const navigate       = useNavigate();
//   const { toast }      = useToast();
//   const [searchParams] = useSearchParams();
//   const { user }       = useAuth();
//
//   const preselectedCountry = (searchParams.get('country') || '').toLowerCase();
//
//   const [step, setStep]                       = useState(1);
//   const [countryCode, setCountryCode]         = useState(preselectedCountry);
//   const [visaTypeId, setVisaTypeId]           = useState('');
//   const [email, setEmail]                     = useState('');
//   const [phone, setPhone]                     = useState('');
//   const [startDate, setStartDate]             = useState('');
//   const [numberOfPeople, setNumberOfPeople]   = useState(1);
//   const [passengers, setPassengers]           = useState<Passenger[]>([newPassenger()]);
//   const [files, setFiles]                     = useState<Record<string, Record<string, File>>>({});
//   const [appId, setAppId]                     = useState('');
//   const [paid, setPaid]                       = useState(false);
//   const [submitting, setSubmitting]           = useState(false);
//   const [clientProfileId, setClientProfileId] = useState<string | null>(null);
//   const [paymentMethod, setPaymentMethod]     = useState<'satim' | 'agence'>('satim');
//   const [termsAccepted, setTermsAccepted]     = useState(false);
//   const [showConditions, setShowConditions]   = useState(false);
//   const [captchaVerified, setCaptchaVerified] = useState(false);
//   const recaptchaRef      = useRef<HTMLDivElement>(null);
//   const recaptchaWidgetId = useRef<number | null>(null);
//   const [countrySearch, setCountrySearch]     = useState('');
//   const [sheetOpen, setSheetOpen]             = useState(false);
//   const [infoConfirmed, setInfoConfirmed]     = useState(false);
//   const [expandedPax, setExpandedPax]         = useState<string | null>(null);
//   const [dragOver, setDragOver]               = useState<string | null>(null);
//   const [scannerOpenFor, setScannerOpenFor]   = useState<string | null>(null);
//   const [autofilled, setAutofilled]           = useState<Record<string, Set<string>>>({});
//
//   const fileCount = (paxId: string) => Object.keys(files[paxId] ?? {}).length;
//   const getFile   = (paxId: string, reqId: string): File | undefined => files[paxId]?.[reqId];
//
//   const todayLocal = (() => {
//     const d = new Date();
//     return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
//   })();
//
//   useEffect(() => {
//     if (document.getElementById('recaptcha-script')) return;
//     const script = document.createElement('script');
//     script.id = 'recaptcha-script';
//     script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
//     script.async = true; script.defer = true;
//     document.head.appendChild(script);
//   }, []);
//
//   useEffect(() => {
//     if (step !== 3 || paymentMethod !== 'satim') return;
//     const tryRender = () => {
//       if (!window.grecaptcha || !recaptchaRef.current) { setTimeout(tryRender, 300); return; }
//       if (recaptchaWidgetId.current !== null) return;
//       recaptchaWidgetId.current = window.grecaptcha.render(recaptchaRef.current, {
//         sitekey: import.meta.env.VITE_RECAPTCHA_SITE_KEY,
//         callback: () => setCaptchaVerified(true),
//         'expired-callback': () => setCaptchaVerified(false),
//       });
//     };
//     tryRender();
//   }, [step, paymentMethod]);
//
//   useEffect(() => {
//     setCaptchaVerified(false);
//     if (recaptchaWidgetId.current !== null && window.grecaptcha) {
//       window.grecaptcha.reset(recaptchaWidgetId.current);
//       recaptchaWidgetId.current = null;
//     }
//   }, [paymentMethod]);
//
//   useEffect(() => {
//     const raw = localStorage.getItem('apply_draft');
//     if (!raw) return;
//     try {
//       const d = JSON.parse(raw);
//       if (d.countryCode)    setCountryCode(d.countryCode);
//       if (d.visaTypeId)     setVisaTypeId(d.visaTypeId);
//       if (d.email)          setEmail(d.email);
//       if (d.phone)          setPhone(d.phone);
//       if (d.startDate)      setStartDate(d.startDate);
//       if (d.numberOfPeople) setNumberOfPeople(d.numberOfPeople);
//       if (d.passengers)     setPassengers(d.passengers);
//       if (d.step)           setStep(d.step);
//     } catch { /* ignore */ }
//   }, []);
//
//   useEffect(() => {
//     if (!user || user.role !== 'CLIENT') return;
//     const token = localStorage.getItem('token');
//     fetch(`${import.meta.env.VITE_API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
//         .then(r => r.json())
//         .then(data => {
//           if (data.email)       setEmail(data.email);
//           if (data.phone)       setPhone(data.phone);
//           if (data.profile?.id) setClientProfileId(data.profile.id);
//         });
//   }, [user]);
//
//   const [dbCountries, setDbCountries] = useState<{
//     code: string; name: string; flagUrl: string;
//     images: { url: string; imageType: string; isMain: boolean }[];
//   }[]>([]);
//
//   useEffect(() => {
//     (async () => {
//       const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/countries`);
//       const data = await res.json();
//       if (!Array.isArray(data)) return;
//       setDbCountries(data.map((c: any) => ({
//         code:    c.code.toLowerCase(),
//         name:    c.nameFr,
//         images:  c.images ?? [],
//         flagUrl: c.images?.find((img: any) => img.imageType === 'FLAG')?.url
//             || `https://flagcdn.com/w160/${c.code.toLowerCase()}.png`,
//       })));
//     })();
//   }, []);
//
//   const countries = useMemo(() =>
//       [...dbCountries].sort((a, b) => a.name.localeCompare(b.name, 'fr')), [dbCountries]);
//
//   const country = countries.find(c => c.code === countryCode);
//
//   const [visaTypes, setVisaTypes]               = useState<VisaType[]>([]);
//   const [visaTypesLoading, setVisaTypesLoading] = useState(false);
//
//   useEffect(() => {
//     if (!countryCode) return;
//     setVisaTypesLoading(true);
//     fetch(`${import.meta.env.VITE_API_URL}/api/visa-types?countryCode=${countryCode}`)
//         .then(r => r.json())
//         .then(d => setVisaTypes(d.status === 'success' ? d.data : []))
//         .catch(() => setVisaTypes([]))
//         .finally(() => setVisaTypesLoading(false));
//   }, [countryCode]);
//
//   useEffect(() => {
//     if (preselectedCountry && countries.length > 0 && !countries.find(c => c.code === preselectedCountry)) {
//       setCountryCode(''); setVisaTypeId(''); setStep(1);
//     }
//   }, [preselectedCountry, countries]);
//
//   const selectedVisa = visaTypes.find(v => v.id === visaTypeId) as VisaType | undefined;
//   const totalPrice   = selectedVisa ? Number(selectedVisa.price) * numberOfPeople : 0;
//
//   const applyMrz = (paxId: string, data: MrzResult) => {
//     const patch: Partial<Passenger> = {};
//     const filled = new Set<string>();
//     (Object.keys(data) as (keyof MrzResult)[]).forEach(k => {
//       const v = data[k]; if (v) { (patch as any)[k] = v; filled.add(k as string); }
//     });
//     updatePax(paxId, patch);
//     setAutofilled(prev => ({ ...prev, [paxId]: filled }));
//   };
//   const isAutofilled = (paxId: string, field: string) => autofilled[paxId]?.has(field);
//
//   const handleFileSelect = (paxId: string, reqId: string) => {
//     if (!user) {
//       toast({ title: 'Connexion requise', description: 'Connectez-vous pour finaliser votre demande.', variant: 'destructive' });
//       navigate(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
//       return;
//     }
//     const input    = document.createElement('input');
//     input.type     = 'file';
//     input.accept   = '.pdf,.jpg,.jpeg,.png';
//     input.onchange = (e) => {
//       const file = (e.target as HTMLInputElement).files?.[0];
//       if (!file) return;
//       setFiles(prev => ({ ...prev, [paxId]: { ...(prev[paxId] ?? {}), [reqId]: file } }));
//       toast({ title: 'Fichier sélectionné', description: file.name });
//     };
//     input.click();
//   };
//
//   const syncPassengers = (n: number) => {
//     setNumberOfPeople(n);
//     setPassengers(prev => {
//       if (n > prev.length) return [...prev, ...Array.from({ length: n - prev.length }, newPassenger)];
//       return prev.slice(0, n);
//     });
//   };
//   const updatePax = (id: string, patch: Partial<Passenger>) =>
//       setPassengers(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
//   const removePax = (id: string) => {
//     if (passengers.length <= 1) return;
//     const next = passengers.filter(p => p.id !== id);
//     setPassengers(next); setNumberOfPeople(next.length);
//   };
//   const addPax = () => { setPassengers(p => [...p, newPassenger()]); setNumberOfPeople(n => n + 1); };
//
//   const paxComplete = (p: Passenger) =>
//       !!(p.firstName && p.lastName && p.passportNumber && p.birthPlace
//           && p.birthDate && p.nationality && p.passportIssueDate && p.passportExpiryDate);
//
//   const paxDocsOk = (paxId: string) => {
//     if (!selectedVisa) return false;
//     const required = selectedVisa.documentRequirements?.filter((r: VisaTypeDocumentRequirement) => r.isRequired).length ?? 0;
//     return fileCount(paxId) >= required;
//   };
//
//   const canNext = (() => {
//     switch (step) {
//       case 1: return !!countryCode && !!visaTypeId;
//       case 2: return infoConfirmed && !!email && !!phone && !!startDate && numberOfPeople >= 1
//           && passengers.every(paxComplete)
//           && (selectedVisa ? passengers.every(p => paxDocsOk(p.id)) : false);
//       case 3: return paid;
//       default: return true;
//     }
//   })();
//
//   const submitApplication = async (): Promise<{ applicationId: string }> => {
//     const uploadedDocs: Record<string, Record<string, { fileUrl: string; originalName: string }>> = {};
//     for (const pax of passengers) {
//       uploadedDocs[pax.id] = {};
//       for (const [reqId, file] of Object.entries(files[pax.id] ?? {})) {
//         const fileUrl = await uploadFile(file);
//         uploadedDocs[pax.id][reqId] = { fileUrl, originalName: file.name };
//       }
//     }
//     const result = await createFullApplication({
//       visaTypeId, email, phone, startDate, numberOfPeople,
//       clientId: clientProfileId ?? null, agencyId: null,
//       passengers: passengers.map(pax => ({
//         firstName: pax.firstName, lastName: pax.lastName,
//         birthDate: pax.birthDate, birthPlace: pax.birthPlace,
//         nationality: pax.nationality, passportNumber: pax.passportNumber,
//         passportIssueDate: pax.passportIssueDate, passportExpiryDate: pax.passportExpiryDate,
//         email: pax.email,
//         documents: Object.entries(uploadedDocs[pax.id] ?? {}).map(([reqId, doc]) => ({
//           requirementId: reqId, fileUrl: doc.fileUrl, originalName: doc.originalName,
//         })),
//       })),
//     });
//     localStorage.removeItem('apply_draft');
//     setAppId(result.data.applicationId);
//     return result.data;
//   };
//
//   const handlePaySatim = async () => {
//     setSubmitting(true);
//     try {
//       const captchaToken = window.grecaptcha.getResponse(recaptchaWidgetId.current);
//       if (!captchaToken) {
//         toast({ title: 'reCAPTCHA requis', description: 'Veuillez valider le reCAPTCHA.', variant: 'destructive' });
//         setSubmitting(false); return;
//       }
//       const result = await submitApplication();
//       const { formUrl } = await initiateSatimPayment(result.applicationId, captchaToken);
//       window.location.href = formUrl;
//     } catch (err: any) {
//       toast({ title: 'Erreur paiement SATIM', description: err.message, variant: 'destructive' });
//       setSubmitting(false);
//     }
//   };
//
//   const handlePayAgence = async () => {
//     setSubmitting(true);
//     try {
//       await submitApplication();
//       toast({ title: 'Demande enregistrée', description: 'Rendez-vous en agence pour finaliser le paiement.' });
//       navigate('/client/applications');
//     } catch (err: any) {
//       toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
//     } finally { setSubmitting(false); }
//   };
//
//   const next = async () => {
//     if (!canNext) {
//       toast({ title: 'Champs manquants', description: 'Veuillez compléter cette étape.', variant: 'destructive' });
//       return;
//     }
//     setStep(s => Math.min(STEPS.length, s + 1));
//   };
//
//   const back = () => { if (step <= 1) { navigate('/'); return; } setStep(s => s - 1); };
//
//   const save = () => {
//     localStorage.setItem('apply_draft', JSON.stringify({
//       step: Math.min(step, 2), countryCode, visaTypeId, email, phone, startDate, numberOfPeople, passengers,
//     }));
//     toast({ title: 'Brouillon enregistré', description: 'Vous pouvez reprendre votre demande plus tard.' });
//   };
//
//   const progressPct = (step / STEPS.length) * 100;
//
//   const visaIcon = (name: string) => {
//     const n = name.toLowerCase();
//     if (n.includes('affaire') || n.includes('business') || n.includes('travail')) return Briefcase;
//     if (n.includes('étud') || n.includes('etud') || n.includes('student')) return GraduationCap;
//     return Palmtree;
//   };
//
//   // ── Formatage date lisible ──
//   const formatDate = (iso: string) => {
//     if (!iso) return '';
//     const [y, m, d] = iso.split('-');
//     const months = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
//     return `${parseInt(d)} ${months[parseInt(m)-1]} ${y}`;
//   };
//
//   if (paid) {
//     return (
//         <div className="relative min-h-screen flex items-center justify-center px-4 py-12" style={{ background: '#F4F6FA' }}>
//           <div className="text-center max-w-md w-full space-y-5 bg-white rounded-3xl p-10 shadow-xl">
//             <div className="relative w-24 h-24 mx-auto">
//               <span className="absolute inset-0 rounded-full animate-ping" style={{ background: 'rgba(8,101,254,0.15)' }} />
//               <div className="relative w-24 h-24 rounded-full flex items-center justify-center shadow-xl" style={{ background: '#0865FE' }}>
//                 <CheckCircle2 className="w-12 h-12 text-white" strokeWidth={2.5} />
//               </div>
//             </div>
//             <h1 className="text-2xl font-bold text-gray-900">Demande soumise avec succès !</h1>
//             <p className="text-gray-500 text-sm">Votre demande pour <strong>{country?.name}</strong> a été enregistrée.</p>
//             <div className="inline-block border-2 border-blue-100 rounded-full px-6 py-2">
//               <span className="font-mono font-bold text-base tracking-wider text-gray-800">{appId}</span>
//             </div>
//             <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-semibold px-4 py-1">EN ATTENTE</Badge>
//             <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
//               <Button onClick={() => navigate('/client/applications')} className="text-white font-semibold rounded-full px-6" style={{ background: '#0865FE' }}>
//                 Voir mes demandes
//               </Button>
//               <Button variant="outline" onClick={() => navigate('/client')} className="rounded-full px-6">Tableau de bord</Button>
//             </div>
//           </div>
//         </div>
//     );
//   }
//
//   return (
//       <div className="min-h-screen py-8 lg:py-10" style={{ background: '#F4F6FA' }}>
//         <div className="container space-y-4 max-w-3xl mx-auto px-4">
//
//           {/* ── Country banner ── */}
//           {country && step > 1 && (() => {
//             const heroImg = country.images?.find((img: any) => img.imageType === 'HERO' || img.imageType === 'GALLERY');
//             const photo   = heroImg?.url || COUNTRY_PHOTOS[country.code] || FALLBACK_COUNTRY_PHOTO;
//             return (
//                 <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
//                             className="relative h-[100px] w-full rounded-2xl overflow-hidden shadow-lg">
//                   <img src={photo} alt={country.name} className="absolute inset-0 w-full h-full object-cover" />
//                   <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.50) 55%, rgba(0,0,0,0.10) 100%)' }} />
//                   <div className="relative h-full flex items-center justify-between px-5">
//                     <div className="flex items-center gap-3">
//                       <div className="w-11 h-11 rounded-full border-2 border-white shadow-lg overflow-hidden bg-white shrink-0">
//                         <img src={country.flagUrl} alt="" className="w-full h-full object-cover" />
//                       </div>
//                       <div className="text-white">
//                         <p className="text-[10px] uppercase tracking-widest font-semibold opacity-60">Destination</p>
//                         <p className="font-bold text-lg leading-tight">{country.name}</p>
//                         {selectedVisa && (
//                             <div className="flex items-center gap-2 mt-0.5">
//                               <span className="text-[11px] font-bold px-2 py-0.5 rounded-md" style={{ background: '#FFB400', color: '#000' }}>{selectedVisa.nameFr}</span>
//                               <span className="flex items-center gap-1 text-[11px] text-white/70">
//                           <Calendar className="w-3 h-3" /> {selectedVisa.duration} jours
//                         </span>
//                             </div>
//                         )}
//                       </div>
//                     </div>
//                     <button onClick={() => { setStep(1); setVisaTypeId(''); setInfoConfirmed(false); }}
//                             className="flex items-center gap-1.5 text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-white/20 transition-colors"
//                             style={{ border: '1.5px solid rgba(255,255,255,0.5)' }}>
//                       <Edit2 className="w-3.5 h-3.5" /> Changer
//                     </button>
//                   </div>
//                 </motion.div>
//             );
//           })()}
//
//           {/* ── Stepper ── */}
//           <div className="bg-white rounded-2xl px-5 pt-4 pb-5 shadow-sm border border-gray-100">
//             <div className="flex items-center justify-between mb-3">
//               <div>
//                 <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">ÉTAPE {step} SUR {STEPS.length}</p>
//                 <h2 className="text-xl font-bold text-gray-900 mt-0.5">{STEPS[step - 1].label}</h2>
//               </div>
//               <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold" style={{ background: '#EFF6FF', color: '#0865FE' }}>
//                 <svg className="w-4 h-4" viewBox="0 0 36 36">
//                   <circle cx="18" cy="18" r="15.9" fill="none" stroke="#dbeafe" strokeWidth="3.5" />
//                   <circle cx="18" cy="18" r="15.9" fill="none" stroke="#0865FE" strokeWidth="3.5"
//                           strokeDasharray={`${progressPct} 100`} strokeLinecap="round" transform="rotate(-90 18 18)" />
//                 </svg>
//                 {Math.round(progressPct)}% complété
//               </div>
//             </div>
//
//             {/* Step indicators */}
//             <div className="flex items-center mt-4">
//               {STEPS.map((s, idx) => (
//                   <div key={s.id} className="flex items-center flex-1 last:flex-none">
//                     <div className="flex flex-col items-center">
//                       <div className={cn(
//                           'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all',
//                           s.id < step  && 'text-white shadow-sm',
//                           s.id === step && 'text-white shadow-md scale-110',
//                           s.id > step  && 'bg-white text-gray-300 border-2 border-gray-200',
//                       )} style={{ background: s.id <= step ? '#0865FE' : undefined }}>
//                         {s.id < step ? <Check className="w-4 h-4" strokeWidth={3} /> : s.id}
//                       </div>
//                       <span className={cn('text-[11px] mt-1.5 font-semibold',
//                           s.id === step ? 'text-blue-600' : s.id < step ? 'text-blue-400' : 'text-gray-300'
//                       )}>{s.label}</span>
//                     </div>
//                     {idx < STEPS.length - 1 && (
//                         <div className="flex-1 h-0.5 mx-3 mb-4 rounded-full transition-all"
//                              style={{ background: s.id < step ? '#0865FE' : '#E5E7EB' }} />
//                     )}
//                   </div>
//               ))}
//             </div>
//           </div>
//
//           {/* ── Step content ── */}
//           <AnimatePresence mode="wait">
//             <motion.div key={step}
//                         initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
//                         exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}>
//
//               {/* ══════ STEP 1 ══════ */}
//               {step === 1 && (() => {
//                 const heroImg = country?.images?.find((img: any) => img.imageType === 'HERO' || img.imageType === 'GALLERY');
//                 const photo   = heroImg?.url || (country ? COUNTRY_PHOTOS[country.code] : null) || FALLBACK_COUNTRY_PHOTO;
//
//                 const VisaList = () => (
//                     <div className="space-y-3">
//                       {visaTypesLoading && Array.from({ length: 2 }).map((_, i) => (
//                           <div key={i} className="h-24 rounded-xl bg-gray-100 animate-pulse" />
//                       ))}
//                       {!visaTypesLoading && visaTypes.length === 0 && (
//                           <div className="p-6 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-400 text-center">
//                             Aucun type de visa configuré pour ce pays.
//                           </div>
//                       )}
//                       {!visaTypesLoading && visaTypes.map((v, idx) => {
//                         const isSelected = visaTypeId === v.id;
//                         const isPopular  = idx === 0 && visaTypes.length > 1;
//                         const Icon       = visaIcon(v.nameFr);
//                         return (
//                             <button key={v.id} onClick={() => setVisaTypeId(v.id)}
//                                     className="relative w-full text-left rounded-xl p-4 transition-all hover:shadow-md"
//                                     style={{ border: isSelected ? '2px solid #0865FE' : '1.5px solid #E5E7EB', background: isSelected ? 'rgba(8,101,254,0.04)' : '#fff' }}>
//                               {isPopular && (
//                                   <span className="absolute -top-2.5 end-3 text-[10px] font-bold px-2.5 py-0.5 rounded-full text-white" style={{ background: '#0865FE' }}>Recommandé</span>
//                               )}
//                               <div className="flex items-start justify-between gap-3">
//                                 <div className="flex-1">
//                                   <div className="flex items-center gap-2 mb-1">
//                                     <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#EFF6FF' }}>
//                                       <Icon className="w-4 h-4" style={{ color: '#0865FE' }} />
//                                     </div>
//                                     <span className="font-bold text-gray-900">{v.nameFr}</span>
//                                   </div>
//                                   {v.descriptionFr && <p className="text-[13px] text-gray-400 line-clamp-1 mb-2">{v.descriptionFr}</p>}
//                                   <div className="flex gap-2">
//                               <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#DCFCE7', color: '#166534' }}>
//                                 <Clock className="w-3 h-3" /> {v.processingDelay}j ouvrés
//                               </span>
//                                     <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#EFF6FF', color: '#0865FE' }}>
//                                 <Calendar className="w-3 h-3" /> {v.duration} jours
//                               </span>
//                                   </div>
//                                 </div>
//                                 <div className="text-right shrink-0">
//                                   <div className="text-xl font-bold" style={{ color: '#FFB400' }}>{formatAmount(Number(v.price))}</div>
//                                   <div className="text-xs text-gray-400">/ pers.</div>
//                                 </div>
//                               </div>
//                               {isSelected && (
//                                   <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#0865FE' }}>
//                                     <Check className="w-3 h-3 text-white" strokeWidth={3} />
//                                   </div>
//                               )}
//                             </button>
//                         );
//                       })}
//                     </div>
//                 );
//
//                 const ContinueBtn = () => (
//                     <div style={{ maxHeight: visaTypeId ? '80px' : '0', opacity: visaTypeId ? 1 : 0, overflow: 'hidden', transition: 'all 0.3s' }}>
//                       <Button onClick={() => { setSheetOpen(false); next(); }}
//                               className="w-full mt-3 rounded-full font-semibold text-white h-11" style={{ background: '#0865FE' }}>
//                         Continuer <ArrowRight className="w-4 h-4 ml-2" />
//                       </Button>
//                     </div>
//                 );
//
//                 const CountryBanner = () => (
//                     <div className="relative h-[90px] rounded-xl overflow-hidden">
//                       {photo && <img src={photo} alt={country?.name} className="absolute inset-0 w-full h-full object-cover" />}
//                       <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
//                       <div className="absolute inset-x-0 bottom-0 p-3 flex items-center gap-2">
//                         <div className="w-7 h-7 rounded-full border-2 border-white shadow overflow-hidden bg-white">
//                           {country && <img src={country.flagUrl} alt="" className="w-full h-full object-cover" />}
//                         </div>
//                         <span className="text-white font-bold text-sm drop-shadow">{country?.name}</span>
//                       </div>
//                     </div>
//                 );
//
//                 return (
//                     <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
//                       <h3 className="text-xl font-bold text-gray-900 mb-1">Où souhaitez-vous voyager ? ✈️</h3>
//                       <p className="text-sm text-gray-400 mb-4">{countries.length} destinations disponibles</p>
//                       <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
//                         <div className="lg:col-span-2 space-y-3">
//                           <div className="relative">
//                             <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
//                             <input value={countrySearch} onChange={e => setCountrySearch(e.target.value)}
//                                    placeholder="Rechercher un pays..."
//                                    className="w-full pl-9 pr-8 h-10 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
//                             {countrySearch && (
//                                 <button onClick={() => setCountrySearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center hover:bg-gray-100">
//                                   <X className="w-3.5 h-3.5 text-gray-400" />
//                                 </button>
//                             )}
//                           </div>
//                           <div className="grid grid-cols-2 gap-2 lg:max-h-[440px] lg:overflow-y-auto">
//                             {countries.filter(c => c.name.toLowerCase().includes(countrySearch.trim().toLowerCase())).map(c => {
//                               const isSelected = countryCode === c.code;
//                               const heroImg    = c.images?.find((img: any) => img.imageType === 'HERO' || img.imageType === 'GALLERY');
//                               const cphoto     = heroImg?.url || COUNTRY_PHOTOS[c.code] || FALLBACK_COUNTRY_PHOTO;
//                               return (
//                                   <button key={c.code}
//                                           onClick={() => { setCountryCode(c.code); setVisaTypeId(''); setSheetOpen(true); }}
//                                           className="group relative h-[120px] rounded-xl overflow-hidden text-left transition-all hover:scale-[1.02]"
//                                           style={{
//                                             border: isSelected ? '2.5px solid #0865FE' : '2px solid transparent',
//                                             boxShadow: isSelected ? '0 0 0 3px rgba(8,101,254,0.15)' : '0 2px 6px rgba(0,0,0,0.08)',
//                                           }}>
//                                     <img src={cphoto} alt={c.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
//                                     <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
//                                     <div className="absolute top-2 start-2 w-6 h-6 rounded-full border border-white shadow overflow-hidden bg-white">
//                                       <img src={c.flagUrl} alt="" className="w-full h-full object-cover" />
//                                     </div>
//                                     {isSelected && (
//                                         <div className="absolute top-2 end-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#0865FE' }}>
//                                           <Check className="w-3 h-3 text-white" strokeWidth={3} />
//                                         </div>
//                                     )}
//                                     <div className="absolute inset-x-0 bottom-0 p-2">
//                                       <span className="text-white text-[12px] font-semibold drop-shadow">{c.name}</span>
//                                     </div>
//                                   </button>
//                               );
//                             })}
//                             {countries.length === 0 && Array.from({ length: 6 }).map((_, i) => (
//                                 <div key={i} className="h-[120px] rounded-xl bg-gray-100 animate-pulse" />
//                             ))}
//                           </div>
//                         </div>
//                         <div className="hidden lg:block lg:col-span-3">
//                           <div className="sticky top-4">
//                             {!country ? (
//                                 <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-10 text-center min-h-[400px] flex flex-col items-center justify-center gap-3">
//                                   <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: '#EFF6FF' }}>
//                                     <MapPin className="w-7 h-7" style={{ color: '#0865FE' }} />
//                                   </div>
//                                   <p className="text-sm text-gray-400">Sélectionnez une destination</p>
//                                 </div>
//                             ) : (
//                                 <div key={country.code} className="space-y-3">
//                                   <CountryBanner /><VisaList /><ContinueBtn />
//                                 </div>
//                             )}
//                           </div>
//                         </div>
//                       </div>
//                       <div className="lg:hidden">
//                         {sheetOpen && country && (
//                             <>
//                               <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={() => setSheetOpen(false)} />
//                               <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[75vh] overflow-y-auto">
//                                 <div className="sticky top-0 bg-white px-4 pt-3 pb-2 flex items-center justify-between border-b border-gray-100">
//                                   <div className="flex items-center gap-2">
//                                     <img src={country.flagUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
//                                     <span className="font-semibold text-sm">{country.name}</span>
//                                   </div>
//                                   <button onClick={() => setSheetOpen(false)} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-100">
//                                     <X className="w-4 h-4 text-gray-400" />
//                                   </button>
//                                 </div>
//                                 <div className="p-4 space-y-3"><CountryBanner /><VisaList /><ContinueBtn /></div>
//                               </div>
//                             </>
//                         )}
//                       </div>
//                     </div>
//                 );
//               })()}
//
//               {/* ══════ STEP 2 ══════ */}
//               {step === 2 && (
//                   <div className="space-y-4">
//
//                     {/* Section A — Infos demande */}
//                     <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
//                       <div className="flex">
//                         <div className="w-1 shrink-0" style={{ background: '#0865FE' }} />
//                         <div className="flex-1 p-5">
//                           <div className="flex items-start justify-between gap-3 mb-4">
//                             <div className="flex items-center gap-3">
//                               {/* Icon instead of letter when confirmed */}
//                               <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
//                                    style={{ background: infoConfirmed ? '#EFF6FF' : '#EFF6FF' }}>
//                                 <FileText className="w-4 h-4" style={{ color: '#0865FE' }} />
//                               </div>
//                               <div>
//                                 <h3 className="font-bold text-gray-900">Informations de la demande</h3>
//                                 <p className="text-xs text-gray-400 mt-0.5">Veuillez renseigner les informations principales de votre demande.</p>
//                               </div>
//                             </div>
//                             {infoConfirmed && (
//                                 <button onClick={() => setInfoConfirmed(false)}
//                                         className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors shrink-0">
//                                   <Edit2 className="w-3 h-3" style={{ color: '#0865FE' }} />
//                                   <span style={{ color: '#0865FE' }}>Modifier</span>
//                                 </button>
//                             )}
//                           </div>
//
//                           {!infoConfirmed ? (
//                               <div className="space-y-4">
//                                 <div className="grid sm:grid-cols-2 gap-4">
//                                   <div className="space-y-1.5">
//                                     <Label className="text-sm font-semibold text-gray-700">Email *</Label>
//                                     <div className="relative">
//                                       <input type="email" value={email} onChange={e => setEmail(e.target.value)}
//                                              placeholder="exemple@email.com"
//                                              className="w-full h-11 rounded-xl border border-gray-200 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
//                                       <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
//                                     </div>
//                                   </div>
//                                   <div className="space-y-1.5">
//                                     <Label className="text-sm font-semibold text-gray-700">Téléphone *</Label>
//                                     <div className="flex gap-2">
//                                       <div className="flex items-center gap-1.5 px-3 h-11 rounded-xl border border-gray-200 bg-gray-50 shrink-0">
//                                         <img src="https://flagcdn.com/w40/dz.png" alt="DZ" className="w-5 h-3.5 rounded-sm object-cover" />
//                                         <span className="text-sm font-semibold text-gray-600">+213</span>
//                                         <ChevronRight className="w-3 h-3 text-gray-400 rotate-90" />
//                                       </div>
//                                       <div className="relative flex-1">
//                                         <input value={phone} onChange={e => setPhone(e.target.value)}
//                                                placeholder="5 XX XX XX XX"
//                                                className="w-full h-11 rounded-xl border border-gray-200 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
//                                         <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
//                                       </div>
//                                     </div>
//                                   </div>
//                                   <div className="space-y-1.5">
//                                     <Label className="text-sm font-semibold text-gray-700">Date de départ *</Label>
//                                     <div className="relative">
//                                       <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-sm">+</span>
//                                       <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} min={todayLocal}
//                                              className="w-full h-11 rounded-xl border border-gray-200 pl-8 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-gray-700" />
//                                       <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
//                                     </div>
//                                   </div>
//                                   <div className="space-y-1.5">
//                                     <Label className="text-sm font-semibold text-gray-700">Nombre de voyageurs *</Label>
//                                     <div className="flex items-center gap-3 h-11">
//                                       <button onClick={() => syncPassengers(Math.max(1, numberOfPeople - 1))} disabled={numberOfPeople <= 1}
//                                               className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-lg transition-all disabled:opacity-40"
//                                               style={{ background: '#0865FE' }}>−</button>
//                                       <span className="w-8 text-center text-xl font-bold tabular-nums" style={{ color: '#0865FE' }}>{numberOfPeople}</span>
//                                       <button onClick={() => syncPassengers(Math.min(8, numberOfPeople + 1))} disabled={numberOfPeople >= 8}
//                                               className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-lg transition-all disabled:opacity-40"
//                                               style={{ background: '#0865FE' }}>+</button>
//                                     </div>
//                                   </div>
//                                 </div>
//
//                                 <div className="flex items-start gap-2.5 p-3.5 rounded-xl" style={{ background: '#EFF6FF' }}>
//                                   <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#0865FE' }} />
//                                   <div>
//                                     <p className="text-xs font-bold" style={{ color: '#0865FE' }}>Bon à savoir</p>
//                                     <p className="text-xs mt-0.5" style={{ color: '#1d4ed8' }}>Vérifiez que toutes les informations saisies sont correctes avant de continuer.</p>
//                                   </div>
//                                 </div>
//
//                                 <div className="flex justify-end">
//                                   <Button onClick={() => {
//                                     if (!email || !phone || !startDate) {
//                                       toast({ title: 'Champs manquants', description: 'Veuillez compléter tous les champs.', variant: 'destructive' });
//                                       return;
//                                     }
//                                     setInfoConfirmed(true);
//                                     setExpandedPax(passengers[0]?.id || null);
//                                   }} className="text-white font-semibold rounded-full px-6 h-10" style={{ background: '#0865FE' }}>
//                                     Confirmer <Check className="w-4 h-4 ml-1.5" />
//                                   </Button>
//                                 </div>
//                               </div>
//                           ) : (
//                               /* Confirmed — compact summary row with icons */
//                               <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
//                           <span className="flex items-center gap-1.5">
//                             <Mail className="w-4 h-4 text-gray-400" />
//                             <span className="font-medium text-gray-800">{email}</span>
//                           </span>
//                                 <span className="flex items-center gap-1.5">
//                             <Phone className="w-4 h-4 text-gray-400" />
//                             <span>+213 {phone}</span>
//                           </span>
//                                 <span className="flex items-center gap-1.5">
//                             <Calendar className="w-4 h-4 text-gray-400" />
//                             <span>Départ <strong>{formatDate(startDate)}</strong></span>
//                           </span>
//                                 <span className="flex items-center gap-1.5">
//                             <Users className="w-4 h-4 text-gray-400" />
//                             <span>{numberOfPeople} voyageur(s)</span>
//                           </span>
//                               </div>
//                           )}
//                         </div>
//                       </div>
//                     </div>
//
//                     {/* Section B — Voyageurs */}
//                     <div className={cn(
//                         "bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all",
//                         !infoConfirmed && "opacity-40 pointer-events-none"
//                     )}>
//                       <div className="flex">
//                         <div className="w-1 shrink-0" style={{ background: '#0865FE' }} />
//                         <div className="flex-1 p-5">
//                           <div className="flex items-center justify-between mb-4">
//                             <div className="flex items-center gap-3">
//                               <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
//                                    style={{ background: !infoConfirmed ? '#CBD5E1' : passengers.every(paxComplete) && passengers.every(p => paxDocsOk(p.id)) && infoConfirmed ? '#10B981' : '#0865FE' }}>
//                                 {passengers.every(paxComplete) && passengers.every(p => paxDocsOk(p.id)) && infoConfirmed
//                                     ? <Check className="w-4 h-4" strokeWidth={3} /> : 'B'}
//                               </div>
//                               <h3 className="text-lg font-bold text-gray-900">Voyageurs ({passengers.length})</h3>
//                             </div>
//                             <Button variant="outline" size="sm" onClick={addPax}
//                                     className="rounded-full text-xs font-semibold h-8 px-3"
//                                     style={{ borderColor: '#0865FE', color: '#0865FE' }}>
//                               <Plus className="w-3.5 h-3.5 mr-1" /> Ajouter un voyageur
//                             </Button>
//                           </div>
//
//                           <div className="space-y-3">
//                             {passengers.map((p, i) => {
//                               const initials  = `${(p.firstName || `V${i+1}`).charAt(0)}${(p.lastName || '').charAt(0)}`.toUpperCase();
//                               const complete  = paxComplete(p);
//                               const docsDone  = paxDocsOk(p.id);
//                               const expanded  = expandedPax === p.id;
//                               const reqCount  = selectedVisa?.documentRequirements?.filter((r: VisaTypeDocumentRequirement) => r.isRequired).length ?? 0;
//
//                               return (
//                                   <div key={p.id} className="rounded-xl border overflow-hidden"
//                                        style={{ borderColor: complete && docsDone ? 'rgba(16,185,129,0.25)' : '#E5E7EB' }}>
//
//                                     {/* Passenger header */}
//                                     <div className="flex items-center justify-between gap-3 p-3.5">
//                                       <div className="flex items-center gap-3 min-w-0">
//                                         <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
//                                              style={{ background: complete && docsDone ? '#10B981' : '#0865FE' }}>
//                                           {complete && docsDone ? <Check className="w-4 h-4" strokeWidth={3} /> : initials}
//                                         </div>
//                                         <div className="min-w-0">
//                                           <p className="font-semibold text-sm text-gray-900">
//                                             {p.firstName ? `${p.firstName} ${p.lastName}` : `Voyageur ${i + 1}`}
//                                           </p>
//                                           <p className="text-[11px] text-gray-400">
//                                             {complete && docsDone ? 'Complet ✓' : complete ? 'Documents manquants' : 'À compléter'}
//                                           </p>
//                                         </div>
//                                       </div>
//                                       <div className="flex items-center gap-2 shrink-0">
//                                         <Button type="button" size="sm" onClick={() => setScannerOpenFor(p.id)}
//                                                 className="rounded-full text-xs h-8 px-3 font-semibold"
//                                                 style={{ background: '#EFF6FF', color: '#0865FE', border: '1px solid #BFDBFE' }}>
//                                           <ScanLine className="w-3.5 h-3.5 mr-1.5" /> Scanner le passeport
//                                         </Button>
//                                         <button onClick={() => setExpandedPax(expanded ? null : p.id)}
//                                                 className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
//                                           <ChevronRight className={cn('w-4 h-4 text-gray-400 transition-transform', expanded && 'rotate-90')} />
//                                         </button>
//                                       </div>
//                                     </div>
//
//                                     {/* Expanded form */}
//                                     {expanded && (
//                                         <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-4">
//                                           {passengers.length > 1 && (
//                                               <div className="flex justify-end">
//                                                 <Button variant="ghost" size="sm" onClick={() => removePax(p.id)}
//                                                         className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full h-7 px-3 text-xs">
//                                                   <Trash2 className="w-3.5 h-3.5 mr-1" /> Supprimer
//                                                 </Button>
//                                               </div>
//                                           )}
//
//                                           {autofilled[p.id]?.size ? (
//                                               <div className="flex items-start gap-2 p-3 rounded-xl text-xs" style={{ background: '#ECFDF5', color: '#065F46' }}>
//                                                 <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
//                                                 Champs remplis depuis le passeport. Vérifiez les données.
//                                               </div>
//                                           ) : null}
//
//                                           <div className="grid sm:grid-cols-2 gap-3">
//                                             {([
//                                               { label: 'Prénom *',           field: 'firstName',          type: 'text', placeholder: 'Votre prénom' },
//                                               { label: 'Nom *',              field: 'lastName',           type: 'text', placeholder: 'Votre nom' },
//                                               { label: 'Date de naissance *',field: 'birthDate',          type: 'date', placeholder: 'jj/mm/aaaa' },
//                                               { label: 'Lieu de naissance *', field: 'birthPlace',        type: 'text', placeholder: 'Ville, Pays' },
//                                               { label: 'Nationalité *',      field: 'nationality',        type: 'text', placeholder: 'Algérienne' },
//                                               { label: 'N° de passeport *',  field: 'passportNumber',     type: 'text', placeholder: 'AA123456' },
//                                               { label: "Date d'émission *",  field: 'passportIssueDate',  type: 'date', placeholder: 'jj/mm/aaaa' },
//                                               { label: "Date d'expiration *",field: 'passportExpiryDate', type: 'date', placeholder: 'jj/mm/aaaa' },
//                                             ] as const).map(({ label, field, type, placeholder }: any) => (
//                                                 <div key={field} className="space-y-1.5">
//                                                   <Label className="text-xs font-semibold text-gray-600">{label}</Label>
//                                                   <input type={type} value={(p as any)[field] ?? ''} placeholder={placeholder}
//                                                          onChange={e => updatePax(p.id, { [field]: e.target.value })}
//                                                          className={cn(
//                                                              'w-full h-10 rounded-xl border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400',
//                                                              isAutofilled(p.id, field) ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200'
//                                                          )} />
//                                                 </div>
//                                             ))}
//                                             <div className="sm:col-span-2 space-y-1.5">
//                                               <Label className="text-xs font-semibold text-gray-600">Email *</Label>
//                                               <input type="email" value={p.email ?? ''} placeholder="email@exemple.com"
//                                                      onChange={e => updatePax(p.id, { email: e.target.value })}
//                                                      className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
//                                             </div>
//                                           </div>
//
//                                           {/* Documents */}
//                                           {selectedVisa && (
//                                               <div className="rounded-xl border border-gray-200 p-4">
//                                                 <div className="flex items-center justify-between mb-3">
//                                                   <div className="flex items-center gap-2">
//                                                     <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#EFF6FF' }}>
//                                                       <FileText className="w-3.5 h-3.5" style={{ color: '#0865FE' }} />
//                                                     </div>
//                                                     <h5 className="font-bold text-sm text-gray-900">Documents requis</h5>
//                                                     <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#EFF6FF', color: '#0865FE' }}>
//                                             ({fileCount(p.id)}/{reqCount})
//                                           </span>
//                                                   </div>
//                                                 </div>
//                                                 <div className="space-y-2">
//                                                   {(selectedVisa.documentRequirements ?? []).map((req: VisaTypeDocumentRequirement) => {
//                                                     const label = req.documentType?.labelFr ?? req.id;
//                                                     const file  = getFile(p.id, req.id);
//                                                     const pk    = `${p.id}:${req.id}`;
//                                                     return (
//                                                         <div key={req.id}
//                                                              onDragOver={e => { e.preventDefault(); setDragOver(pk); }}
//                                                              onDragLeave={() => setDragOver(null)}
//                                                              onDrop={e => {
//                                                                e.preventDefault(); setDragOver(null);
//                                                                const dropped = e.dataTransfer.files?.[0];
//                                                                if (!dropped) return;
//                                                                setFiles(prev => ({ ...prev, [p.id]: { ...(prev[p.id] ?? {}), [req.id]: dropped } }));
//                                                                toast({ title: 'Fichier ajouté', description: dropped.name });
//                                                              }}
//                                                              className="flex items-center gap-3 p-3 rounded-xl border transition-all"
//                                                              style={{
//                                                                borderColor: file ? 'rgba(16,185,129,0.3)' : dragOver === pk ? '#0865FE' : '#E5E7EB',
//                                                                background: file ? 'rgba(16,185,129,0.04)' : '#fff',
//                                                              }}>
//                                                           <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
//                                                                style={{ background: file ? '#ECFDF5' : '#EFF6FF' }}>
//                                                             {file
//                                                                 ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
//                                                                 : <FileText className="w-4 h-4" style={{ color: '#0865FE' }} />}
//                                                           </div>
//                                                           <div className="flex-1 min-w-0">
//                                                             <p className="font-semibold text-sm text-gray-800">
//                                                               {label}
//                                                               {!req.isRequired && <span className="ml-1 text-xs text-gray-400">(optionnel)</span>}
//                                                             </p>
//                                                             <p className="text-[11px] text-gray-400 truncate">{file ? file.name : 'PDF, JPG ou PNG • max 5MB'}</p>
//                                                           </div>
//                                                           <Button size="sm" onClick={() => handleFileSelect(p.id, req.id)}
//                                                                   variant={file ? 'outline' : 'default'}
//                                                                   className={cn('rounded-full text-xs h-8 px-3 shrink-0', !file && 'text-white')}
//                                                                   style={!file ? { background: '#0865FE' } : { borderColor: '#0865FE', color: '#0865FE' }}>
//                                                             <Upload className="w-3 h-3 mr-1" /> {file ? 'Remplacer' : 'Téléverser'}
//                                                           </Button>
//                                                         </div>
//                                                     );
//                                                   })}
//                                                 </div>
//                                               </div>
//                                           )}
//                                         </div>
//                                     )}
//                                   </div>
//                               );
//                             })}
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//               )}
//
//               {/* ══════ STEP 3 ══════ */}
//               {step === 3 && selectedVisa && (
//                   <div className="space-y-4">
//
//                     {/* Recap card */}
//                     <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
//                       <div className="flex">
//                         <div className="w-1 shrink-0" style={{ background: '#0865FE' }} />
//                         <div className="flex-1 p-5">
//                           <div className="flex items-start justify-between mb-4">
//                             <div>
//                               <h3 className="text-lg font-bold text-gray-900">Résumé de la demande</h3>
//                               <p className="text-xs text-gray-400 mt-0.5">Vérifiez les informations avant paiement</p>
//                             </div>
//                             <button onClick={() => setStep(2)}
//                                     className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
//                                     style={{ color: '#0865FE' }}>
//                               <Edit2 className="w-3 h-3" /> Modifier
//                             </button>
//                           </div>
//
//                           {/* Country + visa */}
//                           <div className="flex items-center gap-3 mb-5">
//                             {country && (
//                                 <div className="w-12 h-12 rounded-full border-2 border-gray-100 shadow-sm overflow-hidden shrink-0">
//                                   <img src={country.flagUrl} alt="" className="w-full h-full object-cover" />
//                                 </div>
//                             )}
//                             <div>
//                               <p className="font-bold text-gray-900 text-base">{country?.name}</p>
//                               <p className="text-sm text-gray-400">{selectedVisa.nameFr} — {selectedVisa.duration} jours</p>
//                             </div>
//                           </div>
//
//                           {/* Info grid */}
//                           <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
//                             {[
//                               { icon: Users,    label: 'VOYAGEURS',    value: `${numberOfPeople}` },
//                               { icon: Calendar, label: 'DATE DÉPART',  value: formatDate(startDate) },
//                               { icon: Clock,    label: 'DURÉE',        value: `${selectedVisa.duration} jours` },
//                               { icon: Mail,     label: 'EMAIL',        value: email },
//                               { icon: Phone,    label: 'TÉLÉPHONE',    value: `+213 ${phone}` },
//                               { icon: Clock,    label: 'DÉLAI',        value: `${selectedVisa.processingDelay} jours ouvrés`, green: true },
//                             ].map((item, i) => (
//                                 <div key={i} className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-100 bg-gray-50">
//                                   <item.icon className="w-4 h-4 shrink-0 text-gray-400" />
//                                   <div className="min-w-0">
//                                     <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{item.label}</p>
//                                     <p className={cn('font-semibold text-sm truncate', item.green ? 'text-green-600' : 'text-gray-800')}>
//                                       {item.value}
//                                     </p>
//                                   </div>
//                                 </div>
//                             ))}
//                           </div>
//
//                           {/* Total */}
//                           <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
//                             <span className="text-sm font-medium text-gray-500">Total à payer</span>
//                             <span className="text-2xl font-bold" style={{ color: '#FFB400' }}>{formatAmount(totalPrice)}</span>
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//
//                     {/* Payment card */}
//                     <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
//                       <h3 className="text-lg font-bold text-gray-900">Choisissez votre méthode de paiement</h3>
//
//                       {/* Payment options — horizontal cards with radio */}
//                       <div className="grid sm:grid-cols-2 gap-3">
//                         {/* SATIM */}
//                         <button onClick={() => setPaymentMethod('satim')}
//                                 className="flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all hover:shadow-sm"
//                                 style={{ borderColor: paymentMethod === 'satim' ? '#0865FE' : '#E5E7EB', background: paymentMethod === 'satim' ? 'rgba(8,101,254,0.03)' : '#fff' }}>
//                           <div className="flex-1 flex items-center gap-3">
//                             <img src={dhahabiaCIB} alt="CIB" className="h-9 object-contain shrink-0" />
//                             <div>
//                               <p className="font-bold text-sm text-gray-900">CIB / EDAHABIA</p>
//                               <p className="text-xs text-gray-400">Carte bancaire algérienne - SATIM</p>
//                             </div>
//                           </div>
//                           <div className={cn(
//                               'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
//                               paymentMethod === 'satim' ? 'border-blue-600' : 'border-gray-300'
//                           )}>
//                             {paymentMethod === 'satim' && <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#0865FE' }} />}
//                           </div>
//                         </button>
//
//                         {/* Agence */}
//                         <button onClick={() => setPaymentMethod('agence')}
//                                 className="flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all hover:shadow-sm"
//                                 style={{ borderColor: paymentMethod === 'agence' ? '#0865FE' : '#E5E7EB', background: paymentMethod === 'agence' ? 'rgba(8,101,254,0.03)' : '#fff' }}>
//                           <div className="flex-1 flex items-center gap-3">
//                             <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#EFF6FF' }}>
//                               <Briefcase className="w-5 h-5" style={{ color: '#0865FE' }} />
//                             </div>
//                             <div>
//                               <p className="font-bold text-sm text-gray-900">Paiement en agence</p>
//                               <p className="text-xs text-gray-400">Régler en espèces à notre agence</p>
//                             </div>
//                           </div>
//                           <div className={cn(
//                               'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
//                               paymentMethod === 'agence' ? 'border-blue-600' : 'border-gray-300'
//                           )}>
//                             {paymentMethod === 'agence' && <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#0865FE' }} />}
//                           </div>
//                         </button>
//                       </div>
//
//                       {/* Terms + reCAPTCHA */}
//                       {paymentMethod === 'satim' && (
//                           <div className="space-y-3">
//                             <label className="flex items-start gap-3 cursor-pointer">
//                               <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)}
//                                      className="mt-0.5 w-4 h-4 accent-blue-600 rounded" />
//                               <span className="text-sm text-gray-600">
//                           J'accepte les{' '}
//                                 <button type="button" onClick={() => setShowConditions(true)}
//                                         className="font-semibold underline" style={{ color: '#0865FE' }}>
//                             conditions d'utilisation
//                           </button>
//                                 {' '}et les conditions générales de paiement en ligne
//                         </span>
//                             </label>
//                             <div className="flex justify-center"><div ref={recaptchaRef} /></div>
//                           </div>
//                       )}
//
//                       {/* Total + CTA button */}
//                       <div className="rounded-2xl p-5 flex items-center justify-between gap-4" style={{ background: '#0865FE' }}>
//                         <div className="text-white">
//                           <p className="text-xs opacity-75 font-medium">Montant total à payer</p>
//                           <p className="text-3xl font-black mt-0.5">{formatAmount(totalPrice)}</p>
//                           <p className="text-xs opacity-60 mt-1">{numberOfPeople} voyageur(s) • {selectedVisa.nameFr} • {selectedVisa.duration} jours</p>
//                         </div>
//
//                         {paymentMethod === 'satim' ? (
//                             <button onClick={handlePaySatim} disabled={submitting || !termsAccepted}
//                                     className="flex items-center gap-2 bg-white rounded-xl px-5 py-3 shrink-0 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg font-bold"
//                                     style={{ color: '#0865FE' }}>
//                               {submitting
//                                   ? <Loader2 className="w-5 h-5 animate-spin" />
//                                   : <img src={logoCIB1} alt="CIB" className="h-6 object-contain" />}
//                               <span>{submitting ? 'Redirection...' : 'Valider et payer'}</span>
//                               {!submitting && <Lock className="w-3.5 h-3.5 opacity-60" />}
//                             </button>
//                         ) : (
//                             <button onClick={handlePayAgence} disabled={submitting}
//                                     className="flex items-center gap-2 bg-white rounded-xl px-5 py-3 shrink-0 hover:bg-gray-50 transition-colors disabled:opacity-40 shadow-lg font-bold"
//                                     style={{ color: '#0865FE' }}>
//                               {submitting
//                                   ? <Loader2 className="w-5 h-5 animate-spin" />
//                                   : <Briefcase className="w-5 h-5" />}
//                               <span>{submitting ? 'Enregistrement...' : 'Confirmer'}</span>
//                             </button>
//                         )}
//                       </div>
//
//                       {/* Save for later + security badge */}
//                       <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
//                         <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
//                           <Lock className="w-3.5 h-3.5" />
//                           <span>Paiement 100% sécurisé • SSL • {paymentMethod === 'satim' ? 'SATIM certifié' : 'Paiement en agence'}</span>
//                         </div>
//                         <Button variant="outline" disabled={submitting} onClick={async () => {
//                           setSubmitting(true);
//                           try {
//                             await submitApplication();
//                             toast({ title: 'Demande enregistrée', description: 'Vous pouvez payer depuis votre tableau de bord.' });
//                             navigate('/client/applications');
//                           } catch (err: any) {
//                             toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
//                           } finally { setSubmitting(false); }
//                         }} className="rounded-full text-sm h-9 px-4 text-gray-600">
//                           {submitting
//                               ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enregistrement...</>
//                               : <><Save className="w-4 h-4 mr-2" /> Enregistrer & payer plus tard</>}
//                         </Button>
//                       </div>
//                     </div>
//
//                     {/* Modal conditions */}
//                     {showConditions && (
//                         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
//                           <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
//                             <div className="flex items-center justify-between">
//                               <h2 className="text-lg font-bold text-gray-900">Conditions d'utilisation</h2>
//                               <button onClick={() => setShowConditions(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100">
//                                 <X className="w-4 h-4 text-gray-500" />
//                               </button>
//                             </div>
//                             <div className="text-sm text-gray-600 leading-relaxed space-y-3 max-h-72 overflow-y-auto">
//                               <p>En procédant à ce paiement, vous acceptez nos conditions d'utilisation et les conditions générales de paiement en ligne établies par notre partenaire bancaire (CIB / EDAHABIA).</p>
//                               <p>Le montant est traité de manière sécurisée via <strong>SATIM I-PAY</strong>. Les paiements ne sont pas remboursables sauf dans les cas prévus par notre politique de remboursement.</p>
//                             </div>
//                             <div className="flex justify-end">
//                               <Button onClick={() => { setTermsAccepted(true); setShowConditions(false); }}
//                                       className="text-white rounded-full px-6" style={{ background: '#0865FE' }}>
//                                 J'accepte
//                               </Button>
//                             </div>
//                           </div>
//                         </div>
//                     )}
//                   </div>
//               )}
//
//             </motion.div>
//           </AnimatePresence>
//
//           {/* ── Nav buttons ── */}
//           <div className="flex items-center justify-between gap-3 pb-6">
//             <Button variant="outline" onClick={back} className="rounded-full px-5 h-10 font-medium text-gray-600 border-gray-200">
//               <ArrowLeft className="w-4 h-4 mr-2" />{step === 1 ? "Retour à l'accueil" : 'Retour'}
//             </Button>
//             <div className="flex gap-2">
//               {step === 2 && (
//                   <Button variant="ghost" onClick={save} className="rounded-full px-4 h-10 text-gray-500 text-sm">
//                     <Save className="w-4 h-4 mr-2" /> Enregistrer
//                   </Button>
//               )}
//               {step === 2 && (
//                   <Button onClick={next} disabled={!canNext || submitting}
//                           className="text-white font-semibold rounded-full px-6 h-10"
//                           style={{ background: '#0865FE' }}>
//                     {submitting
//                         ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Envoi...</>
//                         : <>Suivant <ArrowRight className="w-4 h-4 ml-2" /></>}
//                   </Button>
//               )}
//             </div>
//           </div>
//         </div>
//
//         <PassportScanner
//             open={!!scannerOpenFor}
//             onOpenChange={o => { if (!o) setScannerOpenFor(null); }}
//             onResult={data => { if (scannerOpenFor) applyMrz(scannerOpenFor, data); }}
//         />
//       </div>
//   );
// };
//
// export default Apply;

import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
    ArrowLeft, ArrowRight, Check, Plus, Trash2, Upload,
    FileText, CheckCircle2, Clock, Calendar, Save,
    ScanLine, Loader2, MapPin, X, Briefcase,
    GraduationCap, Palmtree, Lock, Mail, Phone,
    Info, ChevronRight, Edit2, Users, Search,
    Globe, User, CreditCard, ShieldCheck, Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/i18n/LanguageContext';
import PassportScanner, { type MrzResult } from '@/components/PassportScanner';
import { uploadFile } from '@/service/upload.service';
import { createFullApplication } from '@/service/visaApplication.service';
import type { VisaType, VisaTypeDocumentRequirement, PassengerInput } from '@/lib/types';
import { initiateSatimPayment } from '@/service/payment.service.ts';

const formatAmount = (amount: number) => `${amount.toFixed(2)} DA`;

type Passenger = PassengerInput & { id: string };

const newPassenger = (nationality = 'Algérienne'): Passenger => ({
    id: `pax-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    firstName: '',
    lastName: '',
    birthDate: '',
    birthPlace: '',
    nationality,
    passportNumber: '',
    passportIssueDate: '',
    passportExpiryDate: '',
    email: '',
});

declare global {
    interface Window {
        grecaptcha: any;
    }
}

const BROKEN_BAHRAIN_PHOTO_ID = 'photo-1573504320674-e0bbe14969b0';
const BAHRAIN_PHOTO = 'https://images.unsplash.com/photo-1588172739076-929ab3c0cdbe?fit=crop&w=1200&h=800&q=85';

type ApplyCountry = {
    code: string;
    nameFr: string;
    nameEn: string;
    nameAr: string;
    flagUrl: string;
    images: { url: string; imageType: string; isMain: boolean }[];
};

const getCountryPhoto = (country?: ApplyCountry): string | null => {
    const images = country?.images ?? [];
    const galleryImages = images.filter((image) => image.imageType === 'GALLERY');
    const photo =
        galleryImages.find((image) => image.isMain)?.url ??
        galleryImages[0]?.url ??
        images.find((image) => image.imageType === 'HERO' && image.isMain)?.url ??
        images.find((image) => image.imageType === 'HERO')?.url ??
        null;

    if (!photo) return null;
    if (country?.code === 'bh' && photo.includes(BROKEN_BAHRAIN_PHOTO_ID)) return BAHRAIN_PHOTO;
    return photo.trim();
};

const Apply = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    const { t, language } = useLanguage();

    const preselectedCountry =
        (searchParams.get('country') || '').toLowerCase();

    const [step, setStep] = useState(1);
    const [countryCode, setCountryCode] = useState(preselectedCountry);
    const [visaTypeId, setVisaTypeId] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [startDate, setStartDate] = useState('');
    const [numberOfPeople, setNumberOfPeople] = useState(1);
    const [passengers, setPassengers] = useState<Passenger[]>([
        newPassenger(t('applyNationalityPlaceholder')),
    ]);
    const [files, setFiles] =
        useState<Record<string, Record<string, File>>>({});
    const [appId, setAppId] = useState('');
    const [paid, setPaid] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [clientProfileId, setClientProfileId] =
        useState<string | null>(null);
    const [paymentMethod, setPaymentMethod] =
        useState<'satim' | 'agence'>('satim');
    const [offices, setOffices] = useState<Array<{ id: string; name: string; wilaya: string }>>([]);
    const [officesLoading, setOfficesLoading] = useState(true);
    const [selectedOfficeId, setSelectedOfficeId] = useState('');
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [cancellationPolicyAccepted, setCancellationPolicyAccepted] = useState(false);
    const [informationAccuracyAccepted, setInformationAccuracyAccepted] = useState(false);
    const [visaDecisionAccepted, setVisaDecisionAccepted] = useState(false);
    const [showConditions, setShowConditions] = useState(false);
    const [captchaVerified, setCaptchaVerified] = useState(false);
    const recaptchaRef = useRef<HTMLDivElement>(null);
    const recaptchaWidgetId = useRef<number | null>(null);
    const [countrySearch, setCountrySearch] = useState('');
    const [infoConfirmed, setInfoConfirmed] = useState(false);
    const [expandedPax, setExpandedPax] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState<string | null>(null);
    const [scannerOpenFor, setScannerOpenFor] = useState<string | null>(null);
    const [autofilled, setAutofilled] =
        useState<Record<string, Set<string>>>({});

    const allRequiredConsentsAccepted =
        cancellationPolicyAccepted &&
        informationAccuracyAccepted &&
        visaDecisionAccepted;

    useEffect(() => {
        let cancelled = false;
        fetch(`${import.meta.env.VITE_API_URL ?? ''}/api/contact/offices`)
            .then((res) => {
                if (!res.ok) throw new Error('Unable to load offices');
                return res.json();
            })
            .then((data) => {
                if (!cancelled) setOffices(data);
            })
            .catch((error) => console.error('[Apply] offices:', error))
            .finally(() => {
                if (!cancelled) setOfficesLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const popularDestinationsRef = useRef<HTMLDivElement>(null);

    const fileCount = (paxId: string) =>
        Object.keys(files[paxId] ?? {}).length;

    const getFile = (
        paxId: string,
        reqId: string
    ): File | undefined => files[paxId]?.[reqId];

    const todayLocal = (() => {
        const d = new Date();

        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
            2,
            '0'
        )}-${String(d.getDate()).padStart(2, '0')}`;
    })();

    useEffect(() => {
        if (document.getElementById('recaptcha-script')) return;

        const script = document.createElement('script');

        script.id = 'recaptcha-script';
        script.src =
            'https://www.google.com/recaptcha/api.js?render=explicit';
        script.async = true;
        script.defer = true;

        document.head.appendChild(script);
    }, []);

    useEffect(() => {
        if (step !== 3 || paymentMethod !== 'satim') return;

        const tryRender = () => {
            if (!window.grecaptcha || !recaptchaRef.current) {
                setTimeout(tryRender, 300);
                return;
            }

            if (recaptchaWidgetId.current !== null) return;

            recaptchaWidgetId.current = window.grecaptcha.render(
                recaptchaRef.current,
                {
                    sitekey: import.meta.env.VITE_RECAPTCHA_SITE_KEY,
                    callback: () => setCaptchaVerified(true),
                    'expired-callback': () => setCaptchaVerified(false),
                }
            );
        };

        tryRender();
    }, [step, paymentMethod]);

    useEffect(() => {
        setCaptchaVerified(false);

        if (
            recaptchaWidgetId.current !== null &&
            window.grecaptcha
        ) {
            window.grecaptcha.reset(recaptchaWidgetId.current);
            recaptchaWidgetId.current = null;
        }
    }, [paymentMethod]);

    useEffect(() => {
        const raw = localStorage.getItem('apply_draft');

        if (!raw) return;

        try {
            const d = JSON.parse(raw);

            if (d.countryCode) setCountryCode(d.countryCode);
            if (d.visaTypeId) setVisaTypeId(d.visaTypeId);
            if (d.email) setEmail(d.email);
            if (d.phone) setPhone(d.phone);
            if (d.startDate) setStartDate(d.startDate);
            if (d.numberOfPeople) setNumberOfPeople(d.numberOfPeople);
            if (d.passengers) setPassengers(d.passengers);
            if (d.step) setStep(d.step);
        } catch {
            /* ignore */
        }
    }, []);

    useEffect(() => {
        if (!user || user.role !== 'CLIENT') return;

        const token = localStorage.getItem('token');

        fetch(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then((r) => r.json())
            .then((data) => {
                if (data.email) setEmail(data.email);
                if (data.phone) setPhone(data.phone);
                if (data.profile?.id) setClientProfileId(data.profile.id);
            });
    }, [user]);

    const [dbCountries, setDbCountries] = useState<ApplyCountry[]>([]);

    useEffect(() => {
        (async () => {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/countries`
            );

            const data = await res.json();

            if (!Array.isArray(data)) return;

            setDbCountries(
                data.map((c: any) => ({
                    code: c.code.toLowerCase(),
                    nameFr: c.nameFr,
                    nameEn: c.nameEn,
                    nameAr: c.nameAr,
                    images: c.images ?? [],
                    flagUrl: (
                        c.images?.find(
                            (img: any) => img.imageType === 'FLAG'
                        )?.url ||
                        `https://flagcdn.com/w160/${c.code.toLowerCase()}.png`
                    ).trim(),
                }))
            );
        })();
    }, []);

    const getCountryName = (value?: ApplyCountry) => {
        if (!value) return '';
        return language === 'ar'
            ? value.nameAr || value.nameFr
            : language === 'en'
                ? value.nameEn || value.nameFr
                : value.nameFr;
    };

    const countries = useMemo(
        () =>
            [...dbCountries].sort((a, b) =>
                getCountryName(a).localeCompare(
                    getCountryName(b),
                    language === 'ar' ? 'ar' : language === 'en' ? 'en' : 'fr'
                )
            ),
        [dbCountries, language]
    );

    const country = countries.find(
        (c) => c.code === countryCode
    );
    const countryPhoto = getCountryPhoto(country);

    const otherPopularCountries = countries.filter(
        (c) => c.code !== countryCode
    );

    const [visaTypes, setVisaTypes] = useState<VisaType[]>([]);
    const [visaTypesLoading, setVisaTypesLoading] = useState(false);

    useEffect(() => {
        if (!countryCode) return;

        setVisaTypesLoading(true);

        fetch(
            `${import.meta.env.VITE_API_URL}/api/visa-types?countryCode=${countryCode}`
        )
            .then((r) => r.json())
            .then((d) =>
                setVisaTypes(
                    d.status === 'success' ? d.data : []
                )
            )
            .catch(() => setVisaTypes([]))
            .finally(() => setVisaTypesLoading(false));
    }, [countryCode]);

    useEffect(() => {
        if (
            preselectedCountry &&
            countries.length > 0 &&
            !countries.find(
                (c) => c.code === preselectedCountry
            )
        ) {
            setCountryCode('');
            setVisaTypeId('');
            setStep(1);
        }
    }, [preselectedCountry, countries]);

    const selectedVisa = visaTypes.find(
        (v) => v.id === visaTypeId
    ) as VisaType | undefined;

    const getVisaName = (visa: VisaType) =>
        language === 'ar'
            ? visa.nameAr || visa.nameFr
            : language === 'en'
                ? visa.nameEn || visa.nameFr
                : visa.nameFr;

    const getVisaDescription = (visa: VisaType) =>
        language === 'ar'
            ? visa.descriptionAr || visa.descriptionFr
            : language === 'en'
                ? visa.descriptionEn || visa.descriptionFr
                : visa.descriptionFr;

    const getDocumentLabel = (requirement: VisaTypeDocumentRequirement) =>
        language === 'ar'
            ? requirement.documentType?.labelAr || requirement.documentType?.labelFr
            : language === 'en'
                ? requirement.documentType?.labelEn || requirement.documentType?.labelFr
                : requirement.documentType?.labelFr;

    const totalPrice = selectedVisa
        ? Number(selectedVisa.price) * numberOfPeople
        : 0;

    const applyMrz = (
        paxId: string,
        data: MrzResult
    ) => {
        const patch: Partial<Passenger> = {};
        const filled = new Set<string>();

        (Object.keys(data) as (keyof MrzResult)[]).forEach(
            (k) => {
                const v = data[k];

                if (v) {
                    (patch as any)[k] = v;
                    filled.add(k as string);
                }
            }
        );

        updatePax(paxId, patch);

        setAutofilled((prev) => ({
            ...prev,
            [paxId]: filled,
        }));
    };

    const isAutofilled = (
        paxId: string,
        field: string
    ) => autofilled[paxId]?.has(field);

    const handleFileSelect = (
        paxId: string,
        reqId: string
    ) => {
        if (!user) {
            toast({
                title: t('applyToastLoginRequired'),
                description: t('applyToastLoginDescription'),
                variant: 'destructive',
            });

            navigate(
                `/login?redirect=${encodeURIComponent(
                    window.location.pathname +
                    window.location.search
                )}`
            );

            return;
        }

        const input = document.createElement('input');

        input.type = 'file';
        input.accept = '.pdf,.jpg,.jpeg,.png';

        input.onchange = (e) => {
            const file = (
                e.target as HTMLInputElement
            ).files?.[0];

            if (!file) return;

            setFiles((prev) => ({
                ...prev,
                [paxId]: {
                    ...(prev[paxId] ?? {}),
                    [reqId]: file,
                },
            }));

            toast({
                title: t('applyToastFileSelected'),
                description: file.name,
            });
        };

        input.click();
    };

    const syncPassengers = (n: number) => {
        setNumberOfPeople(n);

        setPassengers((prev) => {
            if (n > prev.length) {
                return [
                    ...prev,
                    ...Array.from(
                        { length: n - prev.length },
                        () => newPassenger(t('applyNationalityPlaceholder'))
                    ),
                ];
            }

            return prev.slice(0, n);
        });
    };

    const updatePax = (
        id: string,
        patch: Partial<Passenger>
    ) =>
        setPassengers((prev) =>
            prev.map((p) =>
                p.id === id ? { ...p, ...patch } : p
            )
        );

    const removePax = (id: string) => {
        if (passengers.length <= 1) return;

        const next = passengers.filter(
            (p) => p.id !== id
        );

        setPassengers(next);
        setNumberOfPeople(next.length);
    };

    const addPax = () => {
        setPassengers((p) => [
            ...p,
            newPassenger(t('applyNationalityPlaceholder')),
        ]);

        setNumberOfPeople((n) => n + 1);
    };

    const paxComplete = (p: Passenger) =>
        !!(
            p.firstName &&
            p.lastName &&
            p.passportNumber &&
            p.birthPlace &&
            p.birthDate &&
            p.nationality &&
            p.passportIssueDate &&
            p.passportExpiryDate
        );

    const paxDocsOk = (paxId: string) => {
        if (!selectedVisa) return false;

        const required =
            selectedVisa.documentRequirements?.filter(
                (r: VisaTypeDocumentRequirement) =>
                    r.isRequired
            ).length ?? 0;

        return fileCount(paxId) >= required;
    };

    const canNext = (() => {
        switch (step) {
            case 1:
                return !!countryCode && !!visaTypeId;

            case 2:
                return (
                    infoConfirmed &&
                    !!email &&
                    !!phone &&
                    !!startDate &&
                    numberOfPeople >= 1 &&
                    passengers.every(paxComplete) &&
                    (selectedVisa
                        ? passengers.every((p) =>
                            paxDocsOk(p.id)
                        )
                        : false)
                );

            case 3:
                return paid;

            default:
                return true;
        }
    })();

    const submitApplication = async (officeId?: string): Promise<{
        applicationId: string;
    }> => {
        const uploadedDocs: Record<
            string,
            Record<
                string,
                {
                    fileUrl: string;
                    originalName: string;
                }
            >
        > = {};

        for (const pax of passengers) {
            uploadedDocs[pax.id] = {};

            for (const [reqId, file] of Object.entries(
                files[pax.id] ?? {}
            )) {
                const fileUrl = await uploadFile(file);

                uploadedDocs[pax.id][reqId] = {
                    fileUrl,
                    originalName: file.name,
                };
            }
        }

        const result = await createFullApplication({
            visaTypeId,
            email,
            phone,
            startDate,
            numberOfPeople,
            clientId: clientProfileId ?? null,
            agencyId: null,
            officeId: officeId ?? null,

            passengers: passengers.map((pax) => ({
                firstName: pax.firstName,
                lastName: pax.lastName,
                birthDate: pax.birthDate,
                birthPlace: pax.birthPlace,
                nationality: pax.nationality,
                passportNumber: pax.passportNumber,
                passportIssueDate:
                pax.passportIssueDate,
                passportExpiryDate:
                pax.passportExpiryDate,
                email: pax.email,

                documents: Object.entries(
                    uploadedDocs[pax.id] ?? {}
                ).map(([reqId, doc]) => ({
                    requirementId: reqId,
                    fileUrl: doc.fileUrl,
                    originalName: doc.originalName,
                })),
            })),
        });

        localStorage.removeItem('apply_draft');

        setAppId(
            result.data.applicationId
        );

        return result.data;
    };

    const handlePaySatim = async () => {
        if (!allRequiredConsentsAccepted) {
            toast({ title: t('applyToastIncomplete'), description: t('applyConsentsRequired'), variant: 'destructive' });
            return;
        }

        setSubmitting(true);

        try {
            const captchaToken =
                window.grecaptcha.getResponse(
                    recaptchaWidgetId.current
                );

            if (!captchaToken) {
                toast({
                    title: t('applyToastCaptchaRequired'),
                    description: t('applyToastCaptchaDescription'),
                    variant: 'destructive',
                });

                setSubmitting(false);
                return;
            }

            const result =
                await submitApplication();

            const { formUrl } =
                await initiateSatimPayment(
                    result.applicationId,
                    captchaToken
                );

            window.location.href = formUrl;
        } catch (err: any) {
            toast({
                title: t('applyToastPaymentError'),
                description: err.message,
                variant: 'destructive',
            });

            setSubmitting(false);
        }
    };

    const handlePayAgence = async () => {
        if (!allRequiredConsentsAccepted) {
            toast({ title: t('applyToastIncomplete'), description: t('applyConsentsRequired'), variant: 'destructive' });
            return;
        }

        if (!selectedOfficeId) {
            toast({
                title: t('applyOfficeRequired'),
                description: t('applyOfficeRequiredDescription'),
                variant: 'destructive',
            });
            return;
        }

        setSubmitting(true);

        try {
            await submitApplication(selectedOfficeId);

            toast({
                title: t('applyToastApplicationSaved'),
                description: t('applyToastAgencyPayment'),
            });

            navigate('/client/applications');
        } catch (err: any) {
            toast({
                title: t('applyToastError'),
                description: err.message,
                variant: 'destructive',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const next = async () => {
        if (!canNext) {
            toast({
                title: t('applyToastIncomplete'),
                description: t('applyToastChooseDestination'),
                variant: 'destructive',
            });

            return;
        }

        setStep((s) => Math.min(3, s + 1));
    };

    const back = () => {
        if (step <= 1) {
            navigate('/');
            return;
        }

        setStep((s) => s - 1);
    };

    const save = () => {
        localStorage.setItem(
            'apply_draft',
            JSON.stringify({
                step: Math.min(step, 2),
                countryCode,
                visaTypeId,
                email,
                phone,
                startDate,
                numberOfPeople,
                passengers,
            })
        );

        toast({
            title: t('applyToastDraftSaved'),
            description: t('applyToastResumeDraft'),
        });
    };

    const visaIcon = (name: string) => {
        const n = name.toLowerCase();

        if (
            n.includes('affaire') ||
            n.includes('business') ||
            n.includes('travail')
        )
            return Briefcase;

        if (
            n.includes('étud') ||
            n.includes('etud') ||
            n.includes('student')
        )
            return GraduationCap;

        return Briefcase;
    };

    const formatDate = (iso: string) =>
        iso
            ? new Intl.DateTimeFormat(t('applyDateLocale'), {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            }).format(new Date(`${iso}T00:00:00`))
            : '';


    const scrollPopularDestinations = (
        direction: 'left' | 'right'
    ) => {
        if (!popularDestinationsRef.current) return;

        const scrollAmount =
            window.innerWidth < 640 ? 240 : 320;

        popularDestinationsRef.current.scrollBy({
            left:
                direction === 'right'
                    ? scrollAmount
                    : -scrollAmount,
            behavior: 'smooth',
        });
    };

    if (paid) {
        return (
            <div className="relative min-h-screen flex items-center justify-center px-4 py-12 bg-[#F4F6FB]">
                <div className="text-center max-w-md w-full space-y-5 bg-white rounded-3xl p-10 shadow-xl">
                    <div className="relative w-24 h-24 mx-auto">
                        <span className="absolute inset-0 rounded-full animate-ping bg-blue-100" />

                        <div className="relative w-24 h-24 rounded-full flex items-center justify-center shadow-xl bg-[#0865FE]">
                            <CheckCircle2
                                className="w-12 h-12 text-white"
                                strokeWidth={2.5}
                            />
                        </div>
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900">
                        {t('applySuccessTitle')}
                    </h1>

                    <p className="text-gray-500 text-sm">
                        {t('applySuccessMessage').replace('{country}', getCountryName(country))}
                    </p>

                    <div className="inline-block border-2 border-blue-100 rounded-full px-6 py-2">
            <span className="font-mono font-bold text-base tracking-wider text-gray-800">
              {appId}
            </span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                        <Button
                            onClick={() =>
                                navigate('/client/applications')
                            }
                            className="text-white font-semibold rounded-full px-6 bg-[#0865FE]"
                        >
                            {t('applyMyApplications')}
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => navigate('/client')}
                            className="rounded-full px-6"
                        >
                            {t('applyDashboard')}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden bg-[#F4F6FB] pb-20 sm:pb-24">
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('/assets/map-pattern.png')] bg-cover bg-center" />

            <div className="container relative z-10 max-w-7xl mx-auto px-3 sm:px-4 pt-4 sm:pt-8 lg:pt-12">

                {/* ─────────────────────────────────────────────
            HEADER / STEPPER
        ───────────────────────────────────────────── */}

                <div className="bg-white rounded-[20px] sm:rounded-[24px] p-3.5 sm:p-6 shadow-sm border border-gray-100 mb-4 sm:mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 lg:gap-6">

                    <div className="lg:w-1/4">
                        <h2 className="text-lg sm:text-2xl font-bold text-[#002161]">
                            {t('applyTitle')}
                        </h2>

                        <p className="text-[11px] sm:text-sm text-gray-500 mt-0.5">
                            {t('applySubtitle')}
                        </p>
                    </div>

                    <div className="flex items-center justify-start lg:justify-end gap-1.5 sm:gap-2 overflow-x-auto hide-scrollbar pb-1 lg:pb-0 w-full">

                        {/* Step 1 */}

                        <div
                            className={cn(
                                "flex items-center gap-2 sm:gap-3 rounded-[14px] sm:rounded-[20px] p-1.5 sm:p-2 pr-3 sm:pr-6 shrink-0 transition-colors",
                                step === 1
                                    ? "bg-blue-50/60 border border-blue-100"
                                    : ""
                            )}
                        >
                            <div
                                className={cn(
                                    "w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 transition-colors",
                                    step >= 1
                                        ? "bg-[#0865FE] text-white shadow-md shadow-blue-500/20"
                                        : "border-2 border-gray-100 text-gray-400 bg-gray-50"
                                )}
                            >
                                <Globe className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                            </div>

                            <div>
                                <div
                                    className={cn(
                                        "font-bold text-[10px] sm:text-sm",
                                        step >= 1
                                            ? "text-[#0865FE]"
                                            : "text-gray-400"
                                    )}
                                >
                                    01
                                </div>

                                <div
                                    className={cn(
                                        "font-bold text-[10px] sm:text-[13px]",
                                        step >= 1
                                            ? "text-[#002161]"
                                            : "text-gray-800"
                                    )}
                                >
                                    {t('applyStepCountry')}
                                </div>

                                <div className="text-gray-400 text-[10px] sm:text-[11px] hidden sm:block">
                                    {t('applyDestinationPrompt')}
                                </div>
                            </div>
                        </div>

                        <div className="w-3 sm:w-8 border-t-2 border-dashed border-gray-200 shrink-0" />

                        {/* Step 2 */}

                        <div
                            className={cn(
                                "flex items-center gap-2 sm:gap-3 rounded-[14px] sm:rounded-[20px] p-1.5 sm:p-2 pr-3 sm:pr-6 shrink-0 transition-colors",
                                step === 2
                                    ? "bg-blue-50/60 border border-blue-100"
                                    : ""
                            )}
                        >
                            <div
                                className={cn(
                                    "w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 transition-colors",
                                    step >= 2
                                        ? "bg-[#0865FE] text-white shadow-md shadow-blue-500/20"
                                        : "border-2 border-gray-100 text-gray-400 bg-gray-50"
                                )}
                            >
                                <User className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                            </div>

                            <div>
                                <div
                                    className={cn(
                                        "font-bold text-[10px] sm:text-sm",
                                        step >= 2
                                            ? "text-[#0865FE]"
                                            : "text-gray-400"
                                    )}
                                >
                                    02
                                </div>

                                <div
                                    className={cn(
                                        "font-bold text-[10px] sm:text-[13px]",
                                        step >= 2
                                            ? "text-[#002161]"
                                            : "text-gray-800"
                                    )}
                                >
                                    {t('applyStepTravelers')}
                                </div>

                                <div className="text-gray-400 text-[10px] sm:text-[11px] hidden sm:block">
                                    {t('applyStepTravelersHint')}
                                </div>
                            </div>
                        </div>

                        <div className="w-3 sm:w-8 border-t-2 border-dashed border-gray-200 shrink-0" />

                        {/* Step 3 */}

                        <div
                            className={cn(
                                "flex items-center gap-2 sm:gap-3 rounded-[14px] sm:rounded-[20px] p-1.5 sm:p-2 pr-3 sm:pr-6 shrink-0 transition-colors",
                                step === 3
                                    ? "bg-blue-50/60 border border-blue-100"
                                    : ""
                            )}
                        >
                            <div
                                className={cn(
                                    "w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 transition-colors",
                                    step >= 3
                                        ? "bg-[#0865FE] text-white shadow-md shadow-blue-500/20"
                                        : "border-2 border-gray-100 text-gray-400 bg-gray-50"
                                )}
                            >
                                <CreditCard className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                            </div>

                            <div>
                                <div
                                    className={cn(
                                        "font-bold text-[10px] sm:text-sm",
                                        step >= 3
                                            ? "text-[#0865FE]"
                                            : "text-gray-400"
                                    )}
                                >
                                    03
                                </div>

                                <div
                                    className={cn(
                                        "font-bold text-[10px] sm:text-[13px]",
                                        step >= 3
                                            ? "text-[#002161]"
                                            : "text-gray-800"
                                    )}
                                >
                                    {t('applyStepPayment')}
                                </div>

                                <div className="text-gray-400 text-[10px] sm:text-[11px] hidden sm:block">
                                    {t('applyStepPaymentHint')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─────────────────────────────────────────────
            CONTENT
        ───────────────────────────────────────────── */}

                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >

                        {/* ════════════════════════════════════════
                STEP 1
            ════════════════════════════════════════ */}

                        {step === 1 && (
                            <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 items-stretch">

                                {/* LEFT CARD */}

                                <div className="bg-white rounded-[20px] sm:rounded-[24px] p-3.5 sm:p-6 lg:p-8 shadow-sm border border-gray-100 flex flex-col h-full min-w-0">

                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-5">

                                        <div className="min-w-0">
                                            <h3 className="text-[17px] sm:text-[22px] font-bold text-[#002161]">
                                                {t('applyDestinationPrompt')}
                                            </h3>

                                            <p className="text-[11px] sm:text-[13px] text-gray-500 mt-0.5">
                                                {t('applyAvailableCountries').replace('{count}', String(countries.length))}
                                            </p>
                                        </div>

                                    </div>

                                    {!countryCode ? (

                                        <div className="flex-1 flex flex-col">

                                            <div className="relative mb-4 sm:mb-5">
                                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />

                                                <input
                                                    value={countrySearch}
                                                    onChange={(e) =>
                                                        setCountrySearch(e.target.value)
                                                    }
                                                    placeholder={t('applySearchCountry')}
                                                    className="w-full h-11 rounded-xl border border-gray-200 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#0865FE]/20 focus:border-[#0865FE] bg-gray-50/50"
                                                />

                                                {countrySearch && (
                                                    <button
                                                        onClick={() =>
                                                            setCountrySearch('')
                                                        }
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center hover:bg-gray-200"
                                                    >
                                                        <X className="w-3.5 h-3.5 text-gray-500" />
                                                    </button>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                                                {countries
                                                    .filter((c) =>
                                                        getCountryName(c)
                                                            .toLowerCase()
                                                            .includes(
                                                                countrySearch
                                                                    .trim()
                                                                    .toLowerCase()
                                                            )
                                                    )
                                                    .map((c) => {
                                                        const cphoto = getCountryPhoto(c);

                                                        return (
                                                            <button
                                                                key={c.code}
                                                                onClick={() =>
                                                                    setCountryCode(c.code)
                                                                }
                                                                className="group relative h-[100px] sm:h-[110px] rounded-2xl overflow-hidden text-left border-2 border-transparent hover:border-blue-200 shadow-sm transition-all w-full bg-white"
                                                            >
                                                                {cphoto && (
                                                                    <img
                                                                        src={cphoto}
                                                                        alt={getCountryName(c)}
                                                                        loading="lazy"
                                                                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                                        onError={(e) => {
                                                                            const container = e.currentTarget.parentElement;
                                                                            e.currentTarget.style.display = 'none';
                                                                            container?.querySelector('[data-photo-overlay]')?.remove();
                                                                            const label = container?.querySelector('[data-photo-label]') as HTMLElement | null;
                                                                            if (label) label.style.color = '#002161';
                                                                        }}
                                                                    />
                                                                )}

                                                                {cphoto && <div data-photo-overlay className="absolute inset-0 bg-gradient-to-t from-[#002161]/80 via-black/20 to-transparent" />}

                                                                <div className="absolute top-2 start-2 w-6 h-6 sm:w-7 sm:h-7 rounded-full border-[1.5px] border-white shadow-md overflow-hidden bg-white">
                                                                    <img
                                                                        src={c.flagUrl}
                                                                        alt=""
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                </div>

                                                                <div className="absolute inset-x-0 bottom-0 p-2">
                                  <span data-photo-label className={`${cphoto ? 'text-white drop-shadow-md' : 'text-[#002161]'} text-[12px] sm:text-[13px] font-bold leading-tight block truncate`}>
                                    {getCountryName(c)}
                                  </span>
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                            </div>
                                        </div>

                                    ) : (

                                        <div className="flex flex-col flex-1 h-full">

                                            {/* SELECTED COUNTRY */}

                                            <div className="relative h-36 sm:h-60 lg:h-68 rounded-[18px] sm:rounded-[24px] overflow-hidden mb-4 sm:mb-5 shadow-md border border-gray-100 bg-white">

                                                {countryPhoto && (
                                                    <img
                                                        src={countryPhoto}
                                                        alt={getCountryName(country)}
                                                        className="absolute inset-0 w-full h-full object-cover"
                                                        onError={(e) => {
                                                            const container = e.currentTarget.parentElement;
                                                            e.currentTarget.style.display = 'none';
                                                            container?.querySelector('[data-photo-overlay]')?.remove();
                                                            const label = container?.querySelector('[data-photo-label]') as HTMLElement | null;
                                                            if (label) label.style.color = '#002161';
                                                        }}
                                                    />
                                                )}

                                                {countryPhoto && <div data-photo-overlay className="absolute inset-0 bg-gradient-to-t from-[#002161]/90 via-black/20 to-transparent" />}

                                                <div className="absolute top-3 left-3 sm:top-5 sm:left-5 w-9 h-9 sm:w-12 sm:h-12 rounded-full overflow-hidden border-[2.5px] border-white shadow-lg bg-white">
                                                    <img
                                                        src={country?.flagUrl}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>

                                                <div className="absolute bottom-3 left-3 sm:bottom-5 sm:left-5">
                                                    <h2 data-photo-label className={`${countryPhoto ? 'text-white drop-shadow-md' : 'text-[#002161]'} text-lg sm:text-3xl font-extrabold`}>
                                                        {getCountryName(country)}
                                                    </h2>

                                                    <div className="bg-black/30 backdrop-blur-md border border-white/20 text-white text-[9px] sm:text-[11px] font-medium px-2.5 sm:px-3 py-1 rounded-full mt-1.5 inline-flex items-center">
                                                        <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1.5 text-white/90" />

                                                        {t('applySelectedDestination')}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* ─────────────────────────────
                          POPULAR DESTINATIONS
                      ───────────────────────────── */}

                                            <div className="mt-auto pt-3 border-t border-gray-50">

                                                {/* HEADER */}

                                                <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3">

                                                    <h4 className="font-bold text-[#002161] text-[12px] sm:text-[14px]">
                                                        {t('applyOtherPopular')}
                                                    </h4>

                                                    <button
                                                        type="button"
                                                        onClick={() => navigate('/destinations')}
                                                        className="flex items-center gap-1 text-[#0865FE] text-[10px] sm:text-[11px] font-bold whitespace-nowrap shrink-0 hover:text-blue-700 active:scale-95 transition-all"
                                                    >
                                                        {t('applyAllDestinations')}

                                                        <ChevronRight className="w-3.5 h-3.5" />
                                                    </button>

                                                </div>

                                                {/* DESTINATIONS CAROUSEL */}

                                                <div className="relative flex items-center gap-2">

                                                    {/* LEFT ARROW */}

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            scrollPopularDestinations('left')
                                                        }
                                                        aria-label={t('applyPreviousDestinations')}
                                                        className="shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-[#0865FE] hover:bg-[#0865FE] hover:text-white hover:border-[#0865FE] transition-all active:scale-95 z-10"
                                                    >
                                                        <ArrowLeft className="w-4 h-4" />
                                                    </button>

                                                    {/* FLAGS */}

                                                    <div
                                                        ref={popularDestinationsRef}
                                                        className="flex-1 flex gap-2.5 sm:gap-3 overflow-x-auto pb-3 pt-1 hide-scrollbar touch-pan-x snap-x snap-mandatory overscroll-x-contain"
                                                    >
                                                        {otherPopularCountries.map(
                                                            (c) => (
                                                                <button
                                                                    key={c.code}
                                                                    onClick={() => {
                                                                        setCountryCode(c.code);
                                                                        setVisaTypeId('');
                                                                    }}
                                                                    className="flex flex-col items-center gap-1.5 shrink-0 snap-start group min-w-[52px] sm:min-w-[60px]"
                                                                >
                                                                    <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full border border-gray-200 shadow-sm overflow-hidden bg-white transition-all group-hover:scale-105 group-hover:border-blue-300">
                                                                        <img
                                                                            src={c.flagUrl}
                                                                            alt={getCountryName(c)}
                                                                            loading="lazy"
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    </div>

                                                                    <span className="text-[9px] sm:text-[11px] font-medium text-gray-700 text-center max-w-[52px] sm:max-w-[64px] leading-tight group-hover:text-blue-600 transition-colors truncate w-full block">
              {getCountryName(c)}
            </span>
                                                                </button>
                                                            )
                                                        )}
                                                    </div>

                                                    {/* RIGHT ARROW */}

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            scrollPopularDestinations('right')
                                                        }
                                                        aria-label={t('applyMoreDestinations')}
                                                        className="shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-[#0865FE] hover:bg-[#0865FE] hover:text-white hover:border-[#0865FE] transition-all active:scale-95 z-10"
                                                    >
                                                        <ArrowRight className="w-4 h-4" />
                                                    </button>

                                                </div>

                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* RIGHT CARD */}

                                <div className="bg-white rounded-[20px] sm:rounded-[24px] p-3.5 sm:p-6 lg:p-8 shadow-sm border border-gray-100 flex flex-col h-full min-h-[320px] sm:min-h-[380px]">

                                    <h3 className="text-[17px] sm:text-[22px] font-bold text-[#002161]">
                                        {t('applyVisaTypeTitle')}
                                    </h3>

                                    <p className="text-[11px] sm:text-[13px] text-gray-500 mt-0.5 mb-4 sm:mb-5">
                                        {t('applyVisaTypePrompt')}
                                    </p>

                                    {!countryCode ? (

                                        <div className="flex-1 flex flex-col items-center justify-center text-center p-5 sm:p-6 border-2 border-dashed border-gray-200 rounded-[18px] sm:rounded-[20px] bg-gray-50/50">

                                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-full shadow-sm flex items-center justify-center mb-3">
                                                <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-gray-300" />
                                            </div>

                                            <h4 className="text-gray-800 font-bold text-sm mb-1">
                                                {t('applyNoDestination')}
                                            </h4>

                                            <p className="text-xs text-gray-500 max-w-[240px]">
                                                {t('applySelectCountryFirst')}
                                            </p>
                                        </div>

                                    ) : (

                                        <div className="flex flex-col h-full justify-between flex-1">

                                            <div className="space-y-3.5 overflow-y-auto max-h-[440px] pr-1 custom-scrollbar">

                                                {visaTypesLoading &&
                                                    Array.from({ length: 2 }).map(
                                                        (_, i) => (
                                                            <div
                                                                key={i}
                                                                className="h-28 rounded-[20px] bg-gray-50 animate-pulse border border-gray-100"
                                                            />
                                                        )
                                                    )}

                                                {!visaTypesLoading &&
                                                    visaTypes.length === 0 && (
                                                        <div className="p-6 rounded-[20px] border-2 border-dashed border-gray-200 text-xs text-gray-500 text-center bg-gray-50/50">
                                                            {t('applyNoVisaTypes')}
                                                        </div>
                                                    )}

                                                {!visaTypesLoading &&
                                                    visaTypes.map((v) => {
                                                        const isSelected =
                                                            visaTypeId === v.id;

                                                        const localizedVisaName = getVisaName(v);
                                                        const Icon = visaIcon(localizedVisaName);

                                                        return (
                                                            <button
                                                                key={v.id}
                                                                onClick={() =>
                                                                    setVisaTypeId(v.id)
                                                                }
                                                                className={cn(
                                                                    "w-full border-2 rounded-[18px] sm:rounded-[20px] p-3.5 sm:p-5 flex flex-col text-left transition-all",
                                                                    isSelected
                                                                        ? "border-[#0865FE] bg-[#0865FE]/[0.02]"
                                                                        : "border-gray-100 hover:border-blue-200"
                                                                )}
                                                            >
                                                                <div className="flex justify-between items-start w-full gap-2.5">

                                                                    <div className="flex gap-2.5 sm:gap-4 flex-1 min-w-0">

                                                                        <div
                                                                            className={cn(
                                                                                "w-9 h-9 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                                                                                isSelected
                                                                                    ? "bg-[#0865FE] text-white"
                                                                                    : "bg-blue-50 text-[#0865FE]"
                                                                            )}
                                                                        >
                                                                            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                                                                        </div>

                                                                        <div className="flex-1 min-w-0">

                                                                            <h4 className="font-bold text-[#002161] text-[13px] sm:text-base leading-tight">
                                                                                {localizedVisaName} — {t('applyDuration').replace('{days}', String(v.duration))}
                                                                            </h4>

                                                                            <p className="text-[10px] sm:text-[12px] text-gray-500 mt-1 line-clamp-2">
                                                                                {getVisaDescription(v) || t('applyTourismDescription')}
                                                                            </p>

                                                                            <div className="flex flex-wrap gap-1.5 mt-2.5">

                                        <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100">
                                          <CheckCircle2 className="w-3 h-3" />
                                            {t('applyProcessingDelay').replace('{days}', String(v.processingDelay))}
                                        </span>

                                                                                <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                                          <Calendar className="w-3 h-3" />
                                                                                    {t('applyValidity').replace('{days}', String(v.duration))}
                                        </span>

                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div className="text-right flex flex-col items-end justify-between self-stretch shrink-0 min-w-[62px] sm:min-w-[70px]">

                                                                        <div>
                                                                            <div className="text-[#FFB400] font-black text-sm sm:text-lg leading-none">
                                                                                {formatAmount(
                                                                                    Number(v.price)
                                                                                )}
                                                                            </div>

                                                                            <div className="text-gray-400 text-[9px] sm:text-[10px] mt-1 font-medium">
                                                                                {t('applyPerPerson')}
                                                                            </div>
                                                                        </div>

                                                                        <ChevronRight
                                                                            className={cn(
                                                                                "w-4 h-4 transition-colors",
                                                                                isSelected
                                                                                    ? "text-[#0865FE]"
                                                                                    : "text-gray-300"
                                                                            )}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                            </div>

                                            {/* BON A SAVOIR */}

                                            <div className="mt-4 sm:mt-5 bg-yellow-50 rounded-[18px] p-3 sm:p-4 flex items-start gap-3 border border-yellow-500">

                                                <div className="shrink-0 mt-0.5">
                                                    <Lightbulb
                                                        className="w-5 h-5 text-[#0865FE]"
                                                        fill="#FFECB3"
                                                        strokeWidth={1.5}
                                                    />
                                                </div>

                                                <div>
                                                    <div className="font-bold text-[#002161] text-[11px] sm:text-[13px]">
                                                        {t('applyGoodToKnow')}
                                                    </div>

                                                    <div className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                                                        {t('applyEntryPassportTip')}
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ════════════════════════════════════════
                STEP 2 & 3
            ════════════════════════════════════════ */}

                        {(step === 2 || step === 3) && (
                            <div className="bg-white rounded-[20px] sm:rounded-[24px] p-3.5 sm:p-6 lg:p-8 shadow-sm border border-gray-100 max-w-4xl mx-auto">

                                {step === 2 && (
                                    <div className="space-y-5">

                                        <div className="mb-3">
                                            <h3 className="text-xl sm:text-2xl font-bold text-[#002161]">
                                                {t('applyInfoTravelers')}
                                            </h3>

                                            <p className="text-[11px] sm:text-[13px] text-gray-500 mt-0.5">
                                                {t('applyInfoSubtitle')}
                                            </p>
                                        </div>

                                        {/* CONTACT */}

                                        <div className="border border-gray-200 rounded-[20px] overflow-hidden">

                                            <div className="flex flex-col sm:flex-row">

                                                <div className="h-1 sm:h-auto sm:w-1.5 shrink-0 bg-[#0865FE]" />

                                                <div className="flex-1 p-4 sm:p-6 bg-white w-full">

                                                    <div className="flex items-start justify-between gap-3 mb-4">

                                                        <div className="flex items-center gap-3">

                                                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                                                                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-[#0865FE]" />
                                                            </div>

                                                            <div>
                                                                <h4 className="font-bold text-[#002161] text-sm sm:text-base">
                                                                    {t('applyPrimaryContact')}
                                                                </h4>

                                                                <p className="text-[10px] sm:text-xs text-gray-500">
                                                                    {t('applyContactFollowup')}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {infoConfirmed && (
                                                            <button
                                                                onClick={() =>
                                                                    setInfoConfirmed(false)
                                                                }
                                                                className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors shrink-0"
                                                            >
                                                                <Edit2 className="w-3 h-3 text-[#0865FE]" />
                                                                <span className="text-[#0865FE]">
                                  {t('applyEdit')}
                                </span>
                                                            </button>
                                                        )}
                                                    </div>

                                                    {!infoConfirmed ? (

                                                        <div className="space-y-4">

                                                            <div className="grid sm:grid-cols-2 gap-3.5">

                                                                <div className="space-y-1.5">
                                                                    <Label className="text-[12px] font-semibold text-[#002161]">
                                                                        {t('applyEmail')} *
                                                                    </Label>

                                                                    <div className="relative">
                                                                        <input
                                                                            type="email"
                                                                            value={email}
                                                                            onChange={(e) =>
                                                                                setEmail(
                                                                                    e.target.value
                                                                                )
                                                                            }
                                                                            placeholder="exemple@email.com"
                                                                            className="w-full h-11 rounded-xl border border-gray-200 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#0865FE]/20 focus:border-[#0865FE]"
                                                                        />

                                                                        <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-1.5">
                                                                    <Label className="text-[12px] font-semibold text-[#002161]">
                                                                        {t('applyPhone')} *
                                                                    </Label>

                                                                    <div className="flex gap-2">

                                                                        <div className="flex items-center gap-1.5 px-3 h-11 rounded-xl border border-gray-200 bg-gray-50 shrink-0">
                                                                            <img
                                                                                src="https://flagcdn.com/w40/dz.png"
                                                                                alt="DZ"
                                                                                className="w-4 h-3 rounded-sm object-cover shadow-sm"
                                                                            />

                                                                            <span className="text-[12px] font-bold text-gray-700">
                                        +213
                                      </span>
                                                                        </div>

                                                                        <div className="relative flex-1">
                                                                            <input
                                                                                value={phone}
                                                                                onChange={(e) =>
                                                                                    setPhone(
                                                                                        e.target.value
                                                                                    )
                                                                                }
                                                                                placeholder="5 XX XX XX XX"
                                                                                className="w-full h-11 rounded-xl border border-gray-200 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#0865FE]/20 focus:border-[#0865FE]"
                                                                            />

                                                                            <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-1.5">
                                                                    <Label className="text-[12px] font-semibold text-[#002161]">
                                                                        {t('applyEstimatedDeparture')} *
                                                                    </Label>

                                                                    <div className="relative">
                                                                        <input
                                                                            type="date"
                                                                            value={startDate}
                                                                            onChange={(e) =>
                                                                                setStartDate(
                                                                                    e.target.value
                                                                                )
                                                                            }
                                                                            min={todayLocal}
                                                                            className="w-full h-11 rounded-xl border border-gray-200 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#0865FE]/20 focus:border-[#0865FE] text-gray-700"
                                                                        />

                                                                        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-1.5">
                                                                    <Label className="text-[12px] font-semibold text-[#002161]">
                                                                        {t('applyNumberTravelers')} *
                                                                    </Label>

                                                                    <div className="flex items-center justify-between sm:justify-start gap-3 h-11 p-1 bg-gray-50 rounded-xl border border-gray-200 w-full sm:w-max">

                                                                        <button
                                                                            onClick={() =>
                                                                                syncPassengers(
                                                                                    Math.max(
                                                                                        1,
                                                                                        numberOfPeople - 1
                                                                                    )
                                                                                )
                                                                            }
                                                                            disabled={
                                                                                numberOfPeople <= 1
                                                                            }
                                                                            className="w-9 h-full sm:w-9 sm:h-9 rounded-lg bg-white shadow-sm border border-gray-100 flex items-center justify-center text-[#0865FE] font-bold text-lg disabled:opacity-40"
                                                                        >
                                                                            −
                                                                        </button>

                                                                        <span className="w-8 text-center text-base font-bold text-[#002161]">
                                      {numberOfPeople}
                                    </span>

                                                                        <button
                                                                            onClick={() =>
                                                                                syncPassengers(
                                                                                    Math.min(
                                                                                        8,
                                                                                        numberOfPeople + 1
                                                                                    )
                                                                                )
                                                                            }
                                                                            disabled={
                                                                                numberOfPeople >= 8
                                                                            }
                                                                            className="w-9 h-full sm:w-9 sm:h-9 rounded-lg bg-[#0865FE] shadow-sm flex items-center justify-center text-white font-bold text-lg disabled:opacity-40"
                                                                        >
                                                                            +
                                                                        </button>

                                                                    </div>
                                                                </div>

                                                            </div>

                                                            <div className="flex justify-end pt-1">

                                                                <Button
                                                                    onClick={() => {
                                                                        if (
                                                                            !email ||
                                                                            !phone ||
                                                                            !startDate
                                                                        ) {
                                                                            toast({
                                                                                title:
                                                                                    t('applyToastMissingFields'),
                                                                                description:
                                                                                    t('applyToastCompleteFields'),
                                                                                variant:
                                                                                    'destructive',
                                                                            });

                                                                            return;
                                                                        }

                                                                        setInfoConfirmed(true);

                                                                        setExpandedPax(
                                                                            passengers[0]?.id ||
                                                                            null
                                                                        );
                                                                    }}
                                                                    className="w-full sm:w-auto text-white font-bold rounded-full px-7 h-11 bg-[#0865FE] hover:bg-blue-700"
                                                                >
                                                                    {t('applyConfirmContact')}
                                                                    <Check className="w-4 h-4 ml-2" />
                                                                </Button>

                                                            </div>
                                                        </div>

                                                    ) : (

                                                        <div className="flex flex-wrap items-center gap-3 text-[12px] text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">

                              <span className="flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5 text-[#0865FE]" />
                                <span className="font-semibold text-[#002161] truncate">
                                  {email}
                                </span>
                              </span>

                                                            <span className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-[#0865FE]" />
                                <span className="font-semibold text-[#002161]">
                                  +213 {phone}
                                </span>
                              </span>

                                                            <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-[#0865FE]" />
                                <span>
                                  {t('applyDeparture')}{' '}
                                    <strong>
                                    {formatDate(
                                        startDate
                                    )}
                                  </strong>
                                </span>
                              </span>

                                                            <span className="flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-[#0865FE]" />
                                <span>
                                  {numberOfPeople} {t('applyPersonsShort')}
                                </span>
                              </span>

                                                        </div>
                                                    )}

                                                </div>
                                            </div>
                                        </div>

                                        {/* PASSENGERS */}

                                        <div
                                            className={cn(
                                                "transition-all duration-300",
                                                !infoConfirmed &&
                                                "opacity-40 pointer-events-none"
                                            )}
                                        >

                                            <div className="flex items-center justify-between mb-3.5">

                                                <h4 className="text-base sm:text-lg font-bold text-[#002161] flex items-center gap-2">
                                                    {t('applyTravelerDetails')}

                                                    {passengers.every(
                                                            paxComplete
                                                        ) &&
                                                        passengers.every((p) =>
                                                            paxDocsOk(p.id)
                                                        ) &&
                                                        infoConfirmed && (
                                                            <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center ml-1">
                                                                <Check
                                                                    className="w-2.5 h-2.5 text-white"
                                                                    strokeWidth={3}
                                                                />
                                                            </div>
                                                        )}
                                                </h4>

                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={addPax}
                                                    className="rounded-full text-[12px] font-semibold h-8 px-3 border-gray-200 hover:border-[#0865FE] hover:text-[#0865FE]"
                                                >
                                                    <Plus className="w-3.5 h-3.5 mr-1" />
                                                    {t('applyAddTraveler')}
                                                </Button>
                                            </div>

                                            <div className="space-y-3">

                                                {passengers.map((p, i) => {

                                                    const initials =
                                                        `${(
                                                            p.firstName ||
                                                            `V${i + 1}`
                                                        ).charAt(0)}${(
                                                            p.lastName || ''
                                                        ).charAt(0)}`.toUpperCase();

                                                    const complete =
                                                        paxComplete(p);

                                                    const docsDone =
                                                        paxDocsOk(p.id);

                                                    const expanded =
                                                        expandedPax === p.id;

                                                    const reqCount =
                                                        selectedVisa?.documentRequirements?.filter(
                                                            (
                                                                r: VisaTypeDocumentRequirement
                                                            ) => r.isRequired
                                                        ).length ?? 0;

                                                    const statusOk =
                                                        complete && docsDone;

                                                    return (
                                                        <div
                                                            key={p.id}
                                                            className="rounded-[18px] border bg-white shadow-sm overflow-hidden transition-all"
                                                            style={{
                                                                borderColor: statusOk
                                                                    ? '#10B981'
                                                                    : expanded
                                                                        ? '#0865FE'
                                                                        : '#E5E7EB',
                                                            }}
                                                        >

                                                            <div
                                                                className={cn(
                                                                    "flex items-center justify-between gap-3 p-3.5 cursor-pointer transition-colors hover:bg-gray-50",
                                                                    expanded &&
                                                                    "bg-blue-50/30"
                                                                )}
                                                                onClick={() =>
                                                                    setExpandedPax(
                                                                        expanded
                                                                            ? null
                                                                            : p.id
                                                                    )
                                                                }
                                                            >

                                                                <div className="flex items-center gap-3 min-w-0">

                                                                    <div
                                                                        className={cn(
                                                                            "w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0",
                                                                            statusOk
                                                                                ? "bg-emerald-500"
                                                                                : "bg-[#0865FE]"
                                                                        )}
                                                                    >
                                                                        {statusOk ? (
                                                                            <Check
                                                                                className="w-4 h-4"
                                                                                strokeWidth={2.5}
                                                                            />
                                                                        ) : (
                                                                            initials
                                                                        )}
                                                                    </div>

                                                                    <div className="min-w-0">

                                                                        <p className="font-bold text-[13px] sm:text-[14px] text-[#002161] truncate">
                                                                            {p.firstName
                                                                                ? `${p.firstName} ${p.lastName}`
                                                                                : t('applyTravelerNumber').replace('{number}', String(i + 1))}
                                                                        </p>

                                                                        <div className="flex items-center gap-2 mt-0.5">

                                      <span
                                          className={cn(
                                              "text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0",
                                              statusOk
                                                  ? "bg-emerald-50 text-emerald-700"
                                                  : "bg-amber-50 text-amber-700"
                                          )}
                                      >
                                        {statusOk
                                            ? t('applyFileComplete')
                                            : t('applyToComplete')}
                                      </span>

                                                                            {!statusOk && (
                                                                                <span className="text-[10px] text-gray-500">
                                                                                    {t('applyDocumentCount')
                                                                                        .replace('{uploaded}', String(fileCount(p.id)))
                                                                                        .replace('{required}', String(reqCount))}
                                        </span>
                                                                            )}

                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-2 shrink-0">
                                                                    <ChevronRight
                                                                        className={cn(
                                                                            'w-4 h-4 text-gray-400 transition-transform duration-300',
                                                                            expanded &&
                                                                            'rotate-90 text-[#0865FE]'
                                                                        )}
                                                                    />
                                                                </div>

                                                            </div>

                                                            {expanded && (
                                                                <div className="border-t border-gray-100 px-4 pb-5 pt-3.5 space-y-4">

                                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">

                                                                        <Button
                                                                            type="button"
                                                                            size="sm"
                                                                            onClick={() =>
                                                                                setScannerOpenFor(
                                                                                    p.id
                                                                                )
                                                                            }
                                                                            className="w-full sm:w-auto rounded-full text-[12px] h-8 px-3.5 font-bold bg-gray-900 text-white hover:bg-gray-800"
                                                                        >
                                                                            <ScanLine className="w-3.5 h-3.5 mr-1.5" />
                                                                            {t('applyScanPassport')}
                                                                        </Button>

                                                                        {passengers.length >
                                                                            1 && (
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    onClick={() =>
                                                                                        removePax(
                                                                                            p.id
                                                                                        )
                                                                                    }
                                                                                    className="w-full sm:w-auto text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full h-8 px-3 text-xs font-semibold"
                                                                                >
                                                                                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                                                                                    {t('applyRemoveTraveler')}
                                                                                </Button>
                                                                            )}
                                                                    </div>

                                                                    {autofilled[p.id]
                                                                        ?.size ? (
                                                                        <div className="flex items-start gap-2 p-2.5 rounded-xl text-[12px] bg-emerald-50 border border-emerald-100 text-emerald-800 font-medium">
                                                                            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                                                                            <span>
                                                                                {t('mrzAutofillDetails')} {t('mrzManualFields')}
                                                                            </span>
                                                                        </div>
                                                                    ) : null}

                                                                    <div className="grid sm:grid-cols-2 gap-3">

                                                                        {([
                                                                            {
                                                                                label: `${t('applyFirstName')} *`,
                                                                                field: 'firstName',
                                                                                type: 'text',
                                                                                placeholder:
                                                                                    t('applyFirstNameExample'),
                                                                            },
                                                                            {
                                                                                label: `${t('applyLastName')} *`,
                                                                                field: 'lastName',
                                                                                type: 'text',
                                                                                placeholder:
                                                                                    t('applyLastNameExample'),
                                                                            },
                                                                            {
                                                                                label:
                                                                                    `${t('applyBirthDate')} *`,
                                                                                field: 'birthDate',
                                                                                type: 'date',
                                                                                placeholder:
                                                                                    t('applyDatePlaceholder'),
                                                                            },
                                                                            {
                                                                                label:
                                                                                    `${t('applyBirthPlace')} *`,
                                                                                field: 'birthPlace',
                                                                                type: 'text',
                                                                                placeholder:
                                                                                    t('applyBirthPlacePlaceholder'),
                                                                            },
                                                                            {
                                                                                label:
                                                                                    `${t('applyNationality')} *`,
                                                                                field: 'nationality',
                                                                                type: 'text',
                                                                                placeholder:
                                                                                    t('applyNationalityPlaceholder'),
                                                                            },
                                                                            {
                                                                                label:
                                                                                    `${t('applyPassportNumber')} *`,
                                                                                field:
                                                                                    'passportNumber',
                                                                                type: 'text',
                                                                                placeholder:
                                                                                    t('applyPassportExample'),
                                                                            },
                                                                            {
                                                                                label:
                                                                                    `${t('applyPassportIssueDate')} *`,
                                                                                field:
                                                                                    'passportIssueDate',
                                                                                type: 'date',
                                                                                placeholder:
                                                                                    t('applyDatePlaceholder'),
                                                                            },
                                                                            {
                                                                                label:
                                                                                    `${t('applyPassportExpiryDate')} *`,
                                                                                field:
                                                                                    'passportExpiryDate',
                                                                                type: 'date',
                                                                                placeholder:
                                                                                    t('applyDatePlaceholder'),
                                                                            },
                                                                        ] as const).map(
                                                                            ({
                                                                                 label,
                                                                                 field,
                                                                                 type,
                                                                                 placeholder,
                                                                             }: any) => (
                                                                                <div
                                                                                    key={field}
                                                                                    className="space-y-1"
                                                                                >
                                                                                    <Label className="text-[11px] font-semibold text-[#002161]">
                                                                                        {label}
                                                                                    </Label>

                                                                                    <input
                                                                                        type={type}
                                                                                        value={
                                                                                            (p as any)[
                                                                                                field
                                                                                                ] ?? ''
                                                                                        }
                                                                                        placeholder={
                                                                                            placeholder
                                                                                        }
                                                                                        onChange={(
                                                                                            e
                                                                                        ) =>
                                                                                            updatePax(
                                                                                                p.id,
                                                                                                {
                                                                                                    [field]:
                                                                                                    e.target
                                                                                                        .value,
                                                                                                }
                                                                                            )
                                                                                        }
                                                                                        className={cn(
                                                                                            'w-full h-10 rounded-xl border px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0865FE]/20 focus:border-[#0865FE]',
                                                                                            isAutofilled(
                                                                                                p.id,
                                                                                                field
                                                                                            )
                                                                                                ? 'border-emerald-300 bg-emerald-50/50'
                                                                                                : 'border-gray-200'
                                                                                        )}
                                                                                    />
                                                                                </div>
                                                                            )
                                                                        )}

                                                                        <div className="sm:col-span-2 space-y-1">

                                                                            <Label className="text-[11px] font-semibold text-[#002161]">
                                                                                {t('applyTravelerEmail')} ({t('applyOptional')})
                                                                            </Label>

                                                                            <input
                                                                                type="email"
                                                                                value={
                                                                                    p.email ?? ''
                                                                                }
                                                                                placeholder={t('applyNotificationsPlaceholder')}
                                                                                onChange={(e) =>
                                                                                    updatePax(
                                                                                        p.id,
                                                                                        {
                                                                                            email:
                                                                                            e.target
                                                                                                .value,
                                                                                        }
                                                                                    )
                                                                                }
                                                                                className="w-full h-10 rounded-xl border border-gray-200 px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0865FE]/20 focus:border-[#0865FE]"
                                                                            />

                                                                        </div>
                                                                    </div>

                                                                    {/* DOCUMENTS */}

                                                                    {selectedVisa && (
                                                                        <div className="mt-3 pt-3 border-t border-gray-100">

                                                                            <div className="flex items-center justify-between mb-3">

                                                                                <h5 className="font-bold text-[13px] text-[#002161]">
                                                                                    {t('applyRequiredDocuments')}
                                                                                </h5>

                                                                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-[#0865FE]">
                                          {fileCount(
                                              p.id
                                          )}{' '}
                                                                                    / {reqCount}
                                        </span>
                                                                            </div>

                                                                            <div className="grid sm:grid-cols-2 gap-2.5">

                                                                                {(
                                                                                    selectedVisa.documentRequirements ??
                                                                                    []
                                                                                ).map(
                                                                                    (
                                                                                        req: VisaTypeDocumentRequirement
                                                                                    ) => {
                                                                                        const label =
                                                                                            req
                                                                                                .documentType
                                                                                                ? getDocumentLabel(req) :
                                                                                            req.id;

                                                                                        const file =
                                                                                            getFile(
                                                                                                p.id,
                                                                                                req.id
                                                                                            );

                                                                                        const pk = `${p.id}:${req.id}`;

                                                                                        return (
                                                                                            <div
                                                                                                key={
                                                                                                    req.id
                                                                                                }
                                                                                                onDragOver={(
                                                                                                    e
                                                                                                ) => {
                                                                                                    e.preventDefault();
                                                                                                    setDragOver(
                                                                                                        pk
                                                                                                    );
                                                                                                }}
                                                                                                onDragLeave={() =>
                                                                                                    setDragOver(
                                                                                                        null
                                                                                                    )
                                                                                                }
                                                                                                onDrop={(
                                                                                                    e
                                                                                                ) => {
                                                                                                    e.preventDefault();
                                                                                                    setDragOver(
                                                                                                        null
                                                                                                    );

                                                                                                    const dropped =
                                                                                                        e
                                                                                                            .dataTransfer
                                                                                                            .files?.[0];

                                                                                                    if (
                                                                                                        !dropped
                                                                                                    )
                                                                                                        return;

                                                                                                    setFiles(
                                                                                                        (
                                                                                                            prev
                                                                                                        ) => ({
                                                                                                            ...prev,
                                                                                                            [p.id]:
                                                                                                                {
                                                                                                                    ...(prev[
                                                                                                                            p
                                                                                                                                .id
                                                                                                                            ] ??
                                                                                                                        {}),
                                                                                                                    [req.id]:
                                                                                                                    dropped,
                                                                                                                },
                                                                                                        })
                                                                                                    );

                                                                                                    toast({
                                                                                                        title:
                                                                                                            t('applyToastFileAdded'),
                                                                                                        description:
                                                                                                        dropped.name,
                                                                                                    });
                                                                                                }}
                                                                                                className="flex flex-col gap-2.5 p-3 rounded-xl border border-dashed transition-all"
                                                                                                style={{
                                                                                                    borderColor:
                                                                                                        file
                                                                                                            ? '#10B981'
                                                                                                            : dragOver ===
                                                                                                            pk
                                                                                                                ? '#0865FE'
                                                                                                                : '#CBD5E1',
                                                                                                    background:
                                                                                                        file
                                                                                                            ? '#ECFDF5'
                                                                                                            : '#FAFAFA',
                                                                                                }}
                                                                                            >

                                                                                                <div className="flex items-start justify-between gap-2">

                                                                                                    <div className="flex-1 min-w-0">

                                                                                                        <p className="font-semibold text-[12px] text-[#002161] leading-tight mb-0.5 break-words">
                                                                                                            {label}

                                                                                                            {!req.isRequired && (
                                                                                                                <span className="ml-1 font-normal text-gray-400">
                                                          ({t('applyOptional')})
                                                        </span>
                                                                                                            )}
                                                                                                        </p>

                                                                                                        <p
                                                                                                            className="text-[10px] text-gray-500 truncate"
                                                                                                            title={
                                                                                                                file
                                                                                                                    ? file.name
                                                                                                                    : ''
                                                                                                            }
                                                                                                        >
                                                                                                            {file
                                                                                                                ? file.name
                                                                                                                : t('applyFileFormat')}
                                                                                                        </p>
                                                                                                    </div>

                                                                                                    <div className="shrink-0">
                                                                                                        {file ? (
                                                                                                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                                                                        ) : (
                                                                                                            <FileText className="w-4 h-4 text-gray-300" />
                                                                                                        )}
                                                                                                    </div>
                                                                                                </div>

                                                                                                <Button
                                                                                                    size="sm"
                                                                                                    onClick={() =>
                                                                                                        handleFileSelect(
                                                                                                            p.id,
                                                                                                            req.id
                                                                                                        )
                                                                                                    }
                                                                                                    variant={
                                                                                                        file
                                                                                                            ? 'outline'
                                                                                                            : 'secondary'
                                                                                                    }
                                                                                                    className={cn(
                                                                                                        'w-full rounded-xl text-[11px] h-8 font-semibold',
                                                                                                        file
                                                                                                            ? 'border-emerald-200 text-emerald-700 bg-white hover:bg-emerald-50'
                                                                                                            : 'bg-white border-gray-200 text-gray-700'
                                                                                                    )}
                                                                                                >
                                                                                                    <Upload className="w-3 h-3 mr-1.5" />

                                                                                                    {file
                                                                                                        ? t('applyReplace')
                                                                                                        : t('applyUpload')}
                                                                                                </Button>

                                                                                            </div>
                                                                                        );
                                                                                    }
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ════════════════════════════════════════
                    STEP 3 PAYMENT
                ════════════════════════════════════════ */}

                                {step === 3 && selectedVisa && (
                                    <div className="space-y-5">

                                        <div className="mb-3 text-center">
                                            <h3 className="text-xl sm:text-2xl font-bold text-[#002161]">
                                                {t('applyPaymentTitle')}
                                            </h3>

                                            <p className="text-[11px] sm:text-[13px] text-gray-500 mt-0.5">
                                                {t('applyPaymentSubtitle')}
                                            </p>
                                        </div>

                                        <div className="grid lg:grid-cols-2 gap-5">

                                            {/* RECAP */}

                                            <div className="bg-gray-50 rounded-[20px] p-4 sm:p-5 border border-gray-100 flex flex-col">

                                                <div className="flex items-center justify-between mb-4">

                                                    <h4 className="font-bold text-[#002161] text-sm sm:text-base">
                                                        {t('applyTripSummary')}
                                                    </h4>

                                                    <button
                                                        onClick={() =>
                                                            setStep(1)
                                                        }
                                                        className="text-[11px] font-semibold text-[#0865FE] hover:underline"
                                                    >
                                                        {t('applyEdit')}
                                                    </button>
                                                </div>

                                                <div className="flex items-center gap-3 mb-4">

                                                    {country && (
                                                        <div className="w-12 h-12 rounded-full border-2 border-white shadow-sm overflow-hidden shrink-0">
                                                            <img
                                                                src={country.flagUrl}
                                                                alt=""
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                    )}

                                                    <div>
                                                        <p className="font-bold text-[#002161] text-base leading-tight">
                                                            {getCountryName(country)}
                                                        </p>

                                                        <p className="text-[12px] text-gray-500 font-medium">
                                                            {getVisaName(selectedVisa)}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="space-y-2.5 flex-1">

                                                    {[
                                                        {
                                                            label: t('applyTravelers'),
                                                            value: t('applyPeopleCount').replace('{count}', String(numberOfPeople)),
                                                        },
                                                        {
                                                            label: t('applyTravelDate'),
                                                            value:
                                                                formatDate(
                                                                    startDate
                                                                ),
                                                        },
                                                        {
                                                            label: t('applyValidityLabel'),
                                                            value: t('applyValidity').replace('{days}', String(selectedVisa.duration)),
                                                        },
                                                        {
                                                            label: t('applyAverageDelay'),
                                                            value: t('applyProcessingDelay').replace('{days}', String(selectedVisa.processingDelay)),
                                                        },
                                                    ].map((item, i) => (
                                                        <div
                                                            key={i}
                                                            className="flex items-center justify-between py-1.5 border-b border-gray-200/60 last:border-0"
                                                        >
                              <span className="text-[12px] text-gray-500">
                                {item.label}
                              </span>

                                                            <span className="text-[12px] font-semibold text-[#002161]">
                                {item.value}
                              </span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="mt-4 pt-3 border-t border-gray-200">

                                                    <div className="flex items-end justify-between">

                            <span className="text-xs sm:text-sm font-bold text-gray-800">
                              {t('applyTotal')}
                            </span>

                                                        <span className="text-xl sm:text-2xl font-black text-[#FFB400]">
                              {formatAmount(
                                  totalPrice
                              )}
                            </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* PAYMENT OPTIONS */}

                                            <div className="flex flex-col gap-3.5">

                                                <h4 className="font-bold text-[#002161] text-sm sm:text-base">
                                                    {t('applyPaymentMethod')}
                                                </h4>

                                                <button
                                                    onClick={() =>
                                                        setPaymentMethod('satim')
                                                    }
                                                    className={cn(
                                                        "flex flex-col gap-2.5 p-4 rounded-[18px] border-2 text-left transition-all relative overflow-hidden",
                                                        paymentMethod === 'satim'
                                                            ? "border-[#0865FE] bg-blue-50/20"
                                                            : "border-gray-200 hover:border-[#0865FE]/50"
                                                    )}
                                                >

                                                    {paymentMethod ===
                                                        'satim' && (
                                                            <div className="absolute top-0 right-0 w-14 h-14 bg-blue-100/50 rounded-bl-full -z-10" />
                                                        )}

                                                    <div className="flex items-center justify-between w-full">

                                                        <img
                                                            src="/dhahabiaCIB.png"
                                                            alt="CIB"
                                                            className="h-7 object-contain mix-blend-multiply"
                                                        />

                                                        <div
                                                            className={cn(
                                                                'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                                                                paymentMethod ===
                                                                'satim'
                                                                    ? 'border-[#0865FE]'
                                                                    : 'border-gray-300'
                                                            )}
                                                        >
                                                            {paymentMethod ===
                                                                'satim' && (
                                                                    <div className="w-2 h-2 rounded-full bg-[#0865FE]" />
                                                                )}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <p className="font-bold text-[13px] text-[#002161]">
                                                            CIB / EDAHABIA
                                                        </p>

                                                        <p className="text-[11px] text-gray-500">
                                                            {t('applySatimDescription')}
                                                        </p>
                                                    </div>
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        setPaymentMethod('agence')
                                                    }
                                                    className={cn(
                                                        "flex flex-col gap-2.5 p-4 rounded-[18px] border-2 text-left transition-all relative overflow-hidden",
                                                        paymentMethod ===
                                                        'agence'
                                                            ? "border-[#0865FE] bg-blue-50/20"
                                                            : "border-gray-200 hover:border-[#0865FE]/50"
                                                    )}
                                                >

                                                    {paymentMethod ===
                                                        'agence' && (
                                                            <div className="absolute top-0 right-0 w-14 h-14 bg-blue-100/50 rounded-bl-full -z-10" />
                                                        )}

                                                    <div className="flex items-center justify-between w-full">

                                                        <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600">
                                                            <Briefcase className="w-4 h-4" />
                                                        </div>

                                                        <div
                                                            className={cn(
                                                                'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                                                                paymentMethod ===
                                                                'agence'
                                                                    ? 'border-[#0865FE]'
                                                                    : 'border-gray-300'
                                                            )}
                                                        >
                                                            {paymentMethod ===
                                                                'agence' && (
                                                                    <div className="w-2 h-2 rounded-full bg-[#0865FE]" />
                                                                )}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <p className="font-bold text-[13px] text-[#002161]">
                                                            {t('applyAgencyPayment')}
                                                        </p>

                                                        <p className="text-[11px] text-gray-500">
                                                            {t('applyAgencyDescription')}
                                                        </p>
                                                    </div>
                                                </button>

                                                <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
                                                    <label className="flex items-start gap-2.5 text-xs leading-relaxed text-gray-700">
                                                        <input
                                                            type="checkbox"
                                                            checked={cancellationPolicyAccepted}
                                                            onChange={(event) => setCancellationPolicyAccepted(event.target.checked)}
                                                            className="mt-0.5 h-4 w-4 shrink-0 accent-[#0865FE]"
                                                        />
                                                        <span>
                                                            {t('applyAcceptCancellationLead')}
                                                            <a href="/cancellation" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#0865FE] underline underline-offset-2">
                                                                {t('applyCancellationPolicyLink')}
                                                            </a>.
                                                        </span>
                                                    </label>
                                                    <label className="flex items-start gap-2.5 text-xs leading-relaxed text-gray-700">
                                                        <input
                                                            type="checkbox"
                                                            checked={informationAccuracyAccepted}
                                                            onChange={(event) => setInformationAccuracyAccepted(event.target.checked)}
                                                            className="mt-0.5 h-4 w-4 shrink-0 accent-[#0865FE]"
                                                        />
                                                        <span>{t('applyAccuracyConsent')}</span>
                                                    </label>
                                                    <label className="flex items-start gap-2.5 text-xs leading-relaxed text-gray-700">
                                                        <input
                                                            type="checkbox"
                                                            checked={visaDecisionAccepted}
                                                            onChange={(event) => setVisaDecisionAccepted(event.target.checked)}
                                                            className="mt-0.5 h-4 w-4 shrink-0 accent-[#0865FE]"
                                                        />
                                                        <span>{t('applyVisaDecisionConsent')}</span>
                                                    </label>
                                                </div>

                                                {paymentMethod === 'agence' && (
                                                    <div className="min-w-0 w-full space-y-2 pt-1">
                                                        <label htmlFor="apply-office" className="block text-xs leading-relaxed font-semibold text-[#002161]">
                                                            {t('applyChooseOffice')}
                                                        </label>
                                                        <select
                                                            id="apply-office"
                                                            value={selectedOfficeId}
                                                            onChange={(event) => setSelectedOfficeId(event.target.value)}
                                                            className="block box-border min-w-0 max-w-full w-full truncate rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700 focus:border-[#0865FE] focus:outline-none focus:ring-2 focus:ring-[#0865FE]/20"
                                                        >
                                                            <option value="">{t('applySelectOffice')}</option>
                                                            {offices.map((office) => (
                                                                <option key={office.id} value={office.id}>
                                                                    {office.name} · {office.wilaya}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        {officesLoading && <p className="text-xs text-amber-600">{t('applyLoadingOffices')}</p>}
                                                        {!officesLoading && !offices.length && <p className="text-xs text-amber-600">{t('applyNoOffices')}</p>}
                                                    </div>
                                                )}

                                                {paymentMethod ===
                                                    'satim' && (
                                                        <div className="mt-1 space-y-2.5">

                                                            <label className="flex items-start gap-2.5 cursor-pointer p-2.5 rounded-xl bg-gray-50 border border-gray-100">

                                                                <input
                                                                    type="checkbox"
                                                                    checked={
                                                                        termsAccepted
                                                                    }
                                                                    onChange={(e) =>
                                                                        setTermsAccepted(
                                                                            e.target.checked
                                                                        )
                                                                    }
                                                                    className="mt-0.5 w-4 h-4 accent-[#0865FE] rounded shrink-0"
                                                                />

                                                                <span className="text-[11px] text-gray-600 leading-snug">
                                {t('applyAcceptTerms')}{' '}
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            setShowConditions(
                                                                                true
                                                                            );
                                                                        }}
                                                                        className="font-bold text-[#0865FE] hover:underline"
                                                                    >
                                                                    {t('applyTermsOfUse')}
                                </button>
                                                                {t('applyTermsPeriod')}
                              </span>

                                                            </label>

                                                            <div className="flex justify-center scale-75 origin-left overflow-hidden">
                                                                <div ref={recaptchaRef} />
                                                            </div>
                                                        </div>
                                                    )}
                                            </div>
                                        </div>

                                        {/* CONDITIONS MODAL */}

                                        {showConditions && (
                                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#002161]/50 backdrop-blur-sm px-4">

                                                <div className="bg-white rounded-[24px] shadow-2xl max-w-lg w-full p-5 space-y-3">

                                                    <div className="flex items-center justify-between">

                                                        <h2 className="text-lg font-bold text-[#002161]">
                                                            {t('applyTermsTitle')}
                                                        </h2>

                                                        <button
                                                            onClick={() =>
                                                                setShowConditions(
                                                                    false
                                                                )
                                                            }
                                                            className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200"
                                                        >
                                                            <X className="w-4 h-4 text-gray-600" />
                                                        </button>
                                                    </div>

                                                    <div className="text-[12px] text-gray-600 leading-relaxed space-y-2.5 max-h-60 overflow-y-auto pr-2 custom-scrollbar">

                                                        <p>
                                                            {t('applyTermsPayment')}
                                                        </p>

                                                        <p>
                                                            {t('applyTermsSecurity')}
                                                        </p>
                                                    </div>

                                                    <div className="flex justify-end pt-1">

                                                        <Button
                                                            onClick={() => {
                                                                setTermsAccepted(
                                                                    true
                                                                );
                                                                setShowConditions(
                                                                    false
                                                                );
                                                            }}
                                                            className="text-white font-bold rounded-full px-6 h-9 bg-[#0865FE] hover:bg-blue-700 text-xs"
                                                        >
                                                            {t('applyAcceptClose')}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* ─────────────────────────────────────────────
            FOOTER NAVIGATION
        ───────────────────────────────────────────── */}

                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-5 sm:mt-6 max-w-4xl mx-auto px-0.5 sm:px-1">

                    <Button
                        variant="outline"
                        onClick={back}
                        className="rounded-full px-5 h-11 font-bold text-gray-600 border-gray-200 hover:bg-gray-50 bg-white shadow-sm w-full sm:w-auto text-xs sm:text-sm"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />

                        {t('applyBack')}
                        {step === 1
                            ? ` ${t('applyHome')}`
                            : ''}
                    </Button>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">

                        {step === 2 && (
                            <Button
                                variant="ghost"
                                onClick={save}
                                className="rounded-full px-4 h-11 font-semibold text-gray-500 hover:bg-white w-full sm:w-auto text-xs sm:text-sm"
                            >
                                {t('applySaveDraft')}
                            </Button>
                        )}

                        {step < 3 ? (

                            <Button
                                onClick={next}
                                disabled={
                                    !canNext || submitting
                                }
                                className="text-white font-bold rounded-full px-7 h-11 shadow-md shadow-[#0865FE]/30 bg-[#0865FE] hover:bg-blue-700 disabled:opacity-50 transition-all w-full sm:w-auto text-xs sm:text-sm"
                            >
                                {submitting ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : null}

                                {t('applyContinue')}

                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>

                        ) : (

                            paymentMethod === 'satim' ? (

                                <Button
                                    onClick={handlePaySatim}
                                    disabled={
                                        submitting ||
                                        !termsAccepted ||
                                        !allRequiredConsentsAccepted
                                    }
                                    className="text-white font-bold rounded-full px-6 h-11 shadow-md shadow-[#0865FE]/30 bg-[#0865FE] hover:bg-blue-700 disabled:opacity-50 transition-all w-full sm:w-auto text-xs sm:text-sm"
                                >
                                    {submitting ? (
                                        <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                                    ) : (
                                        <Lock className="w-4 h-4 mr-1.5 opacity-80" />
                                    )}

                                    {submitting
                                        ? t('applyRedirecting')
                                        : t('applyPayNow')}
                                </Button>

                            ) : (

                                <Button
                                    onClick={handlePayAgence}
                                    disabled={submitting || !selectedOfficeId || !allRequiredConsentsAccepted}
                                    className="text-white font-bold rounded-full px-6 h-11 shadow-md shadow-[#0865FE]/30 bg-[#0865FE] hover:bg-blue-700 disabled:opacity-50 transition-all w-full sm:w-auto text-xs sm:text-sm"
                                >
                                    {submitting ? (
                                        <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                                    ) : (
                                        <Check className="w-4 h-4 mr-1.5 opacity-80" />
                                    )}

                                    {submitting
                                        ? t('applySaving')
                                        : t('applyConfirmApplication')}
                                </Button>
                            )
                        )}
                    </div>
                </div>
            </div>

            <PassportScanner
                open={!!scannerOpenFor}
                onOpenChange={(o) => {
                    if (!o) setScannerOpenFor(null);
                }}
                onResult={(data) => {
                    if (scannerOpenFor) {
                        applyMrz(scannerOpenFor, data);
                    }
                }}
            />

            <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E2E8F0;
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #CBD5E1;
        }

        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }

        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        /* Prevent accidental horizontal page overflow on mobile */
        html,
        body {
          max-width: 100%;
          overflow-x: hidden;
        }

        /* Better touch scrolling for horizontal destination carousels */
        .touch-pan-x {
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
        }

        /* Keep mobile cards inside the viewport */
        @media (max-width: 639px) {
          * {
            min-width: 0;
          }

          input,
          button,
          select,
          textarea {
            max-width: 100%;
          }
        }
      `}</style>
        </div>
    );
};

export default Apply;