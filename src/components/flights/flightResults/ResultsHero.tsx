// components/flights/ResultsHero.tsx
import { useState } from 'react';
import {Plane, FileText, CreditCard, Search, SlidersHorizontal, ArrowRight} from 'lucide-react';
import { cn } from '@/lib/utils.ts';

import type { AggregatedSearchParams } from '@/service/flights_aggregator/aggregatedTypes.ts';
import AggregatedSearchForm from "@/components/flights/flightResults/Results_SearchCard.tsx";
import { ArrowLeftRight, CalendarDays, User, Armchair } from 'lucide-react';
import PlaneSeatIcon from "@/components/icons/PlaneSeatIcon.tsx";

const CABIN_LABELS = { Y: 'Économy', W: 'Premium Éco', C: 'Affaires', F: 'Première' };

const InfoItem = ({ icon: Icon, label, children, className = '' }) => (
    <div className={`flex items-center gap-3 min-w-0 px-6 first:pl-0 ${className}`}>
        <Icon className="w-5 h-5 shrink-0 text-[#002161]" strokeWidth={1.75} />
        <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 leading-tight">{label}</p>
            <p className="text-sm md:text-base font-bold text-[#002161] truncate leading-tight mt-0.5">{children}</p>
        </div>
    </div>
);

const fmtShort = (v?: string) =>
    v ? new Date(v + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—';

function MobileSearchSummary({ params }: { params?: AggregatedSearchParams | null }) {
    const isMulti = !!params?.legs?.length;
    const isRoundtrip = !!params?.returnDate;

    const origin = isMulti ? params!.legs![0].origin : params?.origin;
    const destination = isMulti ? params!.legs![params!.legs!.length - 1].destination : params?.destination;
    const firstDate = isMulti ? params!.legs![0].date : params?.date;

    const dates = isRoundtrip
        ? `${fmtShort(firstDate)} – ${fmtShort(params?.returnDate)}`
        : fmtShort(firstDate);

    const total = (params?.adults ?? 1) + (params?.children ?? 0) + (params?.infants ?? 0);
    const cabin = params?.cabinClass ? CABIN_LABELS[params.cabinClass] ?? params.cabinClass : null;
    const RouteArrow = isRoundtrip ? ArrowLeftRight : ArrowRight;

    return (
        <div className="min-w-0 sm:hidden">
            <div className="flex items-center gap-1.5 text-[15px] font-bold text-[#002161] leading-tight">
                <Plane className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                <span className="truncate">{origin ?? '—'}</span>
                <RouteArrow className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                <span className="truncate">{destination ?? '—'}</span>
                {isMulti && (
                    <span className="ml-1 text-[11px] font-semibold text-slate-400">
            ({params!.legs!.length} vols)
          </span>
                )}
            </div>

            <div className="mt-1 flex items-center flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
        <span className="flex items-center gap-1 whitespace-nowrap">
          <CalendarDays className="w-3.5 h-3.5 shrink-0 text-[#002161]" strokeWidth={1.75} />
            {dates}
        </span>
                <span className="flex items-center gap-1 whitespace-nowrap">
          <User className="w-3.5 h-3.5 shrink-0 text-[#002161]" strokeWidth={1.75} />
                    {total}
        </span>
                {cabin && (
                    <span className="flex items-center gap-1 whitespace-nowrap">
            <PlaneSeatIcon className="w-3.5 h-3.5 shrink-0 text-[#002161]" />
                        {cabin}
          </span>
                )}
            </div>
        </div>
    );
}

type StepKey = 'recherche' | 'details' | 'paiement';

const STEPS: { key: StepKey; icon: typeof Plane; label: string }[] = [
    { key: 'recherche', icon: Plane, label: 'Recherche' },
    { key: 'details', icon: FileText, label: 'Details' },
    { key: 'paiement', icon: CreditCard, label: 'Paiement' },
];

interface Props {
    onSubmit: (params: AggregatedSearchParams) => void;
    loading?: boolean;
    initialParams?: AggregatedSearchParams;
    currentStep?: StepKey;
    open?: boolean;                 // NEW — controlled from parent when provided
    onOpenChange?: (open: boolean) => void; // NEW
}

function formatDate(dateStr?: string) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function passengerLabel(params?: AggregatedSearchParams) {
    if (!params) return '';
    const total = (params.adults ?? 1) + (params.children ?? 0) + (params.infants ?? 0);
    const cabin = params.cabinClass ?? 'Économie';
    return `${total} passager${total > 1 ? 's' : ''} · ${cabin}`;
}

export const ResultsHero = ({ onSubmit, loading, initialParams, currentStep = 'recherche',open,onOpenChange }: Props) => {
    const [internalExpanded, setInternalExpanded] = useState(false);
    const expanded = open ?? internalExpanded;
    const setExpanded = (v: boolean) => {
        setInternalExpanded(v);
        onOpenChange?.(v);
    };

    function handleSubmit(params: AggregatedSearchParams) {
        setExpanded(false);
        onSubmit(params);
    }

    return (
        <section className="relative mb-5">
            <img
                src="/assets/flights/resulthero.webp"
                alt="Destination"
                className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/10" />
            <div className="absolute inset-x-0 bottom-0 h-24 md:h-32 bg-gradient-to-t from-[#DFECFF] to-transparent" />

            <div className="relative z-40 px-5 md:px-16 pt-16 md:pt-12 pb-8 md:pb-6">

                {/* Stepper — desktop only */}
                <div className="hidden md:flex justify-center gap-3 mt-6 mb-2">
                    {STEPS.map((step, i) => {
                        const isActive = step.key === currentStep;
                        return (
                            <div key={step.key} className="flex items-center">
                                <div className="flex flex-col items-center gap-1.5">
                                    <div
                                        className={cn(
                                            'w-7 h-7 rounded-full flex items-center justify-center shadow-md transition-colors',
                                            isActive ? 'bg-[#FFAA01]' : 'bg-white'
                                        )}
                                    >
                                        <step.icon className={cn('w-5 h-5', isActive ? 'text-white' : 'text-[#0454E8]')} />
                                    </div>
                                    <span
                                        className={cn(
                                            'text-xs font-semibold px-2 py-0.5 rounded whitespace-nowrap',
                                            isActive ? 'text-white bg-[#0454E8]' : 'text-[#0454E8] bg-white/80'
                                        )}
                                    >
                                        {step.label}
                                    </span>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div className="w-8 md:w-12 h-px bg-white/60 mx-1 mb-6" />
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="max-w-6xl mx-auto pt-6">
                    {expanded ? (
                        <div className="bg-transparent rounded-2xl  p-4 md:p-5">
                            <AggregatedSearchForm
                                onSubmit={handleSubmit}
                                loading={loading}
                                initialParams={initialParams}
                            />
                            <button
                                type="button"
                                onClick={() => setExpanded(false)}
                                className="mt-3 text-xs font-medium text-blue-950 hover:text-slate-600"
                            >
                                Annuler
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setExpanded(true)}
                            className="w-full bg-gray-100 rounded-sm shadow-sm px-5 py-2 flex items-center justify-between gap-4 text-left hover:shadow-2xl transition-shadow"
                        >
                            <MobileSearchSummary params={initialParams} />
                            <div className="hidden sm:flex items-center flex-wrap gap-y-3 min-w-0 divide-x divide-slate-200">


                                <InfoItem icon={Plane} label="Trajet">
                                    {initialParams?.origin ?? '—'}
                                    <ArrowLeftRight className="inline w-4 h-4 mx-1.5 text-slate-400 align-[-2px]" />
                                    {initialParams?.destination ?? '—'}
                                </InfoItem>

                                <InfoItem icon={CalendarDays} label={initialParams?.returnDate ? 'Dates' : 'Départ'} className="hidden sm:flex">
                                    {formatDate(initialParams?.date)}
                                    {initialParams?.returnDate && ` - ${formatDate(initialParams.returnDate)}`}
                                </InfoItem>

                                <InfoItem icon={User} label="Passagers" className="hidden md:flex">
                                    {passengerLabel(initialParams)}
                                </InfoItem>

                                {initialParams?.cabinClass && (
                                    <InfoItem icon={PlaneSeatIcon} label="Classe" className="hidden lg:flex">
                                        {CABIN_LABELS[initialParams.cabinClass] ?? initialParams.cabinClass}
                                    </InfoItem>
                                )}
                            </div>

                            <span className="shrink-0 flex items-center gap-2 bg-[#FFAA01] text-white text-sm font-semibold px-4 py-2.5 rounded-xl">
                                <SlidersHorizontal className="w-4 h-4" />
                                Modifier
                            </span>
                        </button>
                    )}
                </div>
            </div>
        </section>
    );
};

export default ResultsHero;