import { Button } from '@/components/ui/button.tsx';
import { cn } from '@/lib/utils.ts';
import { getAirlineLogo } from '@/service/flights/airlines.ts';
import type { DisplayOffer } from '@/service/flights_aggregator/aggregatedNormalize.ts';
import { 
    AlertTriangle, Luggage, PackageX, Calendar, Plane, 
    ChevronRight, CheckCircle2, XCircle
} from 'lucide-react';

interface Props {
    offer: DisplayOffer;
    onSelect: (offer: DisplayOffer) => void;
    fareCount?: number;
}

function formatShortDate(dateStr?: string) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function AggregatedFlightCard({ offer, onSelect, fareCount }: Props) {
    const multiLeg = offer.legs.length > 1;

    const isRoundTrip = offer.legs.length === 2 &&
        offer.legs[0].originAirport === offer.legs[1].destinationAirport &&
        offer.legs[0].destinationAirport === offer.legs[1].originAirport;

    const legLabel = (legIdx: number, leg: (typeof offer.legs)[number]) => {
        if (isRoundTrip) {
            return legIdx === 0 ? 'Aller' : 'Retour';
        }
        if (offer.legs.length === 1) {
            return 'Vol';
        }
        return `Vol ${legIdx + 1} • ${leg.originAirport} → ${leg.destinationAirport}`;
    };

    return (
        <div className="group rounded-2xl bg-white p-4 sm:p-5 shadow-xs hover:shadow-lg border border-slate-100 hover:border-[#FFAA01]/80 transition-all duration-200">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">

                {/* Airline & Inclusions Header on Mobile / Side Column on Desktop */}
                <div className="flex items-center justify-between lg:justify-start lg:flex-col lg:items-start gap-3 lg:w-44 shrink-0 min-w-0 pb-3 lg:pb-0 border-b lg:border-b-0 border-slate-100">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-2xl border border-slate-100 bg-white p-1 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                            <img 
                                src={getAirlineLogo(offer.airlineCode)} 
                                alt={offer.airlineName}
                                className="w-9 h-9 object-contain rounded-xl"
                                onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                                }}
                            />
                        </div>
                        <div className="min-w-0">
                            <div className="text-slate-900 font-extrabold text-sm truncate uppercase tracking-tight">
                                {offer.airlineName}
                            </div>
                            <div className="text-[11px] text-slate-400 font-medium">
                                {offer.cabinName || 'Économie'}
                            </div>
                        </div>
                    </div>

                    {/* Mobile top price preview badge */}
                    <div className="lg:hidden text-right">
                        <div className="text-lg font-black text-[#0B0F2E] tabular-nums">
                            {offer.price.toLocaleString('fr-FR')} <span className="text-xs font-bold text-[#3566E3]">{offer.currency}</span>
                        </div>
                    </div>
                </div>

                {/* Itinerary panel: stacked legs (Aller on top, Retour underneath, or each flight individually for multi-city) */}
                <div className="flex-1 min-w-0 space-y-3">
                    {offer.legs.map((leg, i) => {
                        const legDate = leg.departureDate || leg.segments[0]?.departure?.dateTime;
                        return (
                            <div 
                                key={leg.originDestId || i}
                                className={cn(
                                    'min-w-0',
                                    multiLeg ? 'bg-slate-50/90 p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-2xs' : ''
                                )}
                            >
                                {/* Flight leg header with date */}
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            'text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md',
                                            isRoundTrip
                                                ? (i === 0 ? 'bg-blue-100/70 text-blue-700' : 'bg-amber-100/70 text-amber-800')
                                                : 'bg-[#0865FE] text-white shadow-2xs'
                                        )}>
                                            {legLabel(i, leg)}
                                        </span>
                                        {legDate && (
                                            <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-600">
                                                <Calendar className="w-3 h-3 text-sky-500" />
                                                {formatShortDate(legDate)}
                                            </span>
                                        )}
                                    </div>
                                    <span className={cn(
                                        'text-[10px] font-bold px-2 py-0.5 rounded-full',
                                        leg.isDirect 
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' 
                                            : 'bg-amber-50 text-amber-700 border border-amber-200/50'
                                    )}>
                                        {leg.isDirect ? 'Direct' : leg.stopsLabel}
                                    </span>
                                </div>

                                {/* Flight leg time grid */}
                                <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                                    <div>
                                        <div className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums leading-tight">
                                            {leg.departureTime}
                                        </div>
                                        <div className="text-xs font-bold text-slate-600 mt-0.5">{leg.originAirport}</div>
                                    </div>

                                    <div className="text-center px-2">
                                        <div className="text-[11px] font-semibold text-slate-500 mb-1">{leg.durationLabel}</div>
                                        <div className="relative flex items-center justify-center">
                                            <div className="h-[2px] bg-slate-200 w-full rounded-full" />
                                            <Plane className="w-3.5 h-3.5 text-[#3566E3] absolute bg-white px-0.5" />
                                        </div>
                                        <div className="text-[10px] text-slate-400 mt-1">
                                            {leg.segments.length > 1 ? `${leg.segments.length - 1} escale` : 'Vol sans arrêt'}
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums leading-tight">
                                            {leg.arrivalTime}
                                        </div>
                                        <div className="text-xs font-bold text-slate-600 mt-0.5">{leg.destinationAirport}</div>
                                    </div>
                                </div>

                                {/* Baggage & inclusion info */}
                                <div className="flex items-center gap-3 mt-2 pt-2 border-t border-slate-100 text-[11px]">
                                    {leg.checkedBaggage ? (
                                        <span className="flex items-center gap-1 text-emerald-600 font-medium">
                                            <Luggage className="w-3 h-3" /> {leg.checkedBaggage}
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-slate-400 font-medium">
                                            <PackageX className="w-3 h-3 text-red-400" /> Sans bagage soute
                                        </span>
                                    )}
                                    {offer.refundable !== null && (
                                        <span className={cn(
                                            'hidden sm:inline-flex items-center gap-1 font-medium',
                                            offer.refundable ? 'text-emerald-600' : 'text-slate-500'
                                        )}>
                                            {offer.refundable ? (
                                                <><CheckCircle2 className="w-3 h-3" /> Remboursable</>
                                            ) : (
                                                <><XCircle className="w-3 h-3 text-slate-400" /> Non remboursable</>
                                            )}
                                        </span>
                                    )}
                                </div>

                                {multiLeg && i < offer.legs.length - 1 && (
                                    <div className="hidden lg:block border-t border-slate-100 my-2.5" />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Price & CTA Action */}
                <div className="flex items-center justify-between lg:flex-col lg:items-end lg:justify-center gap-3 lg:w-48 border-t lg:border-t-0 border-slate-100 pt-3 lg:pt-0 mt-1 lg:mt-0 shrink-0">
                    <div className="text-left lg:text-right min-w-0">
                        <div className="text-xs text-slate-400 font-medium">
                            {fareCount && fareCount > 1 ? `${fareCount} tarifs dispo.` : 'Tarif total TTC'}
                        </div>
                        <div className="text-2xl sm:text-2xl font-black text-[#0B0F2E] tabular-nums whitespace-nowrap">
                            {offer.price.toLocaleString('fr-FR')} <span className="text-sm font-bold text-[#3566E3]">{offer.currency}</span>
                        </div>

                        {offer.seatsRemaining !== null && offer.seatsRemaining <= 5 && (
                            <div className="flex lg:justify-end items-center gap-1 text-amber-600 font-semibold text-[11px] mt-0.5">
                                <AlertTriangle className="w-3 h-3" /> Plus que {offer.seatsRemaining} place{offer.seatsRemaining > 1 ? 's' : ''}
                            </div>
                        )}
                    </div>

                    <Button 
                        onClick={() => onSelect(offer)}
                        className="bg-[#FFAA01] hover:bg-[#E09515] text-[#0B0F2E] font-black px-5 py-2.5 rounded-xl shadow-xs hover:shadow-md transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
                    >
                        <span>Détails</span>
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>

            </div>
        </div>
    );
}