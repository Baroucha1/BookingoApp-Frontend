import { ArrowLeftRight, MapPin, Search, Users, Luggage, Zap, Check, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PassengerClassSelector from '@/components/flights/PassengerClassSelector';
import AllDestinationsModal from '@/components/flights/AllDestinationModal';
import {
    Tile, AirportInput, DateRangePicker, Chip, TripTypeToggle,
    useAggregatedSearchFormState, SingleDatePicker,
} from './SearchFormShared';
import type { AggregatedSearchParams } from '@/service/flights_aggregator/aggregatedTypes';
import { useLanguage } from '@/i18n/LanguageContext';

const flightTexts = {
    fr: {
        from: "Départ",
        to: "Destination",
        fromPlaceholder: "D'où partez-vous?",
        toPlaceholder: "Où allez-vous?",
        dates: "Dates",
        date: "Date",
        travelers: "Voyageurs",
        passengers: "passager",
        passengersPlural: "passagers",
        baggage: "Bagages",
        direct: "Direct",
        flexible: "Flexible",
        search: "Rechercher",
        searching: "Recherche...",
        addFlight: "Ajouter un vol",
        destWarning: "Cette destination n'est peut-être pas disponible pour cet itinéraire.",
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
        travelers: "Travelers",
        passengers: "passenger",
        passengersPlural: "passengers",
        baggage: "Baggage",
        direct: "Direct",
        flexible: "Flexible",
        search: "Search",
        searching: "Searching...",
        addFlight: "Add a flight",
        destWarning: "This destination might not be available for this route.",
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
        travelers: "المسافرون",
        passengers: "مسافر",
        passengersPlural: "مسافرين",
        baggage: "أمتعة",
        direct: "مباشر",
        flexible: "مرن",
        search: "بحث",
        searching: "جاري البحث...",
        addFlight: "إضافة رحلة",
        destWarning: "قد لا تكون هذه الوجهة متاحة لهذا المسار.",
        originRequired: "مطار المغادرة إجباري",
        destRequired: "مطار الوصول إجباري",
        sameAirportError: "يجب أن يكون مطار المغادرة مختلفاً عن الوصول",
        departDateRequired: "تاريخ المغادرة إجباري",
        returnDateRequired: "تاريخ العودة إجباري",
        multiCityError: "يرجى إكمال جميع مراحل الرحلة",
    },
};

export default function DesktopSearchForm({ onSubmit, loading }: { onSubmit: (p: AggregatedSearchParams) => void; loading?: boolean }) {
    const f = useAggregatedSearchFormState(onSubmit);
    const { count, classe } = f.passengerLabel();
    const { language } = useLanguage();
    const t = flightTexts[language] || flightTexts.fr;

    return (
        <form onSubmit={f.handleSubmit} className="w-full max-w-7xl mx-auto">
            <AllDestinationsModal
                open={f.showAllDestinations}
                onClose={() => f.setShowAllDestinations(false)}
                onSelect={(code, airport) => {
                    if (f.destinationPickerTarget === 'origin') { f.update({ departVol1: code }); f.setDepAirport(airport ?? null); }
                    else { f.update({ destinationVol1: code }); f.setDestAirport(airport ?? null); }
                }}
            />
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-[28px] sm:rounded-[32px] border border-slate-200/90 dark:border-slate-800 shadow-[0_20px_50px_rgba(0,33,97,0.12)] p-5 sm:p-7">
                <div className="mb-5">
                    <TripTypeToggle value={f.p.tripType} onChange={(v) => f.update({ tripType: v })} />
                </div>

                {f.p.tripType === 'multicity' ? (
                    <div className="space-y-2 mb-3">
                        {f.p.legs.map((leg, i) => {
                            const legSameAirport = Boolean(leg.origin && leg.destination && leg.origin.trim().toUpperCase() === leg.destination.trim().toUpperCase());
                            const legOriginMissing = !leg.origin || !leg.origin.trim();
                            const legDestMissing = !leg.destination || !leg.destination.trim();
                            const legDateMissing = !leg.date || !leg.date.trim();

                            return (
                                <div key={i} className={i === 0 ? 'grid grid-cols-[1fr_auto_1fr_1fr_auto_1fr] gap-2 items-center' : 'grid grid-cols-[1fr_auto_1fr_1fr_auto] gap-2 items-center'}>
                                    <Tile
                                        icon={<MapPin className="w-4 h-4" />}
                                        label={`${t.from} ${i + 1}`}
                                        required
                                        error={f.attemptedSubmit && (legOriginMissing ? t.originRequired : legSameAirport ? t.sameAirportError : false)}
                                    >
                                        <AirportInput value={leg.origin} selectedAirport={leg.originAirport ?? null}
                                                      onChange={(code, a) => f.updateLeg(i, { origin: code, originAirport: a ?? null })}
                                                      placeholder={t.fromPlaceholder} />
                                    </Tile>
                                    <ArrowLeftRight className="w-3.5 h-3.5 text-[#CBD5E1]" />
                                    <Tile
                                        icon={<MapPin className="w-4 h-4" />}
                                        label={`${t.to} ${i + 1}`}
                                        required
                                        error={f.attemptedSubmit && (legDestMissing ? t.destRequired : legSameAirport ? t.sameAirportError : false)}
                                    >
                                        <AirportInput value={leg.destination} selectedAirport={leg.destinationAirport ?? null}
                                                      onChange={(code, a) => f.updateLeg(i, { destination: code, destinationAirport: a ?? null })}
                                                      placeholder={t.toPlaceholder} />
                                    </Tile>
                                    <SingleDatePicker
                                        label={`Date ${i + 1}`}
                                        value={leg.date}
                                        onChange={(v) => f.updateLeg(i, { date: v })}
                                        minDate={i > 0 ? f.p.legs[i - 1].date : undefined}
                                        required
                                        error={f.attemptedSubmit && (legDateMissing ? t.departDateRequired : false)}
                                    />
                                    {i === 0 ? (
                                        <>
                                            <div className="w-px h-10 bg-[#E2E8F0]" />
                                            <PassengerClassSelector qteADT={f.p.qteADT} qteCHD={f.p.qteCHD} qteINF={f.p.qteINF} classe={f.p.classe}
                                                                    onChange={(n) => f.update(n)}
                                                                    trigger={
                                                                        <Tile icon={<Users className="w-4 h-4" />} label={t.travelers} className="cursor-pointer w-full">
                                                                            <div className="font-bold text-[#0454E8] text-sm">{count} {count > 1 ? t.passengersPlural : t.passengers}</div>
                                                                            <div className="text-xs text-[#0454E8]">{classe}</div>
                                                                        </Tile>
                                                                    } />
                                        </>
                                    ) : (
                                        <button type="button" onClick={() => f.removeLeg(i)}
                                                className="w-8 h-8 rounded-full bg-red-50 border border-red-100 text-red-400 hover:bg-red-100 flex items-center justify-center self-center cursor-pointer">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                        {f.p.legs.length < 6 && (
                            <button type="button" onClick={f.addLeg} className="text-[#F5A623] text-sm flex items-center gap-1.5 hover:underline font-medium mt-1 cursor-pointer">
                                <Plus className="w-4 h-4" /> {t.addFlight}
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 mb-3">
                        {/* Departure & Destination Block */}
                        <div className="flex-1 flex items-center gap-2 min-w-0">
                            <div className="flex-1 min-w-0">
                                <Tile
                                    icon={<MapPin className="w-4 h-4" />}
                                    label={t.from}
                                    required
                                    error={f.attemptedSubmit && (f.originMissing ? t.originRequired : f.sameAirport ? t.sameAirportError : false)}
                                >
                                    <AirportInput value={f.p.departVol1} selectedAirport={f.depAirport}
                                                  onChange={(code, a) => { f.update({ departVol1: code }); f.setDepAirport(a ?? null); }}
                                                  placeholder={t.fromPlaceholder}
                                                  onShowAllDestinations={() => { f.setDestinationPickerTarget('origin'); f.setShowAllDestinations(true); }} />
                                </Tile>
                            </div>

                            <button type="button" onClick={f.swap} aria-label="Inverser"
                                    className="w-9 h-9 shrink-0 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-[#FFAA01] hover:border-[#FFAA01] hover:text-white shadow-xs hover:shadow-md hover:rotate-180 active:scale-90 transition-all duration-300 flex items-center justify-center text-slate-500 justify-self-center z-10 cursor-pointer">
                                <ArrowLeftRight className="w-3.5 h-3.5" />
                            </button>

                            <div className="flex-1 min-w-0">
                                <Tile
                                    icon={<MapPin className="w-4 h-4" />}
                                    label={t.to}
                                    required
                                    error={f.attemptedSubmit && (f.destMissing ? t.destRequired : f.sameAirport ? t.sameAirportError : false)}
                                >
                                    <AirportInput value={f.p.destinationVol1} selectedAirport={f.destAirport}
                                                  onChange={(code, a) => { f.update({ destinationVol1: code }); f.setDestAirport(a ?? null); }}
                                                  placeholder={t.toPlaceholder}
                                                  onShowAllDestinations={() => { f.setDestinationPickerTarget('destination'); f.setShowAllDestinations(true); }} />
                                    {f.p.destinationVol1 && !f.isDestinationSupported(f.p.destinationVol1) && (
                                        <div className="text-[10px] text-amber-600 mt-1">{t.destWarning}</div>
                                    )}
                                </Tile>
                            </div>
                        </div>

                        {/* Dates & Travelers Block */}
                        <div className="flex-1 flex items-center gap-3 min-w-0">
                            <div className="flex-[1.2] min-w-0">
                                <DateRangePicker
                                    tripType={f.p.tripType}
                                    startDate={f.p.departleVol1}
                                    endDate={f.p.retourleVol1}
                                    label={f.p.tripType === 'roundtrip' ? t.dates : t.date}
                                    required
                                    error={f.attemptedSubmit && (f.departDateMissing ? t.departDateRequired : f.returnDateMissing ? t.returnDateRequired : false)}
                                    onChangeStart={(v) => {
                                        const patch: Partial<typeof f.p> = { departleVol1: v };
                                        if (f.p.tripType === 'roundtrip' && f.p.retourleVol1 && f.p.retourleVol1 < v) patch.retourleVol1 = '';
                                        f.update(patch);
                                    }}
                                    onChangeEnd={(v) => f.update({ retourleVol1: v })}
                                />
                            </div>

                            <div className="flex-1 min-w-0">
                                <PassengerClassSelector qteADT={f.p.qteADT} qteCHD={f.p.qteCHD} qteINF={f.p.qteINF} classe={f.p.classe}
                                                        onChange={(n) => f.update(n)}
                                                        trigger={
                                                            <Tile icon={<Users className="w-4 h-4" />} label={t.travelers} className="cursor-pointer w-full">
                                                                <div className="font-bold text-[#0454E8] text-sm whitespace-nowrap truncate">{count} {count > 1 ? t.passengersPlural : t.passengers}</div>
                                                                <div className="text-xs text-[#0454E8] truncate">{classe}</div>
                                                            </Tile>
                                                        } />
                            </div>
                        </div>
                    </div>
                )}

                {f.attemptedSubmit && f.sameAirport && (
                    <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl px-4 py-2 mb-3">
                        ⚠️ {t.sameAirportError}
                    </div>
                )}

                {f.passengerError && <div className="text-[11px] text-amber-600 mb-2 px-1">{f.passengerError}</div>}

                <div className="flex items-end gap-3">
                    <div className="flex-1 min-w-0 flex flex-col gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                            <Chip active={!!f.p.baggage} onClick={() => f.update({ baggage: f.p.baggage ? undefined : '1PC' })} icon={<Luggage className="w-3 h-3" />} label={t.baggage} />
                            <Chip active={!!f.p.directOnly} onClick={() => f.update({ directOnly: !f.p.directOnly })} icon={<Zap className="w-3 h-3" />} label={t.direct} />
                            <Chip active={f.p.refundable === 'O'} onClick={() => f.update({ refundable: f.p.refundable === 'O' ? undefined : 'O' })} icon={<Check className="w-3 h-3" />} label={t.flexible} />
                        </div>
                    </div>
                    <Button type="submit" disabled={loading}
                            className="h-12 px-8 bg-gradient-to-r from-[#FFAA01] to-[#FF9800] hover:brightness-105 text-[#002161] font-extrabold text-sm rounded-full shadow-[0_6px_20px_rgba(255,170,1,0.35)] hover:shadow-[0_8px_25px_rgba(255,170,1,0.45)] active:scale-95 transition-all shrink-0 ml-auto flex items-center gap-2 cursor-pointer">
                        <Search className="w-4 h-4" />
                        {loading ? t.searching : t.search}
                    </Button>
                </div>
            </div>
        </form>
    );
}