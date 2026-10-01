// components/flights/ResultsHero.tsx
import { useState } from 'react';
import { Plane, FileText, CreditCard, SlidersHorizontal, ArrowLeft, Calendar, Users } from 'lucide-react';
import { cn } from '@/lib/utils.ts';
import { useNavigate } from 'react-router-dom';

import type { AggregatedSearchParams } from '@/service/flights_aggregator/aggregatedTypes.ts';
import AggregatedSearchForm from "@/components/flights/flightResults/Results_SearchCard.tsx";

type StepKey = 'recherche' | 'details' | 'paiement';

const STEPS: { key: StepKey; icon: typeof Plane; label: string }[] = [
    { key: 'recherche', icon: Plane, label: 'Recherche' },
    { key: 'details', icon: FileText, label: 'Details' },
    { key: 'paiement', icon: CreditCard, label: 'Paiement' },
];

interface Props {
    onSubmit: (params: AggregatedSearchParams) => void;
    loading?: boolean;
    initialParams?: AggregatedSearchParams | null;
    currentStep?: StepKey;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

function formatFlightDate(dateStr?: string, withWeekday = true) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('fr-FR', {
        ...(withWeekday ? { weekday: 'short' } : {}),
        day: 'numeric',
        month: 'short',
        ...(new Date().getFullYear() !== d.getFullYear() ? { year: 'numeric' } : {}),
    });
}

function getPassengerSummary(params?: AggregatedSearchParams | null) {
    const adults = params?.adults ?? 1;
    const children = params?.children ?? 0;
    const infants = params?.infants ?? 0;
    const total = adults + children + infants;

    const breakdown: string[] = [];
    if (adults > 0) breakdown.push(`${adults} ad.`);
    if (children > 0) breakdown.push(`${children} enf.`);
    if (infants > 0) breakdown.push(`${infants} bb.`);

    return {
        total,
        short: `${total} pers.`,
        full: `${total} passager${total > 1 ? 's' : ''}`,
        breakdown: breakdown.join(', '),
    };
}

function getCabinLabel(cabin?: string) {
    if (!cabin || cabin === 'Y') return 'Éco';
    if (cabin === 'C') return 'Affaires';
    if (cabin === 'F') return 'Première';
    if (cabin === 'W' || cabin === 'S') return 'Premium';
    return cabin;
}

