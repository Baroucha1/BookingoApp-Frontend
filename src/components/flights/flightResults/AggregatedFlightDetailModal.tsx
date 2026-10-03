// src/components/flights/flightResults/AggregatedFlightDetailModal.tsx
import { useState, useEffect, useRef } from 'react';
import { 
    X, Plane, CheckCircle2, XCircle, Luggage, AlertTriangle, 
    Wifi, Utensils, Clock, Calendar, ArrowRight, PlaneTakeoff, 
    PlaneLanding, ShieldCheck, Sparkles, Check, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog.tsx';
import { Button } from '@/components/ui/button.tsx';
import { cn } from '@/lib/utils.ts';
import { getAirlineLogo } from '@/service/flights/airlines.ts';
import { normalizeAggregatedOffer } from '@/service/flights_aggregator/aggregatedNormalize.ts';
import type { FlightIdentityGroup, DisplayOffer, DisplayLeg } from '@/service/flights_aggregator/aggregatedNormalize.ts';
import { repriceFlight } from '@/service/flights_aggregator/aggregatedSearch.service.ts';

interface Props {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    group: FlightIdentityGroup | null;
    onContinue: (offer: DisplayOffer) => void;
}

const SEAT_BG_IMAGE = 'https://images.unsplash.com/photo-1540339832862-474599807836?q=80&w=600&auto=format&fit=crop';

function formatDateDisplay(dateTimeStr?: string) {
    if (!dateTimeStr) return '';
    const d = new Date(dateTimeStr);
    if (isNaN(d.getTime())) return dateTimeStr;
    return d.toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
    });
}

function formatTimeDisplay(dateTimeStr?: string) {
    if (!dateTimeStr) return '';
    const match = /T(\d{2}:\d{2})/.exec(dateTimeStr);
    if (match) return match[1];
    const d = new Date(dateTimeStr);
    if (isNaN(d.getTime())) return dateTimeStr;
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function calculateLayoverDuration(arrivalIso: string, nextDepartureIso: string): string {
    const arr = new Date(arrivalIso).getTime();
    const dep = new Date(nextDepartureIso).getTime();
    if (isNaN(arr) || isNaN(dep) || dep <= arr) return 'Correspondance';
    const diffMin = Math.round((dep - arr) / (1000 * 60));
    const hours = Math.floor(diffMin / 60);
    const mins = diffMin % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}min`;
    if (hours > 0) return `${hours}h`;
    return `${mins}min`;
}

function calculateSegmentDuration(departureIso: string, arrivalIso: string): string {
    const dep = new Date(departureIso).getTime();
    const arr = new Date(arrivalIso).getTime();
    if (isNaN(dep) || isNaN(arr) || arr <= dep) return '';
    const diffMin = Math.round((arr - dep) / (1000 * 60));
    const hours = Math.floor(diffMin / 60);
    const mins = diffMin % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}min`;
    if (hours > 0) return `${hours}h`;
    return `${mins}min`;
}

function PolicyBadge({ ok, label }: { ok: boolean; label: string }) {
    return (
        <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold shadow-2xs',
            ok ? 'bg-emerald-50 border-emerald-200/80 text-emerald-700' : 'bg-red-50 border-red-200/80 text-red-600')}>
            {ok ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <XCircle className="w-3.5 h-3.5 shrink-0" />}
            {label}
        </span>
    );
}

