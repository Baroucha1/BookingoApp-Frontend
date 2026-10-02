import { ArrowLeftRight, Search, Users, Check, Luggage, Zap, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PassengerClassSelector from '@/components/flights/PassengerClassSelector';
import AllDestinationsModal from '@/components/flights/AllDestinationModal';
import {
    AirportInput, DateRangePicker, Chip, TripTypeToggle,
    useAggregatedSearchFormState, SingleDatePicker,
} from './SearchFormShared';
import type { AggregatedSearchParams } from '@/service/flights_aggregator/aggregatedTypes';
import { useLanguage } from '@/i18n/LanguageContext';
import { cn } from '@/lib/utils';

const flightTexts = {
    fr: {
        from: "Départ",
        to: "Destination",
        fromPlaceholder: "D'où partez-vous?",
        toPlaceholder: "Où allez-vous?",
        dates: "Dates",
        date: "Date",
        passengersClass: "Passagers / Classe",
        passengers: "passager",
        passengersPlural: "passagers",
        baggage: "Bagages",
        direct: "Direct",
        flexible: "Flexible",
        search: "Rechercher",
        searching: "Recherche...",
        addFlight: "Ajouter un vol",
        destWarning: "Destination peut-être non disponible.",
        originRequired: "Aéroport de départ obligatoire",
        destRequired: "Aéroport de destination obligatoire",
        sameAirportError: "Le départ et la destination doivent être différents",
        departDateRequired: "Date de départ obligatoire",
        returnDateRequired: "Date de retour obligatoire",
        multiCityError: "Veuillez compléter toutes les étapes",
    },
    en: {
        from: "Departure",
        to: "Destination",
        fromPlaceholder: "Where from?",
        toPlaceholder: "Where to?",
        dates: "Dates",
        date: "Date",
        passengersClass: "Passengers / Class",
        passengers: "passenger",
        passengersPlural: "passengers",
        baggage: "Baggage",
        direct: "Direct",
        flexible: "Flexible",
        search: "Search",
        searching: "Searching...",
        addFlight: "Add a flight",
        destWarning: "Destination might not be available.",
        originRequired: "Departure airport is required",
        destRequired: "Destination airport is required",
        sameAirportError: "Departure and destination must be different",
        departDateRequired: "Departure date is required",
        returnDateRequired: "Return date is required",
        multiCityError: "Please complete all flight legs",
    },
    ar: {
        from: "المغادرة",
        to: "الوجهة",
        fromPlaceholder: "من أين تسافر؟",
        toPlaceholder: "إلى أين تسافر؟",
        dates: "التواريخ",
        date: "التاريخ",
        passengersClass: "المسافرون / الدرجة",
        passengers: "مسافر",
        passengersPlural: "مسافرين",
        baggage: "أمتعة",
        direct: "مباشر",
        flexible: "مرن",
        search: "بحث",
        searching: "جاري البحث...",
        addFlight: "إضافة رحلة",
        destWarning: "قد لا تكون هذه الوجهة متاحة.",
        originRequired: "مطار المغادرة إجباري",
        destRequired: "مطار الوصول إجباري",
        sameAirportError: "يجب أن يكون مطار المغادرة مختلفاً عن الوصول",
        departDateRequired: "تاريخ المغادرة إجباري",
        returnDateRequired: "تاريخ العودة إجباري",
        multiCityError: "يرجى إكمال جميع مراحل الرحلة",
    },
};

export default function MobileSearchForm({ onSubmit, loading }: { onSubmit: (p: AggregatedSearchParams) => void; loading?: boolean }) {
    const { language } = useLanguage();
    const t = flightTexts[language] || flightTexts.fr;
    const f = useAggregatedSearchFormState(onSubmit);
    const { count, classe } = f.passengerLabel();

    return (
        <form onSubmit={f.handleSubmit} className="w-full">
            <AllDestinationsModal
                open={f.showAllDestinations}
                onClose={() => f.setShowAllDestinations(false)}
                onSelect={(code, airport) => {
                    if (f.destinationPickerTarget === 'origin') { f.update({ departVol1: code }); f.setDepAirport(airport ?? null); }
                    else { f.update({ destinationVol1: code }); f.setDestAirport(airport ?? null); }
                }}
            />
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-[0_16px_40px_rgba(0,33,97,0.12)] p-4 sm:p-5">
                <div className="mb-4">
                    <TripTypeToggle value={f.p.tripType} onChange={(v) => f.update({ tripType: v })} />
                </div>

                <div className="flex flex-col gap-2.5">
                    {f.p.tripType === 'multicity' ? (
                        <div className="flex flex-col gap-3">
                            {f.p.legs.map((leg, i) => {
                                const legOriginMissing = !leg.origin?.trim();
                                const legDestMissing = !leg.destination?.trim();
                                const legSameAirport = !!leg.origin && !!leg.destination && leg.origin.trim().toUpperCase() === leg.destination.trim().toUpperCase();
                                const legDateMissing = !leg.date?.trim();

                                return (
                                    <div key={i} className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 space-y-2.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Vol {i + 1}</span>
                                            {i > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => f.removeLeg(i)}
                                                    className="text-red-500 hover:text-red-600 p-1 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                        <div className={cn(
                                            "relative rounded-xl border bg-slate-50/50 dark:bg-slate-900/40 p-2.5 transition-colors",
                                            f.attemptedSubmit && (legOriginMissing || legSameAirport) ? "border-red-400" : "border-slate-200 dark:border-slate-700"
                                        )}>
                                            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold flex items-center justify-between mb-0.5">
                                                <span className="flex items-center gap-1">
                                                    <span>{t.from}</span>
                                                    <span className="text-red-500 font-bold" title="Obligatoire">*</span>
                                                </span>
                                                {f.attemptedSubmit && legOriginMissing && (
                                                    <span className="text-[10px] text-red-500 font-semibold">{t.originRequired}</span>
                                                )}
                                            </div>
                                            <AirportInput
                                                label={`${t.from} ${i + 1}`}
                                                value={leg.origin}
                                                selectedAirport={leg.originAirport ?? null}
                                                onChange={(code, a) => f.updateLeg(i, { origin: code, originAirport: a ?? null })}
                                                placeholder={t.fromPlaceholder}
                                            />
                                        </div>
                                        <div className={cn(
                                            "relative rounded-xl border bg-slate-50/50 dark:bg-slate-900/40 p-2.5 transition-colors",
                                            f.attemptedSubmit && (legDestMissing || legSameAirport) ? "border-red-400" : "border-slate-200 dark:border-slate-700"
                                        )}>
                                            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold flex items-center justify-between mb-0.5">
                                                <span className="flex items-center gap-1">
                                                    <span>{t.to}</span>
                                                    <span className="text-red-500 font-bold" title="Obligatoire">*</span>
                                                </span>
                                                {f.attemptedSubmit && legDestMissing && (
                                                    <span className="text-[10px] text-red-500 font-semibold">{t.destRequired}</span>
                                                )}
                                            </div>
                                            <AirportInput
                                                label={`${t.to} ${i + 1}`}
                                                value={leg.destination}
                                                selectedAirport={leg.destinationAirport ?? null}
                                                onChange={(code, a) => f.updateLeg(i, { destination: code, destinationAirport: a ?? null })}
                                                placeholder={t.toPlaceholder}
                                            />
                                        </div>
                                        {f.attemptedSubmit && legSameAirport && (
                                            <div className="text-[10px] text-red-600 font-medium px-1">
                                                {t.sameAirportError}
                                            </div>
                                        )}
                                        <SingleDatePicker
                                            label={`${t.date} ${i + 1}`}
                                            value={leg.date}
                                            onChange={(v) => f.updateLeg(i, { date: v })}
                                            minDate={i > 0 ? f.p.legs[i - 1].date : undefined}
                                            required
                                            error={f.attemptedSubmit && (legDateMissing ? t.departDateRequired : false)}
                                        />
                                    </div>
                                );
                            })}
                            {f.p.legs.length < 6 && (
                                <button
                                    type="button"
                                    onClick={f.addLeg}
                                    className="text-[#FFAA01] text-xs font-bold flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-[#FFAA01]/40 hover:bg-amber-500/5 transition-colors cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    {t.addFlight}
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Merged origin/destination box — py-2.5 so the two rows sit comfortably */}
                            <div className={cn(
                                "relative rounded-2xl border bg-white dark:bg-slate-800/70 shadow-xs transition-colors",
                                f.attemptedSubmit && (f.originMissing || f.destMissing || f.sameAirport)
                                    ? "border-red-400 dark:border-red-500/80 ring-1 ring-red-400/40"
                                    : "border-slate-200/90 dark:border-slate-700/80"
                            )}>
                                <div className={cn(
                                    "px-4 py-2.5 pr-12 rtl:pr-4 rtl:pl-12 rounded-t-2xl transition-colors",
                                    f.attemptedSubmit && f.originMissing && "bg-red-50/50 dark:bg-red-950/20"
                                )}>
                                    <div className="flex items-center justify-between mb-0.5">
                                        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1">
                                            <span>{t.from}</span>
                                            <span className="text-red-500 font-bold" title="Obligatoire">*</span>
                                        </div>
                                        {f.attemptedSubmit && f.originMissing && (
                                            <span className="text-[10px] font-semibold text-red-500">{t.originRequired}</span>
                                        )}
                                    </div>
                                    <AirportInput
                                        label={t.from}
                                        value={f.p.departVol1} selectedAirport={f.depAirport}
                                        onChange={(code, a) => { f.update({ departVol1: code }); f.setDepAirport(a ?? null); }}
                                        placeholder={t.fromPlaceholder}
                                        onShowAllDestinations={() => { f.setDestinationPickerTarget('origin'); f.setShowAllDestinations(true); }}
                                    />
                                </div>
                                <div className="h-px bg-slate-100 dark:bg-slate-700/60 mx-4" />
                                <div className={cn(
                                    "px-4 py-2.5 pr-12 rtl:pr-4 rtl:pl-12 rounded-b-2xl transition-colors",
                                    f.attemptedSubmit && f.destMissing && "bg-red-50/50 dark:bg-red-950/20"
                                )}>
                                    <div className="flex items-center justify-between mb-0.5">
                                        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1">
                                            <span>{t.to}</span>
                                            <span className="text-red-500 font-bold" title="Obligatoire">*</span>
                                        </div>
                                        {f.attemptedSubmit && f.destMissing && (
                                            <span className="text-[10px] font-semibold text-red-500">{t.destRequired}</span>
                                        )}
                                    </div>
                                    <AirportInput
                                        label={t.to}
                                        value={f.p.destinationVol1} selectedAirport={f.destAirport}
                                        onChange={(code, a) => { f.update({ destinationVol1: code }); f.setDestAirport(a ?? null); }}
                                        placeholder={t.toPlaceholder}
                                        onShowAllDestinations={() => { f.setDestinationPickerTarget('destination'); f.setShowAllDestinations(true); }}
                                    />
                                </div>
                                <button type="button" onClick={f.swap} aria-label="Inverser"
                                        className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center text-slate-500 hover:text-blue-600 active:scale-90 transition-all cursor-pointer">
                                    <ArrowLeftRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            {f.p.destinationVol1 && !f.isDestinationSupported(f.p.destinationVol1) && (
                                <div className="text-[10px] text-amber-600 -mt-1 px-1">{t.destWarning}</div>
                            )}
                            {f.attemptedSubmit && f.sameAirport && (
                                <div className="text-[11px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl px-3 py-1.5 font-medium flex items-center gap-1.5">
                                    <span className="font-bold">!</span>
                                    <span>{t.sameAirportError}</span>
                                </div>
                            )}

                            <DateRangePicker
                                tripType={f.p.tripType} startDate={f.p.departleVol1} endDate={f.p.retourleVol1}
                                required
                                error={
                                    f.attemptedSubmit && f.departDateMissing
                                        ? t.departDateRequired
                                        : f.attemptedSubmit && f.returnDateMissing
                                        ? t.returnDateRequired
                                        : undefined
                                }
                                onChangeStart={(v) => {
                                    const patch: Partial<typeof f.p> = { departleVol1: v };
                                    if (f.p.tripType === 'roundtrip' && f.p.retourleVol1 && f.p.retourleVol1 < v) patch.retourleVol1 = '';
                                    f.update(patch);
                                }}
                                onChangeEnd={(v) => f.update({ retourleVol1: v })}
                            />
                        </>
                    )}

                    <PassengerClassSelector
                        qteADT={f.p.qteADT} qteCHD={f.p.qteCHD} qteINF={f.p.qteINF} classe={f.p.classe}
                        onChange={(n) => f.update(n)}
                        trigger={
                            <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-800/70 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 shadow-xs cursor-pointer hover:border-[#1775FF] transition-colors">
                                <Users className="w-4 h-4 text-[#FFAA01] shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{t.passengersClass}</div>
                                    <div className="font-bold text-[#0454E8] dark:text-blue-400 text-sm">{count} {count > 1 ? t.passengersPlural : t.passengers} · {classe}</div>
                                </div>
                            </div>
                        }
                    />

                    {f.passengerError && <div className="text-[11px] text-amber-600 px-1">{f.passengerError}</div>}

                    <div className="flex items-center gap-2 flex-wrap">
                        <Chip active={!!f.p.baggage} onClick={() => f.update({ baggage: f.p.baggage ? undefined : '1PC' })} icon={<Luggage className="w-3 h-3" />} label={t.baggage} />
                        <Chip active={!!f.p.directOnly} onClick={() => f.update({ directOnly: !f.p.directOnly })} icon={<Zap className="w-3 h-3" />} label={t.direct} />
                        <Chip active={f.p.refundable === 'O'} onClick={() => f.update({ refundable: f.p.refundable === 'O' ? undefined : 'O' })} icon={<Check className="w-3 h-3" />} label={t.flexible} />
                    </div>

                    <Button type="submit" disabled={loading}
                            className="w-full h-12 bg-gradient-to-r from-[#FFAA01] to-[#FF9800] hover:brightness-105 text-[#002161] font-extrabold text-sm rounded-full shadow-[0_6px_20px_rgba(255,170,1,0.35)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer">
                        <Search className="w-4 h-4" />
                        {loading ? t.searching : t.search}
                    </Button>
                </div>
            </div>
        </form>
    );
}