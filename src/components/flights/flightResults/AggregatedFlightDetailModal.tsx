// src/components/Flights/AggregatedFlightDetailModal.tsx
import { X, Plane, CheckCircle, XCircle, Luggage, AlertTriangle, Wifi, Utensils } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog.tsx';
import { Button } from '@/components/ui/button.tsx';
import { cn } from '@/lib/utils.ts';
import { getAirlineLogo } from '@/service/flights/airlines.ts';
import { normalizeAggregatedOffer } from '@/service/flights_aggregator/aggregatedNormalize.ts';
import type { FlightIdentityGroup } from '@/service/flights_aggregator/aggregatedNormalize.ts';
import type { DisplayOffer } from '@/service/flights_aggregator/aggregatedNormalize.ts';
import { repriceFlight } from '@/service/flights_aggregator/aggregatedSearch.service.ts';

import {useEffect, useRef, useState} from "react";
import { formatFlightDateTime } from '@/lib/flightTime';

interface Props {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    group: FlightIdentityGroup | null;
    onContinue: (offer: DisplayOffer) => void;
}

const LEG_LABELS = ['Aller', 'Retour'];

// TODO: replace with your own hosted cabin/seat photo(s) — this is a placeholder
const SEAT_BG_IMAGE = 'https://images.unsplash.com/photo-1540339832862-474599807836?q=80&w=600&auto=format&fit=crop';