// Single Unified Flight Card per leg (segments merged inside the same card with layover connector)
function FlightLegCard({ 
    leg, 
    legIdx, 
    totalLegs, 
    isRoundTrip,
    airlineName, 
    airlineCode, 
    cabinName 
}: { 
    leg: DisplayLeg; 
    legIdx: number; 
    totalLegs: number; 
    isRoundTrip: boolean;
    airlineName: string; 
    airlineCode: string; 
    cabinName?: string | null; 
}) {
    const legTitle = isRoundTrip
        ? (legIdx === 0 ? 'Vol Aller' : 'Vol Retour')
        : (totalLegs === 1 ? 'Vol' : `Vol ${legIdx + 1} • ${leg.originAirport} → ${leg.destinationAirport}`);
    const isOutbound = isRoundTrip && legIdx === 0;

    const firstSegment = leg.segments[0];
    const depDateStr = leg.departureDate || firstSegment?.departure?.dateTime;

    return (
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-all">
            {/* Top row: Flight title + Date + Route + Cabin */}
            <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-100 flex-wrap">
                <div className="flex items-center gap-2.5">
                    <span className={cn(
                        'w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shadow-xs shrink-0',
                        isRoundTrip
                            ? (isOutbound ? 'bg-[#3566E3] text-white' : 'bg-[#FFAA01] text-slate-900')
                            : 'bg-[#0865FE] text-white'
                    )}>
                        {isOutbound ? <PlaneTakeoff className="w-4 h-4" /> : <PlaneLanding className="w-4 h-4" />}
                    </span>
                    <span className="text-sm font-extrabold text-[#0B0F2E] uppercase tracking-wide">
                        {legTitle}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="flex items-center gap-1 text-xs font-semibold text-slate-700 capitalize">
                        <Calendar className="w-3.5 h-3.5 text-sky-500" />
                        {formatDateDisplay(depDateStr)}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                        {cabinName || 'Économie'}
                    </span>
                    <span className={cn(
                        'text-[11px] font-bold px-2.5 py-0.5 rounded-full',
                        leg.isDirect 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' 
                            : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                    )}>
                        {leg.isDirect ? 'Direct' : leg.stopsLabel}
                    </span>
                    <span className="text-xs font-extrabold text-slate-700 ml-1">
                        {leg.durationLabel}
                    </span>
                </div>
            </div>

            {/* Segments list inside the single unified card */}
            <div className="divide-y divide-slate-100">
                {leg.segments.map((segment, sIdx) => {
                    const nextSegment = sIdx < leg.segments.length - 1 ? leg.segments[sIdx + 1] : null;
                    const duration = calculateSegmentDuration(segment.departure.dateTime, segment.arrival.dateTime);

                    return (
                        <div key={segment.paxSegmentRefId || sIdx} className="py-2.5 first:pt-1 last:pb-1">
                            {/* Segment flight row */}
                            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4 py-1">
                                {/* Departure (Left) */}
                                <div className="text-left min-w-0">
                                    <div className="text-xl sm:text-2xl font-black text-[#0B0F2E] tabular-nums leading-tight">
                                        {formatTimeDisplay(segment.departure.dateTime)}
                                    </div>
                                    <div className="text-base sm:text-lg font-black text-blue-700 uppercase tracking-tight mt-0.5">
                                        {segment.departure.airport}
                                    </div>
                                    <div className="text-xs text-slate-500 font-medium truncate mt-0.5">
                                        {segment.departure.stationName || `Aéroport ${segment.departure.airport}`}
                                    </div>
                                </div>

                                {/* Flight Path / Middle (Center) */}
                                <div className="flex flex-col items-center justify-center px-2 sm:px-6 min-w-[120px] sm:min-w-[170px]">
                                    {duration && (
                                        <div className="text-[11px] sm:text-xs font-bold text-slate-500 mb-0.5 flex items-center gap-1">
                                            <Clock className="w-3 h-3 text-slate-400" />
                                            <span>{duration}</span>
                                        </div>
                                    )}

                                    {/* Flight line with plane */}
                                    <div className="relative w-full flex items-center justify-center my-1">
                                        <div className="h-[2px] bg-sky-200 w-full rounded-full" />
                                        <div className="absolute w-5 h-5 rounded-full bg-white border border-sky-300 flex items-center justify-center shadow-2xs">
                                            <Plane className="w-3 h-3 text-[#3566E3] rotate-90" />
                                        </div>
                                    </div>

                                    {/* Airline & flight number */}
                                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 mt-0.5">
                                        <img
                                            src={getAirlineLogo(segment.carrierCode || airlineCode)}
                                            alt={segment.carrierName || airlineName}
                                            className="w-4 h-4 object-contain rounded-xs"
                                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                        />
                                        <span>{segment.carrierCode}{segment.flightNumber}</span>
                                    </div>
                                </div>

                                {/* Arrival (Right) */}
                                <div className="text-right min-w-0">
                                    <div className="text-xl sm:text-2xl font-black text-[#0B0F2E] tabular-nums leading-tight">
                                        {formatTimeDisplay(segment.arrival.dateTime)}
                                    </div>
                                    <div className="text-base sm:text-lg font-black text-emerald-700 uppercase tracking-tight mt-0.5">
                                        {segment.arrival.airport}
                                    </div>
                                    <div className="text-xs text-slate-500 font-medium truncate mt-0.5">
                                        {segment.arrival.stationName || `Aéroport ${segment.arrival.airport}`}
                                    </div>
                                </div>
                            </div>

                            {/* Layover Connector Row between the merged segments */}
                            {nextSegment && (
                                <div className="my-2.5 py-2 px-3.5 bg-amber-50/90 rounded-xl border border-amber-200/80 flex items-center justify-between gap-3 text-xs">
                                    <div className="flex items-center gap-2 text-amber-950 font-bold">
                                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                                        <span>
                                            Escale à {segment.arrival.airport} ({calculateLayoverDuration(segment.arrival.dateTime, nextSegment.departure.dateTime)})
                                        </span>
                                    </div>
                                    <span className="text-[11px] text-amber-800 font-medium bg-amber-100/70 px-2 py-0.5 rounded-md shrink-0">
                                        Changement d'appareil
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Footer row: Inclusions badges */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 flex-wrap gap-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        <Luggage className="w-3.5 h-3.5 text-emerald-600" />
                        {leg.checkedBaggage ? `Soute : ${leg.checkedBaggage}` : 'Sans bagage soute'}
                    </span>
                    <span className="flex items-center gap-1 font-medium bg-slate-50 px-2 py-0.5 rounded-md">
                        <Utensils className="w-3.5 h-3.5 text-sky-600" /> Collation
                    </span>
                    <span className="flex items-center gap-1 font-medium bg-slate-50 px-2 py-0.5 rounded-md">
                        <Wifi className="w-3.5 h-3.5 text-indigo-600" /> Services à bord
                    </span>
                </div>

                <span className="text-[11px] text-slate-400 font-medium">
                    Opéré par {airlineName}
                </span>
            </div>
        </div>
    );
}

export default function AggregatedFlightDetailModal({ open, onOpenChange, group, onContinue }: Props) {
    if (!group) return null;

    const displayOffers = group.offers.map(normalizeAggregatedOffer);
    const [activeOfferId, setActiveOfferId] = useState(displayOffers[0].offerId);
    const [repricedOffer, setRepricedOffer] = useState<DisplayOffer | null>(null);

    const [confirmState, setConfirmState] = useState<'idle' | 'checking' | 'changed'>('idle');
    const [confirmedOffer, setConfirmedOffer] = useState<DisplayOffer | null>(null);
    const [confirmError, setConfirmError] = useState<string | null>(null);

    const selected = displayOffers.find(o => o.offerId === activeOfferId) ?? displayOffers[0];
    const active = repricedOffer ?? selected;

    const isRefundable = active.refundable === true;
    const changeFee = active.raw.changeFee;
    const cheapestPrice = displayOffers[0].price;

    const fareScrollRef = useRef<HTMLDivElement>(null);

    const scrollFares = (direction: 'left' | 'right') => {
        if (!fareScrollRef.current) return;
        const offset = direction === 'left' ? -260 : 260;
        fareScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    };

    const handleContinueClick = async () => {
        if (!active.fareSourceCode) {
            onContinue(active);
            return;
        }
        setConfirmState('checking');
        setConfirmError(null);
        try {
            const freshRaw = await repriceFlight(active.fareSourceCode);
            const fresh = normalizeAggregatedOffer(freshRaw);

            if (fresh.price === active.price) {
                onContinue(fresh);
                setConfirmState('idle');
            } else {
                setConfirmedOffer(fresh);
                setConfirmState('changed');
            }
        } catch (err: any) {
            setConfirmError(err.message ?? 'Impossible de confirmer le prix, veuillez réessayer.');
            setConfirmState('idle');
        }
    };

    const handleAcceptNewPrice = () => {
        if (confirmedOffer) onContinue(confirmedOffer);
    };

    useEffect(() => {
        if (group) setActiveOfferId(group.offers[0].offerId);
    }, [group?.key]);

    useEffect(() => {
        setConfirmState('idle');
        setConfirmedOffer(null);
        setConfirmError(null);
    }, [activeOfferId]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="fixed inset-0 top-0 left-0 translate-x-0 translate-y-0 w-full h-[100dvh] max-w-none max-h-none rounded-none sm:top-[50%] sm:left-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:w-full sm:h-auto sm:max-w-4xl sm:max-h-[92vh] sm:rounded-3xl bg-white p-0 overflow-hidden border-0 shadow-2xl flex flex-col gap-0 [&>button]:hidden">
                <DialogTitle className="sr-only">Détails du vol</DialogTitle>
                <DialogDescription className="sr-only">Détails et options de réservation du vol</DialogDescription>
                
                {/* Modern Header */}
                <div 
                    className="bg-white px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 flex items-center justify-between shrink-0 shadow-xs z-10"
                    style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.875rem)' }}
                >
                    <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-11 h-11 rounded-2xl border border-slate-100 bg-white p-1 flex items-center justify-center shrink-0 shadow-2xs">
                            <img 
                                src={getAirlineLogo(active.airlineCode)} 
                                alt={active.airlineName}
                                className="w-9 h-9 object-contain rounded-xl"
                                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} 
                            />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="font-black text-slate-900 text-base sm:text-lg">{active.originAirport}</span>
                                <ArrowRight className="w-4 h-4 text-[#3566E3] shrink-0" />
                                <span className="font-black text-slate-900 text-base sm:text-lg">{active.destinationAirport}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                <span className="font-bold text-slate-800">{active.airlineName}</span>
                                <span>•</span>
                                <span>{active.totalDurationLabel}</span>
                                <span>•</span>
                                <span className="text-emerald-600 font-semibold">{active.isDirect ? 'Direct' : active.stopsLabel}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <div className="hidden sm:block text-right">
                            <div className="text-[11px] text-slate-400 font-medium">À partir de</div>
                            <div className="text-xl font-black text-[#0B0F2E] tabular-nums">
                                {cheapestPrice.toLocaleString('fr-FR')} {active.currency}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            aria-label="Fermer"
                            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition active:scale-95"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Modal Body - Scrollable with background image */}
                <div 
                    className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-6 relative"
                    style={{
                        backgroundImage: "linear-gradient(180deg, rgba(240, 246, 255, 0.94) 0%, rgba(248, 250, 252, 0.96) 100%), url('/assets/flights/detail.webp')",
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundAttachment: 'local',
                    }}
                >
                    
                    {/* 1. ITINÉRAIRE EN PREMIER (CARTES JUMELÉES : UNE CARTE UNIQUE PAR TRAJET ALLER / RETOUR) */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Plane className="w-4 h-4 text-[#3566E3]" />
                                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                                    Itinéraire des vols
                                </h3>
                            </div>
                            <span className="text-xs text-slate-500 font-medium">
                                {active.legs.length === 2 &&
                                active.legs[0].originAirport === active.legs[1].destinationAirport &&
                                active.legs[0].destinationAirport === active.legs[1].originAirport
                                    ? 'Aller & Retour'
                                    : `${active.legs.length} vol(s) (Multi-destinations)`}
                            </span>
                        </div>

                        {/* Each flight leg has its single unified merged card */}
                        {active.legs.map((leg, legIdx) => {
                            const isRoundTrip = active.legs.length === 2 &&
                                active.legs[0].originAirport === active.legs[1].destinationAirport &&
                                active.legs[0].destinationAirport === active.legs[1].originAirport;

                            return (
                                <FlightLegCard
                                    key={leg.originDestId || legIdx}
                                    leg={leg}
                                    legIdx={legIdx}
                                    totalLegs={active.legs.length}
                                    isRoundTrip={isRoundTrip}
                                    airlineName={active.airlineName}
                                    airlineCode={active.airlineCode}
                                    cabinName={active.cabinName}
                                />
                            );
                        })}
                    </div>

                    {/* 2. APRÈS : CONDITIONS */}
                    <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-sky-100 shadow-xs space-y-3">
                        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                            <ShieldCheck className="w-4 h-4 text-[#3566E3]" />
                            <span>Conditions & politiques du billet</span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-1">
                                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                                    Politique d'annulation
                                </div>
                                <PolicyBadge
                                    ok={isRefundable}
                                    label={isRefundable ? 'Billet remboursable' : 'Billet NON remboursable'}
                                />
                            </div>

                            <div className="space-y-1">
                                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                                    Politique de modification
                                </div>
                                <PolicyBadge
                                    ok={!!changeFee && changeFee.amount === 0}
                                    label={changeFee?.amount != null ? `Modifiable avec frais` : 'Non modifiable'}
                                />
                            </div>

                            <div className="space-y-1">
                                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                                    Bagage en soute
                                </div>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-200/90 bg-white text-xs font-semibold text-slate-700 shadow-2xs">
                                    <Luggage className="w-3.5 h-3.5 text-[#3566E3]" />
                                    {active.checkedBaggage ? `Inclus : ${active.checkedBaggage}` : 'Non inclus en soute'}
                                </span>
                            </div>
                        </div>

                        {/* Services inclus */}
                        <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-slate-600 font-medium">
                            <span className="flex items-center gap-1.5">
                                <Luggage className="w-3.5 h-3.5 text-emerald-600" />
                                Bagage cabine standard inclus
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Utensils className="w-3.5 h-3.5 text-sky-600" />
                                Collation / boisson à bord
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Wifi className="w-3.5 h-3.5 text-indigo-600" />
                                Services & divertissement
                            </span>
                        </div>
                    </div>

                    {/* 3. APRÈS : CHOIX DES TARIFS EN CARROUSEL AVEC LA PHOTO DE SIÈGES PRÉSERVÉE */}
                    <div className="space-y-3 pt-1">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-[#FFAA01]" />
                                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                                    Choix des tarifs & options ({displayOffers.length})
                                </h3>
                            </div>
                            
                            {/* Carousel controls */}
                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => scrollFares('left')}
                                    className="w-7 h-7 rounded-full bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center transition shadow-2xs"
                                    title="Précédent"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => scrollFares('right')}
                                    className="w-7 h-7 rounded-full bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center transition shadow-2xs"
                                    title="Suivant"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Options Horizontal Carousel */}
                        <div 
                            ref={fareScrollRef}
                            className="flex items-stretch gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-2 pt-1 -mx-1 px-1 select-none"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            {displayOffers.map((o) => {
                                const diff = o.price - cheapestPrice;
                                const isActive = o.offerId === activeOfferId;
                                return (
                                    <button
                                        key={o.offerId}
                                        type="button"
                                        onClick={() => setActiveOfferId(o.offerId)}
                                        className={cn(
                                            'snap-start relative shrink-0 w-60 sm:w-64 rounded-2xl overflow-hidden border-2 text-left shadow-xs transition-all flex flex-col justify-between bg-white',
                                            isActive 
                                                ? 'border-[#FFAA01] ring-2 ring-[#FFAA01]/40 shadow-lg scale-[1.01]' 
                                                : 'border-slate-200 hover:border-slate-300'
                                        )}
                                    >
                                        {/* Image Header preserved (SEAT_BG_IMAGE) */}
                                        <div
                                            className="h-28 w-full bg-slate-200 relative"
                                            style={{
                                                backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.1), rgba(0,0,0,0.5)), url('${SEAT_BG_IMAGE}')`,
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center',
                                            }}
                                        >
                                            {isActive && (
                                                <span className="absolute top-2.5 right-2.5 bg-[#FFAA01] text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                                                    <Check className="w-3 h-3" /> Sélectionné
                                                </span>
                                            )}
                                            <div className="absolute bottom-2 left-3 text-white font-extrabold text-sm drop-shadow-md">
                                                {o.brandName ?? o.cabinName ?? 'Tarif Standard'}
                                            </div>
                                        </div>

                                        {/* Card Body */}
                                        <div className="p-3.5 flex-1 flex flex-col justify-between">
                                            <div className="space-y-2 text-xs text-slate-600">
                                                <div className="flex items-center gap-1.5 font-medium">
                                                    <Luggage className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                    <span>
                                                        {o.checkedBaggage 
                                                            ? o.checkedBaggage 
                                                            : o.chargeableFirstBagPrice 
                                                            ? `Soute dès ${o.chargeableFirstBagPrice.amount} ${o.chargeableFirstBagPrice.currency}` 
                                                            : 'Sans bagage soute'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    {o.refundable ? (
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                    ) : (
                                                        <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                    )}
                                                    <span>{o.refundable ? 'Remboursable' : 'Non remboursable'}</span>
                                                </div>
                                            </div>

                                            <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-baseline justify-between">
                                                <span className="font-black text-[#0B0F2E] tabular-nums text-base">
                                                    {o.price.toLocaleString('fr-FR')} {o.currency}
                                                </span>
                                                {diff > 0 && (
                                                    <span className="text-[10px] font-bold text-amber-600">
                                                        +{diff.toLocaleString('fr-FR')} {o.currency}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {active.seatsRemaining !== null && active.seatsRemaining <= 5 && (
                        <div className="flex items-center gap-2 text-amber-800 text-xs font-semibold bg-amber-50 border border-amber-200/80 rounded-xl px-4 py-2.5">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                            Plus que {active.seatsRemaining} place{active.seatsRemaining > 1 ? 's' : ''} disponible{active.seatsRemaining > 1 ? 's' : ''} à ce tarif !
                        </div>
                    )}
                </div>

                {/* Fixed Bottom Action Bar */}
                <div 
                    className="bg-white px-4 sm:px-6 py-3.5 border-t border-slate-200 shrink-0 shadow-lg z-10"
                    style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.875rem)' }}
                >
                    {confirmState === 'changed' && confirmedOffer ? (
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                            <div>
                                <div className="text-xs text-amber-600 font-bold mb-0.5">Mise à jour du tarif détectée</div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-sm text-slate-400 line-through">
                                        {active.price.toLocaleString('fr-FR')} {active.currency}
                                    </span>
                                    <span className="text-2xl font-black tabular-nums text-[#FFAA01]">
                                        {confirmedOffer.price.toLocaleString('fr-FR')} {confirmedOffer.currency}
                                    </span>
                                </div>
                            </div>
                            <Button 
                                onClick={handleAcceptNewPrice} 
                                className="bg-[#FFAA01] hover:bg-[#E09515] text-[#0B0F2E] font-bold px-6 rounded-xl shadow-sm"
                            >
                                Accepter et continuer →
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <div className="text-[11px] text-slate-400 font-medium">Prix total TTC</div>
                                <div className="text-2xl font-black tabular-nums text-[#0B0F2E]">
                                    {active.price.toLocaleString('fr-FR')} <span className="text-base font-bold text-[#3566E3]">{active.currency}</span>
                                </div>
                                {confirmError && (
                                    <div className="text-[11px] text-red-500 mt-0.5">{confirmError}</div>
                                )}
                            </div>

                            <Button
                                onClick={handleContinueClick}
                                disabled={confirmState === 'checking'}
                                className="bg-[#FFAA01] hover:bg-[#E09515] text-[#0B0F2E] font-black text-sm sm:text-base px-6 sm:px-8 py-2.5 sm:py-3 rounded-2xl shadow-md active:scale-98 transition"
                            >
                                {confirmState === 'checking' ? 'Vérification…' : 'Choisir ce vol →'}
                            </Button>
                        </div>
                    )}
                </div>

            </DialogContent>
        </Dialog>
    );
}