export const ResultsHero = ({ onSubmit, loading, initialParams, currentStep = 'recherche', open, onOpenChange }: Props) => {
    const navigate = useNavigate();
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

    const isRoundTrip = Boolean(initialParams?.returnDate);
    const pax = getPassengerSummary(initialParams);
    const cabin = getCabinLabel(initialParams?.cabinClass);
    const departureDateStr = formatFlightDate(initialParams?.date, true);
    const returnDateStr = isRoundTrip ? formatFlightDate(initialParams?.returnDate, true) : null;

    return (
        <section className="relative mb-2">
            <div
                className="relative z-40 px-3 sm:px-6 md:px-16 pb-2 sm:pb-4"
                style={{
                    paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.5rem)',
                }}
            >
                {/* Stepper — desktop only, compact */}
                <div className="hidden md:flex justify-center gap-3 mb-3">
                    {STEPS.map((step, i) => {
                        const isActive = step.key === currentStep;
                        return (
                            <div key={step.key} className="flex items-center">
                                <div className="flex flex-col items-center gap-1">
                                    <div
                                        className={cn(
                                            'w-6 h-6 rounded-full flex items-center justify-center shadow-xs transition-colors',
                                            isActive ? 'bg-[#FFAA01]' : 'bg-white'
                                        )}
                                    >
                                        <step.icon className={cn('w-4 h-4', isActive ? 'text-white' : 'text-[#0454E8]')} />
                                    </div>
                                    <span
                                        className={cn(
                                            'text-[11px] font-semibold px-2 py-0.5 rounded whitespace-nowrap',
                                            isActive ? 'text-white bg-[#0454E8]' : 'text-[#0454E8] bg-white/80'
                                        )}
                                    >
                                        {step.label}
                                    </span>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div className="w-8 md:w-12 h-px bg-sky-200/80 mx-1 mb-5" />
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="max-w-6xl mx-auto">
                    {expanded ? (
                        <div className="bg-transparent rounded-2xl p-2 sm:p-4">
                            <AggregatedSearchForm
                                onSubmit={handleSubmit}
                                loading={loading}
                                initialParams={initialParams ?? undefined}
                            />
                            <div className="flex items-center gap-4 mt-3">
                                <button
                                    type="button"
                                    onClick={() => setExpanded(false)}
                                    className="text-xs font-semibold text-blue-950 hover:text-slate-600 cursor-pointer"
                                >
                                    Annuler
                                </button>
                                <span className="text-slate-300">·</span>
                                <button
                                    type="button"
                                    onClick={() => navigate('/flights')}
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#3566E3] hover:underline cursor-pointer"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                    <span>Retour aux vols</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div
                            className="w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-800 px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2.5 text-left hover:shadow-md transition-shadow"
                        >
                            {/* Bouton retour */}
                            <button
                                type="button"
                                onClick={() => navigate('/flights')}
                                title="Retour à la recherche de vols"
                                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center shrink-0 text-slate-700 dark:text-slate-200 transition active:scale-95 border border-slate-200/60 dark:border-slate-700 cursor-pointer"
                            >
                                <ArrowLeft className="w-4 h-4 text-[#3566E3]" />
                            </button>

                            {/* Contenu cliquable */}
                            <div
                                onClick={() => setExpanded(true)}
                                className="min-w-0 flex-1 cursor-pointer"
                            >
                                {/* Mobile (< sm) : 2 lignes ultra-propres et compactes */}
                                <div className="sm:hidden flex flex-col justify-center">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <span className="font-bold text-sm text-[#002161] dark:text-white truncate">
                                            {initialParams?.origin ?? '—'}
                                        </span>
                                        <span className="text-slate-300 dark:text-slate-600 font-bold">→</span>
                                        <span className="font-bold text-sm text-[#002161] dark:text-white truncate">
                                            {initialParams?.destination ?? '—'}
                                        </span>
                                        {isRoundTrip ? (
                                            <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-[#0454E8] dark:bg-blue-950/60 dark:text-blue-300">
                                                A/R
                                            </span>
                                        ) : (
                                            <span className="shrink-0 text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                                Simple
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate font-medium">
                                        <span className="flex items-center gap-1 shrink-0 text-slate-700 dark:text-slate-200">
                                            <Calendar className="w-3 h-3 text-[#3566E3] shrink-0" />
                                            <span>{departureDateStr}</span>
                                            {isRoundTrip && (
                                                <>
                                                    <span className="text-slate-400">→</span>
                                                    <span>{returnDateStr}</span>
                                                </>
                                            )}
                                        </span>
                                        <span className="text-slate-300 dark:text-slate-600">·</span>
                                        <span className="flex items-center gap-1 shrink-0 text-slate-700 dark:text-slate-200">
                                            <Users className="w-3 h-3 text-[#3566E3] shrink-0" />
                                            <span>{pax.short}</span>
                                            <span className="text-slate-400 font-normal">({cabin})</span>
                                        </span>
                                    </div>
                                </div>

                                {/* Tablette & Desktop (>= sm) : alignement horizontal aéré mais compact */}
                                <div className="hidden sm:flex items-center gap-4 lg:gap-6 flex-wrap min-w-0">
                                    {/* Trajet */}
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                            <span>Trajet</span>
                                            {isRoundTrip && (
                                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-[#0454E8] dark:bg-blue-950/60 dark:text-blue-300">
                                                    A/R
                                                </span>
                                            )}
                                        </p>
                                        <p className="text-sm lg:text-base font-black text-[#002161] dark:text-white truncate flex items-center gap-1.5">
                                            <span>{initialParams?.origin ?? '—'}</span>
                                            <span className="text-slate-300 dark:text-slate-600 font-normal">→</span>
                                            <span>{initialParams?.destination ?? '—'}</span>
                                        </p>
                                    </div>

                                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />

                                    {/* Dates Aller & Retour */}
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                            <Calendar className="w-3 h-3 text-[#3566E3]" />
                                            <span>{isRoundTrip ? 'Dates (Aller - Retour)' : 'Date départ'}</span>
                                        </p>
                                        <p className="text-xs lg:text-sm font-bold text-[#002161] dark:text-white truncate flex items-center gap-1.5">
                                            <span className="capitalize">{departureDateStr}</span>
                                            {isRoundTrip ? (
                                                <>
                                                    <span className="text-slate-400 font-normal mx-0.5">au</span>
                                                    <span className="capitalize">{returnDateStr}</span>
                                                </>
                                            ) : (
                                                <span className="text-slate-400 font-normal ml-1">(Aller simple)</span>
                                            )}
                                        </p>
                                    </div>

                                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />

                                    {/* Passagers & Classe */}
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                            <Users className="w-3 h-3 text-[#3566E3]" />
                                            <span>Voyageurs</span>
                                        </p>
                                        <p className="text-xs lg:text-sm font-bold text-[#002161] dark:text-white truncate">
                                            <span>{pax.full}</span>
                                            {pax.breakdown && (
                                                <span className="text-slate-400 font-normal text-xs ml-1">({pax.breakdown})</span>
                                            )}
                                            <span className="text-slate-400 font-normal ml-1.5 text-xs">· {cabin}</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Bouton Modifier */}
                            <button
                                type="button"
                                onClick={() => setExpanded(true)}
                                className="shrink-0 flex items-center gap-1.5 bg-[#FFAA01] hover:bg-[#FFAA01]/90 text-white text-xs sm:text-sm font-bold px-3 sm:px-4 py-2 sm:py-2 rounded-xl transition active:scale-95 shadow-xs hover:shadow-sm cursor-pointer"
                            >
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                                <span>Modifier</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default ResultsHero;