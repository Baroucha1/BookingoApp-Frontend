import { ArrowLeftRight, MapPin, Search, Users, Luggage, Zap, Check, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PassengerClassSelector from '@/components/flights/PassengerClassSelector';
import AllDestinationsModal from '@/components/flights/AllDestinationModal';
import {
    Tile, AirportInput, DateRangePicker, Chip, AirlinePill, TripTypeToggle,
    useAggregatedSearchFormState, SingleDatePicker, AirlineFilterRow,
} from './SearchFormShared';
import type { AggregatedSearchParams } from '@/service/flights_aggregator/aggregatedTypes';
import {AIRLINES} from "@/data/airlines.ts";
import { useLanguage } from '@/i18n/LanguageContext';


export default function DesktopSearchForm({ onSubmit, loading }: { onSubmit: (p: AggregatedSearchParams) => void; loading?: boolean }) {
    const f = useAggregatedSearchFormState(onSubmit);
    const { t } = useLanguage();
    const { count, classe } = f.passengerLabel();

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
            <div className="bg-white/85 rounded-xl border-2 border-[#1775FF] shadow-2xl p-6">
                <div className="mb-5">
                    <TripTypeToggle value={f.p.tripType} onChange={(v) => f.update({ tripType: v })} />
                </div>

                {f.p.tripType === 'multicity' ? (
                    <div className="space-y-2 mb-3">
                        {f.p.legs.map((leg, i) => (
                            <div key={i} className={i === 0 ? 'grid grid-cols-[1fr_auto_1fr_1fr_auto_1fr] gap-2 items-center' : 'grid grid-cols-[1fr_auto_1fr_1fr_auto] gap-2 items-center'}>
                                <Tile icon={<MapPin className="w-4 h-4" />} label={`${t('flightDeparture')} ${i + 1}`}>
                                    <AirportInput value={leg.origin} selectedAirport={leg.originAirport ?? null}
                                                  onChange={(code, a) => f.updateLeg(i, { origin: code, originAirport: a ?? null })}
                                                  hintType="origin" placeholder={t('flightOriginPlaceholder')} />
                                </Tile>
                                <ArrowLeftRight className="w-3.5 h-3.5 text-[#CBD5E1]" />
                                <Tile icon={<MapPin className="w-4 h-4" />} label={`${t('flightDestination')} ${i + 1}`}>
                                    <AirportInput value={leg.destination} selectedAirport={leg.destinationAirport ?? null}
                                                  onChange={(code, a) => f.updateLeg(i, { destination: code, destinationAirport: a ?? null })}
                                                  hintType="destination" placeholder={t('flightDestinationPlaceholder')} />
                                </Tile>
                                <SingleDatePicker label={`${t('flightDate')} ${i + 1}`} value={leg.date} onChange={(v) => f.updateLeg(i, { date: v })}
                                          minDate={i > 0 ? f.p.legs[i - 1].date : undefined} />
                                {i === 0 ? (
                                    <>
                                        <div className="w-px h-10 bg-[#E2E8F0]" />
                                        <PassengerClassSelector qteADT={f.p.qteADT} qteCHD={f.p.qteCHD} qteINF={f.p.qteINF} classe={f.p.classe}
                                                                onChange={(n) => f.update(n)}
                                                                trigger={
                                                                    <Tile icon={<Users className="w-4 h-4" />} label={t('flightTravelers')} className="cursor-pointer w-full">
                                                                        <div className="font-bold text-[#0454E8] text-sm">{count} {t(count === 1 ? 'flightPassenger' : 'flightPassengers')}</div>
                                                                        <div className="text-xs text-[#0454E8]">{classe}</div>
                                                                    </Tile>
                                                                } />
                                    </>
                                ) : (
                                    <button type="button" onClick={() => f.removeLeg(i)}
                                            className="w-8 h-8 rounded-full bg-red-50 border border-red-100 text-red-400 hover:bg-red-100 flex items-center justify-center self-center">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        ))}
                        {f.p.legs.length < 6 && (
                            <button type="button" onClick={f.addLeg} className="text-[#F5A623] text-sm flex items-center gap-1.5 hover:underline font-medium mt-1">
                                <Plus className="w-4 h-4" /> {t('flightAdd')}
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1.2fr)_auto_minmax(0,1fr)] gap-3 items-center mb-3">
                        <Tile icon={<MapPin className="w-4 h-4" />} label={t('flightDeparture')}>
                            <AirportInput value={f.p.departVol1} selectedAirport={f.depAirport}
                                          onChange={(code, a) => { f.update({ departVol1: code }); f.setDepAirport(a ?? null); }}
                                          hintType="origin" placeholder={t('flightOriginPlaceholder')}
                                          onShowAllDestinations={() => { f.setDestinationPickerTarget('origin'); f.setShowAllDestinations(true); }} />
                        </Tile>

                        <button type="button" onClick={f.swap} aria-label={t('flightSwap')}
                                className="w-8 h-8 rounded-full bg-[#F1F5F9] border border-[#0454E8] hover:bg-[#F5A623] hover:text-white hover:rotate-180 transition-all duration-300 flex items-center justify-center text-[#64748B] justify-self-center">
                            <ArrowLeftRight className="w-3.5 h-3.5" />
                        </button>

                        <Tile icon={<MapPin className="w-4 h-4" />} label={t('flightDestination')}>
                            <AirportInput value={f.p.destinationVol1} selectedAirport={f.destAirport}
                                          onChange={(code, a) => { f.update({ destinationVol1: code }); f.setDestAirport(a ?? null); }}
                                          hintType="destination" placeholder={t('flightDestinationPlaceholder')}
                                          onShowAllDestinations={() => { f.setDestinationPickerTarget('destination'); f.setShowAllDestinations(true); }} />
                            {f.p.destinationVol1 && !f.isDestinationSupported(f.p.destinationVol1) && (
                                <div className="text-[10px] text-amber-600 mt-1">{t('flightUnsupportedDestination')}</div>
                            )}
                        </Tile>

                        <div className="w-px h-10 bg-transparent" />

                        <DateRangePicker
                            tripType={f.p.tripType} startDate={f.p.departleVol1} endDate={f.p.retourleVol1}
                            onChangeStart={(v) => {
                                const patch: Partial<typeof f.p> = { departleVol1: v };
                                if (f.p.tripType === 'roundtrip' && f.p.retourleVol1 && f.p.retourleVol1 < v) patch.retourleVol1 = '';
                                f.update(patch);
                            }}
                            onChangeEnd={(v) => f.update({ retourleVol1: v })}
                        />

                        <div className="w-px h-10 bg-transparent" />

                        <PassengerClassSelector qteADT={f.p.qteADT} qteCHD={f.p.qteCHD} qteINF={f.p.qteINF} classe={f.p.classe}
                                                onChange={(n) => f.update(n)}
                                                trigger={
                                                    <Tile icon={<Users className="w-4 h-4" />} label={t('flightTravelers')} className="cursor-pointer w-full">
                                                        <div className="font-bold text-[#0454E8] text-sm">{count} {t(count === 1 ? 'flightPassenger' : 'flightPassengers')}</div>
                                                        <div className="text-xs text-[#0454E8]">{classe}</div>
                                                    </Tile>
                                                } />
                    </div>
                )}

                {f.passengerError && <div className="text-[11px] text-amber-600 mb-2 px-1">{f.passengerError}</div>}

                <div className="flex items-end gap-3">
                    <div className="flex-1 min-w-0 flex flex-col gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                            <Chip active={!!f.p.baggage} onClick={() => f.update({ baggage: f.p.baggage ? undefined : '1PC' })} icon={<Luggage className="w-3 h-3" />} label={t('flightBaggage')} />
                            <Chip active={!!f.p.directOnly} onClick={() => f.update({ directOnly: !f.p.directOnly })} icon={<Zap className="w-3 h-3" />} label={t('flightDirect')} />
                            <Chip active={f.p.refundable === 'O'} onClick={() => f.update({ refundable: f.p.refundable === 'O' ? undefined : 'O' })} icon={<Check className="w-3 h-3" />} label={t('flightFlexible')} />
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">

                        </div>
                    </div>
                    <Button type="submit" disabled={loading || !!f.passengerError || f.multiCityIncomplete || f.returnDateMissing}
                            className="h-12 px-7 bg-[#FFAA01] hover:bg-[#E09515] text-blue-600 font-bold text-sm rounded-lg shadow-sm shrink-0 ml-auto">
                        <Search className="w-4 h-4" />
                        {loading ? t('flightSearching') : t('flightSearch')}
                    </Button>
                </div>
            </div>
        </form>
    );
}