function PolicyBadge({ ok, label }: { ok: boolean; label: string }) {
    return (
        <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium',
            ok ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-600')}>
            {ok ? <CheckCircle className="w-3.5 h-3.5 shrink-0" /> : <XCircle className="w-3.5 h-3.5 shrink-0" />}
            {label}
        </span>
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
    const cancellationFee = active.raw.cancellationFee;
    const multiLeg = active.legs.length > 1;
    const cheapestPrice = displayOffers[0].price;

    const fareScrollRef = useRef<HTMLDivElement>(null);
    const fareDraggingRef = useRef(false);
    const fareDragStartXRef = useRef(0);
    const fareScrollStartLeftRef = useRef(0);

    function handleFareMouseLeave() {
        fareDraggingRef.current = false;
    }

    function handleFareMouseUp() {
        fareDraggingRef.current = false;
    }

    function handleFareMouseMove(e: React.MouseEvent) {
        if (!fareDraggingRef.current || !fareScrollRef.current) return;
        e.preventDefault();
        const x = e.pageX - fareScrollRef.current.offsetLeft;
        const walk = x - fareDragStartXRef.current;
        fareScrollRef.current.scrollLeft = fareScrollStartLeftRef.current - walk;
    }

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
            <DialogContent
                className="w-screen h-[100dvh] max-w-none rounded-none sm:w-full sm:h-auto sm:max-w-4xl sm:max-h-[90vh] sm:rounded-2xl bg-transparent overflow-hidden border-0 shadow-2xl flex flex-col p-0 gap-0 [&>button]:hidden"
            >

                {/* Header */}
                <div className="flex items-center justify-between bg-white sm:rounded-xl border-b-2 sm:border-2 border-[#247FD4] px-4 sm:px-6 py-3 sm:py-2 shrink-0">
                    <div className="flex items-center gap-4 flex-wrap">
                        <img src={getAirlineLogo(active.airlineCode)} alt={active.airlineCode}
                             className="w-9 h-9 object-contain rounded-full border border-slate-100 bg-white p-1 shrink-0"
                             onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                        <div className="flex items-center gap-2 text-sm">
                            <span className="font-bold text-slate-900">{active.originAirport}</span>
                            <span className="text-[#0454E8]">⇄</span>
                            <span className="font-bold text-slate-900">{active.destinationAirport}</span>
                        </div>
                        <div className="hidden sm:block text-sm text-slate-500">{active.totalDurationLabel}</div>
                        <div className="hidden sm:flex items-center gap-1.5 text-sm">
                            <span className="text-slate-400">À partir de</span>
                            <span className="font-bold text-[#0454E8] tabular-nums">
                {cheapestPrice.toLocaleString('fr-FR')} {active.currency}
            </span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        aria-label="Fermer"
                        className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 -mr-1"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div   className="overflow-y-auto rounded-none sm:rounded-xl border-t-0 sm:border-2 border-[#247FD4] flex-1 min-h-0 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-xl hover:[&::-webkit-scrollbar-thumb]:bg-slate-400"
                       style={{
                           backgroundImage:
                               "url('/assets/flights/detail.webp')",
                           backgroundSize: 'cover',
                           backgroundPosition: 'center',
                           backgroundAttachment: 'local',
                       }}>

                    <div
                        className="relative px-4 sm:px-6 py-6">
                        <div className="flex items-center gap-2 mb-3">
                            <Plane className="w-4 h-4 text-[#0454E8]" />
                            <h3 className="text-sm font-bold text-slate-900">Détails d'itinéraire</h3>
                        </div>

                        {/* Boxed itinerary panel */}
                        <div className={cn(
                            'rounded-xl  ',
                            multiLeg && 'grid grid-cols-1 md:grid-cols-2 gap-4 divide-y md:divide-y-0 md:divide-x divide-[#A7BEE8]'
                        )}>
                            {active.legs.map((leg, legIdx) => (
                                <div key={leg.originDestId} className={cn(multiLeg && 'md:pl-4 md:first:pl-0 pt-4 first:pt-0')}>
                                    {multiLeg && (
                                        <div className="text-xs font-bold text-[#F5A623] uppercase tracking-wider mb-2">
                                            {LEG_LABELS[legIdx] ?? `Vol ${legIdx + 1}`}
                                        </div>
                                    )}
                                    <div className="space-y-0">
                                        {leg.segments.map((s, i) => (
                                            <div key={s.paxSegmentRefId ?? i}>
                                                <div className="text-xs font-semibold text-[#0454E8] flex items-center gap-1.5 mb-1.5">
                                                    <Plane className="w-3 h-3 text-[#F5A623]" />
                                                    {s.carrierCode}{s.flightNumber}
                                                </div>
                                                <div className="text-sm">
                                                    <div className="font-bold text-slate-900 tabular-nums">
                                                        <div className="font-bold text-slate-900 tabular-nums">{formatFlightDateTime(s.departure.dateTime)}</div>
                                                    </div>
                                                    <div className="text-xs text-slate-500 mb-2">{s.departure.airport} {s.departure.stationName ?? ''}</div>
                                                    <div className="font-bold text-slate-900 tabular-nums">
                                                        <div className="font-bold text-slate-900 tabular-nums">{formatFlightDateTime(s.arrival.dateTime)}</div>                                                    </div>
                                                    <div className="text-xs text-slate-500">{s.arrival.airport} {s.arrival.stationName ?? ''}</div>
                                                </div>
                                                {i < leg.segments.length - 1 && (
                                                    <div className="my-3 md:w-5/12 flex items-center gap-2 text-xs font-semibold text-blue-500 bg-[#FEC425]  px-3 py-1.5">
                                                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                                        Escale
                                                    </div>
                                                )}
                                                {i === leg.segments.length - 1 && (
                                                    <div className="mt-2">
                                                        {leg.checkedBaggage ? (
                                                            <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-medium">
                <Luggage className="w-3.5 h-3.5"/> Bagage inclus ({leg.checkedBaggage})
            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 text-red-600 text-xs font-medium">
                <Luggage className="w-3.5 h-3.5"/> Bagage non inclus
            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Policy row */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                            <div>
                                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1.5">Politique d'annulation</div>
                                <PolicyBadge
                                    ok={isRefundable}
                                    label={isRefundable ? 'Remboursable' : 'Billet NON Remboursable'}
                                />
                            </div>
                            <div>
                                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1.5">Politique de modification</div>
                                <PolicyBadge
                                    ok={!!changeFee && changeFee.amount === 0}
                                    label={changeFee?.amount != null ? `Modifiable avec frais ` : 'Non modifiable'}
                                />
                            </div>
                            <div>
                                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1.5">Prestations incluses</div>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-200 bg-white text-xs font-medium text-slate-700">
                                    <Luggage className="w-3.5 h-3.5 text-[#0454E8]" />
                                    Bagage en soute {active.checkedBaggage ?? 'non inclus'}
                                </span>
                            </div>
                        </div>

                        {/* Services inclus */}
                        <div className="mt-4">
                            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1.5">Services Inclus</div>
                            <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-slate-700">
                                <span className="flex items-center gap-1">
                                    <Luggage className="w-3.5 h-3.5 text-emerald-500" />
                                    Baggage: {active.checkedBaggage
                                    ? active.checkedBaggage
                                    : active.chargeableFirstBagPrice
                                    ? `à partir de ${active.chargeableFirstBagPrice.amount.toLocaleString('fr-FR')} ${active.chargeableFirstBagPrice.currency}`
                                    : 'Non inclus'}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Utensils className="w-3.5 h-3.5 text-emerald-500" /> Meal: Snack Or Drink
                                </span>
                                <span className="flex items-center gap-1">
                                    <Wifi className="w-3.5 h-3.5 text-emerald-500" /> Travel-Services: Wifi-Connection
                                </span>
                            </div>
                        </div>

                        {/* Fare picker — horizontal image-backed cards */}
                        <div
                            ref={fareScrollRef}
                            onMouseDown={handleFareMouseUp}
                            onMouseLeave={handleFareMouseLeave}
                            onMouseUp={handleFareMouseUp}
                            onMouseMove={handleFareMouseMove}
                            className="mt-5 flex items-center gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden cursor-grab active:cursor-grabbing select-none"
                        >
                            {displayOffers.map((o) => {
                                const diff = o.price - cheapestPrice;
                                const isActive = o.offerId === activeOfferId;
                                return (
                                    <button
                                        key={o.offerId}
                                        onClick={() => setActiveOfferId(o.offerId)}
                                        className={cn(
                                            'relative shrink-0 w-56 rounded-sm overflow-hidden border-2 text-left shadow-sm transition',
                                            isActive ? 'border-[#F5A623] shadow-md' : 'border-slate-200 hover:border-slate-300'
                                        )}
                                    >
                                        <div
                                            className="h-32 w-full bg-slate-200"
                                            style={{
                                                backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.05), rgba(0,0,0,0.35)), url('${SEAT_BG_IMAGE}')`,
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center',
                                            }}
                                        />
                                        <div className="bg-white p-3">
                                            <div className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-1.5">
                                                {o.brandName ?? o.cabinName ?? 'Tarif'}
                                            </div>
                                            <div className="space-y-1 text-[11px] text-slate-600">
                                            <span className="flex items-center gap-1">
                                                <Luggage className="w-3.5 h-3.5 text-emerald-500" />
                                                Baggage: {o.checkedBaggage
                                                ? o.checkedBaggage
                                                : o.chargeableFirstBagPrice
                                                    ? `à partir de ${o.chargeableFirstBagPrice.amount.toLocaleString('fr-FR')} ${o.chargeableFirstBagPrice.currency}`
                                                    : 'Non inclus'}
                                            </span>
                                                <div className="flex items-center gap-1.5">
                                                    {o.refundable ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : <XCircle className="w-3 h-3 text-red-400" />}
                                                    Remboursable: {o.refundable ? 'OUI' : 'NON'}
                                                </div>
                                            </div>
                                            <div className="mt-2 pt-2 border-t border-slate-100 flex items-baseline justify-between">
                                                <span className="font-bold text-[#F5A623] tabular-nums text-sm">
                                                    {o.price.toLocaleString('fr-FR')} {o.currency}
                                                </span>
                                                {diff > 0 && (
                                                    <span className="text-[10px] text-green-600">+{diff.toLocaleString('fr-FR')} DZD</span>
                                                )}
                                            </div>

                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {active.seatsRemaining !== null && active.seatsRemaining <= 5 && (
                            <div className="flex items-center gap-1.5 text-amber-700 text-xs font-medium bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-4 w-fit">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Plus que {active.seatsRemaining} place{active.seatsRemaining > 1 ? 's' : ''} disponible{active.seatsRemaining > 1 ? 's' : ''}
                            </div>
                        )}
                        <div className="bg-opacity-70 bg-white mt-4 rounded-sm p-4">
                        {confirmState === 'changed' && confirmedOffer ? (
                            <div className="flex items-center justify-between gap-4 flex-wrap">
                                <div>
                                    <div className="text-xs text-amber-600 font-medium mb-1">Le prix a changé</div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-sm text-slate-400 line-through">{active.price.toLocaleString('fr-FR')} {active.currency}</span>
                                        <span className="text-2xl font-bold tabular-nums text-[#F5A623]">
                                        {confirmedOffer.price.toLocaleString('fr-FR')} {confirmedOffer.currency}
                                    </span>
                                    </div>
                                </div>
                                <Button onClick={handleAcceptNewPrice} className="bg-[#FFAA01] hover:bg-[#E09515] text-[#002161] font-bold px-6">
                                    Accepter et continuer →
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between gap-4 flex-wrap">
                                <div>
                                    <div className="text-2xl font-bold tabular-nums text-[#002161]">
                                        {active.price.toLocaleString('fr-FR')} {active.currency}
                                        <span className="text-xs font-normal text-slate-400 ml-2">Ancien tarif de changement</span>
                                    </div>
                                    {active.instantTicketingRequired && (
                                        <div className="text-[11px] text-amber-600 mt-1">Émission immédiate requise</div>
                                    )}
                                    {confirmError && (
                                        <div className="text-[11px] text-red-500 mt-1">{confirmError}</div>
                                    )}
                                </div>
                                <Button
                                    onClick={handleContinueClick}
                                    disabled={confirmState === 'checking'}
                                    className="bg-[#FFAA01] hover:bg-[#E09515] text-[#0B0F2E] font-bold px-6"
                                >
                                    {confirmState === 'checking' ? 'Vérification du prix…' : 'Choisir ce vol'}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}