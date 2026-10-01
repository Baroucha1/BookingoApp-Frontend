import { ArrowLeftRight, Search, Users, Check, Luggage, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PassengerClassSelector from '@/components/flights/PassengerClassSelector';
import AllDestinationsModal from '@/components/flights/AllDestinationModal';
import {
    AirportInput, DateRangePicker, Chip, TripTypeToggle,
    useAggregatedSearchFormState, AirlineFilterRow,
} from './SearchFormShared';
import type { AggregatedSearchParams } from '@/service/flights_aggregator/aggregatedTypes';
import {AIRLINES} from "@/data/airlines.ts";
import { useLanguage } from '@/i18n/LanguageContext';

export default function MobileSearchForm({ onSubmit, loading }: { onSubmit: (p: AggregatedSearchParams) => void; loading?: boolean }) {
    const f = useAggregatedSearchFormState(onSubmit);
    const { t } = useLanguage();
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
            <div className="bg-white/95 rounded-xl border-2 border-[#1775FF] shadow-2xl p-4">
                <div className="mb-4">
                    <TripTypeToggle value={f.p.tripType} onChange={(v) => f.update({ tripType: v })} />
                </div>

                <div className="flex flex-col gap-2.5">
                    {/* Merged origin/destination box — py-2 (not py-3) so the two rows sit closer together */}
                    <div className="relative rounded-sm border-2 border-[#1775FF] bg-white shadow-sm">
                        <div className="px-4 py-2 pr-12">
                            <div className="text-[10px] uppercase tracking-widest text-[#94A3B8] mb-0.5 font-medium">{t('flightDeparture')}</div>
                            <AirportInput
                                value={f.p.departVol1} selectedAirport={f.depAirport}
                                onChange={(code, a) => { f.update({ departVol1: code }); f.setDepAirport(a ?? null); }}
                                hintType="origin" placeholder={t('flightOriginPlaceholder')}
                                onShowAllDestinations={() => { f.setDestinationPickerTarget('origin'); f.setShowAllDestinations(true); }}
                            />
                        </div>
                        <div className="h-px bg-[#E2E8F0] mx-4" />
                        <div className="px-4 py-2 pr-12">
                            <div className="text-[10px] uppercase tracking-widest text-[#94A3B8] mb-0.5 font-medium">{t('flightDestination')}</div>
                            <AirportInput
                                value={f.p.destinationVol1} selectedAirport={f.destAirport}
                                onChange={(code, a) => { f.update({ destinationVol1: code }); f.setDestAirport(a ?? null); }}
                                hintType="destination" placeholder={t('flightDestinationPlaceholder')}
                                onShowAllDestinations={() => { f.setDestinationPickerTarget('destination'); f.setShowAllDestinations(true); }}
                            />
                        </div>
                        <button type="button" onClick={f.swap} aria-label={t('flightSwap')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#F1F5F9] border border-[#0454E8] flex items-center justify-center text-[#64748B]">
                            <ArrowLeftRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    {f.p.destinationVol1 && !f.isDestinationSupported(f.p.destinationVol1) && (
                        <div className="text-[10px] text-amber-600 -mt-1 px-1">{t('flightUnsupportedDestinationShort')}</div>
                    )}

                    <DateRangePicker
                        tripType={f.p.tripType} startDate={f.p.departleVol1} endDate={f.p.retourleVol1}
                        onChangeStart={(v) => {
                            const patch: Partial<typeof f.p> = { departleVol1: v };
                            if (f.p.tripType === 'roundtrip' && f.p.retourleVol1 && f.p.retourleVol1 < v) patch.retourleVol1 = '';
                            f.update(patch);
                        }}
                        onChangeEnd={(v) => f.update({ retourleVol1: v })}
                    />

                    <PassengerClassSelector
                        qteADT={f.p.qteADT} qteCHD={f.p.qteCHD} qteINF={f.p.qteINF} classe={f.p.classe}
                        onChange={(n) => f.update(n)}
                        trigger={
                            <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white rounded-sm border-2 border-[#1775FF] shadow-sm cursor-pointer">
                                <Users className="w-4 h-4 text-[#F5A623] shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <div className="text-[10px] uppercase tracking-widest text-[#94A3B8] font-medium">{t('flightTravelers')} / {t('flightCabinClass')}</div>
                                    <div className="font-bold text-[#0454E8] text-sm">{count} {t(count === 1 ? 'flightPassenger' : 'flightPassengers')} · {classe}</div>
                                </div>
                            </div>
                        }
                    />

                    {f.passengerError && <div className="text-[11px] text-amber-600 px-1">{f.passengerError}</div>}

                    <div className="flex items-center gap-2 flex-wrap">
                        <Chip active={!!f.p.baggage} onClick={() => f.update({ baggage: f.p.baggage ? undefined : '1PC' })} icon={<Luggage className="w-3 h-3" />} label={t('flightBaggage')} />
                        <Chip active={!!f.p.directOnly} onClick={() => f.update({ directOnly: !f.p.directOnly })} icon={<Zap className="w-3 h-3" />} label={t('flightDirect')} />
                        <Chip active={f.p.refundable === 'O'} onClick={() => f.update({ refundable: f.p.refundable === 'O' ? undefined : 'O' })} icon={<Check className="w-3 h-3" />} label={t('flightFlexible')} />
                    </div>

                    <div className="relative">
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                            <AirlineFilterRow
                                airlines={AIRLINES}
                                selected={f.p.preferredAirlines ?? []}
                                onToggle={f.toggleAirline}
                            />
                        </div>
                        <div className="pointer-events-none absolute right-0 top-0 bottom-1 w-8 bg-gradient-to-l from-white to-transparent" />
                    </div>

                    <Button type="submit" disabled={loading || !!f.passengerError || f.multiCityIncomplete || f.returnDateMissing}
                            className="w-full h-12 bg-[#FFAA01] hover:bg-[#E09515] text-blue-600 font-bold text-sm rounded-lg shadow-sm">
                        <Search className="w-4 h-4" />
                        {loading ? t('flightSearching') : t('flightSearch')}
                    </Button>
                </div>
            </div>
        </form>
    );
}