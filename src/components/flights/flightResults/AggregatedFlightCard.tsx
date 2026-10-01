import {useState} from 'react';
import {Button} from '@/components/ui/button.tsx';
import {cn} from '@/lib/utils.ts';
import {getAirlineLogo} from '@/service/flights/airlines.ts';
import type {DisplayOffer} from '@/service/flights_aggregator/aggregatedNormalize.ts';
import {AlertTriangle, Luggage, PackageX} from 'lucide-react';
import { timeFromIso, dayOffset } from '@/lib/flightTime';

interface Props {
    offer: DisplayOffer,
    onSelect: (offer: DisplayOffer) => void,
    fareCount?: number
}

const PROVIDER_LABELS: Record<string, string> = {
    TK_NDC: 'Turkish Airlines Direct',
    AMADEUS: 'Amadeus',
};

const PROVIDER_COLORS: Record<string, string> = {
    TK_NDC: 'bg-red-50 text-red-600',
    AMADEUS: 'bg-blue-50 text-blue-600',
};

export default function AggregatedFlightCard({offer, onSelect, fareCount}: Props) {
    const multiLeg = offer.legs.length > 1;

    const legLabel = (legIdx: number) => {
        if (offer.legs.length === 2) {
            return legIdx === 0 ? 'Aller' : 'Retour';
        }
        return `Vol ${legIdx + 1}`;
    };

    return (
        <div className="group rounded-2xl bg-white p-4 shadow-sm hover:shadow-md hover:border-l-[3px] hover:border-l-[#F5A623] transition-all">
            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-0">

                {/* Airline block — fixed width so every card's itinerary column starts at the same x position */}
                <div className="flex items-center gap-3 md:w-44 shrink-0 min-w-0">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
                        <img src={getAirlineLogo(offer.airlineCode)} alt={offer.airlineName}
                             className="w-11 h-11 object-cover"
                             onError={(e) => {
                                 (e.currentTarget as HTMLImageElement).style.display = 'none';
                             }}/>
                    </div>
                    <div className="min-w-0">
                        <div className="text-slate-900 font-bold text-sm truncate uppercase">{offer.airlineName}</div>
                        
                    </div>
                </div>

                {/* Itinerary panel */}
                <div className="flex-1 md:max-w-[380px] min-w-0 rounded-sm px-0 md:px-4 py-1 md:py-3 space-y-3">
                    {offer.legs.map((leg, i) => {
                        const depIso = leg.segments[0]?.departure.dateTime;
                        const arrIso = leg.segments[leg.segments.length - 1]?.arrival.dateTime;
                        const depTime = timeFromIso(depIso) || leg.departureTime;
                        const arrTime = timeFromIso(arrIso) || leg.arrivalTime;

                        return (
                            <div key={leg.originDestId}>
                                {multiLeg && (
                                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
                                        {legLabel(i)}
                                    </div>
                                )}
                                <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                                    <div>
                                        <div className="text-xl font-bold text-slate-900 tabular-nums leading-tight">{depTime}</div>
                                        <div className="text-xs text-slate-500">{leg.originAirport}</div>
                                    </div>

                                    <div className="text-center px-2">
                                        <div className="text-xs text-slate-500 mb-1">{leg.durationLabel}</div>
                                        <div className="h-px bg-slate-300 w-full" />
                                        <div className={cn('text-[11px] mt-1 font-medium', leg.isDirect ? 'text-emerald-600' : 'text-amber-600')}>
                                            {leg.stopsLabel}
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="text-xl font-bold text-slate-900 tabular-nums leading-tight">
                                            {arrTime}

                                        </div>
                                        <div className="text-xs text-slate-500">{leg.destinationAirport}</div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-center gap-1.5 mt-1.5">
                                    {leg.checkedBaggage ? (
                                        <span className="flex items-center gap-1 text-emerald-600 text-[11px] font-medium">
                                            <Luggage className="w-3 h-3" /> Bagage inclus ({leg.checkedBaggage})
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-red-500 text-[11px] font-medium">
                                            <PackageX className="w-3 h-3" /> Sans bagage
                                        </span>
                                    )}
                                </div>

                                {multiLeg && i < offer.legs.length - 1 && (
                                    <div className="border-t border-slate-100 mt-3" />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Price + CTA */}

                {/* Price + CTA */}
                <div className="flex items-center justify-between gap-3 md:w-52 md:flex-col md:items-end md:justify-center border-t md:border-t-0 border-slate-100 pt-3 md:pt-0 mt-1 md:mt-0">
                    <div className="text-left md:text-right min-w-0">
                        <div className="text-xl sm:text-2xl font-bold text-[#0B0F2E] tabular-nums whitespace-nowrap">
                            {offer.price.toLocaleString('fr-FR')} {offer.currency}
                        </div>

                        <div className="text-xs text-slate-500 whitespace-nowrap">
                            à partir de{fareCount ? ` . ${fareCount} tarif${fareCount > 1 ? 's' : ''}` : ''}
                        </div>

                        <div className="flex md:justify-end items-center gap-2 mt-1 flex-wrap">
                            {offer.cabinName && (
                                <span className="text-xs font-medium text-amber-600 lowercase">{offer.cabinName}</span>
                            )}
                        </div>
                        {offer.refundable !== null && (
                            <span className={cn('text-[12px] font-medium',
                                offer.refundable ? 'text-emerald-600' : 'text-red-600')}>
                                    {offer.refundable ? 'Remboursable' : 'Non remboursable'}
                                </span>
                        )}

                        {offer.seatsRemaining !== null && offer.seatsRemaining <= 5 && (
                            <div className="flex md:justify-end items-center gap-1 text-amber-600 font-medium text-xs mt-1">
                                <AlertTriangle className="w-3 h-3"/> {offer.seatsRemaining} place{offer.seatsRemaining > 1 ? 's' : ''} restante{offer.seatsRemaining > 1 ? 's' : ''}
                            </div>
                        )}
                    </div>

                    <Button onClick={() => onSelect(offer)}
                            className="bg-[#FEC425] hover:bg-[#E09515] text-[#4D8CEE] font-bold min-w-[110px] shrink-0">
                        Détails
                    </Button>
                </div>
            </div>
        </div>
    );
}