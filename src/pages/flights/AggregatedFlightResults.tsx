import React, {useEffect, useMemo, useState} from 'react';
import { searchFlightsAggregated } from '@/service/flights_aggregator/aggregatedSearch.service';
import {FlightIdentityGroup, groupByFlightIdentity, normalizeAggregatedOffer} from '@/service/flights_aggregator/aggregatedNormalize';
import AggregatedFlightCard from '@/components/flights/flightResults/AggregatedFlightCard.tsx';
import type { AggregatedSearchParams } from '@/service/flights_aggregator/aggregatedTypes';
import type { DisplayOffer } from '@/service/flights_aggregator/aggregatedNormalize';
import AggregatedFlightDetailModal from "@/components/flights/flightResults/AggregatedFlightDetailModal.tsx";
import { encodeSearchParams, decodeSearchParams } from '@/service/flights_aggregator/SearchParmsCodec.ts';
import { getNearbyDates, NearbyDatePrice } from '@/service/flights_aggregator/aggregatedSearch.service';
import NearbyDatesCarousel from '../../components/flights/NearbyDatesCarousel';
import {CalendarSearch, Loader2, ArrowLeft} from 'lucide-react';
import FilterPanel from '@/components/flights/flightResults/FilterPanel.tsx';
import { offerMatchesFilters, defaultFilters, type Filters } from '@/service/flights_aggregator/filterHelpers';
import FilterPillBar from '@/components/flights/flightResults/mobileFilters/FilterPillBar';
import FlightSearchLoadingOverlay from '@/components/flights/FlightSearchLoadingOverlay';
import { useStaleResultsPrompt } from '@/hooks/useStaleResultsPrompt';
import { StaleResultsModal } from '@/components/flights/flightResults/StaleResultsModal';

import { useRef } from 'react';

import { cn } from "@/lib/utils.ts";
import {getAirlineLogo} from "@/service/flights/airlines.ts";
import {useNavigate, useSearchParams} from "react-router-dom";
import ResultsHero from "@/components/flights/flightResults/ResultsHero.tsx";

const PROVIDER_LABELS: Record<string, string> = {
    TK_NDC: 'Turkish Airlines Direct',
    AMADEUS: 'Amadeus',
};
interface PlaneIconProps {
    className?: string;
}
function PlaneIcon({ className }: PlaneIconProps) {
    return <img src="/planeicon.png" alt="" className={className} draggable={false} />;
}
export default function AggregatedFlightResults() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [providerFilter, setProviderFilter] = useState<string | null>(null);
    const [quickAirline, setQuickAirline] = useState<string | null>(null);
    const [selectedGroup, setSelectedGroup] = useState<FlightIdentityGroup | null>(null);
    const [flightGroups, setFlightGroups] = useState<FlightIdentityGroup[]>([]);
    const [lastSearchParams, setLastSearchParams] = useState<AggregatedSearchParams | null>(null);
    const [urlParams, setUrlParams] = useSearchParams();

    const [nearbyDates, setNearbyDates] = useState<NearbyDatePrice[] | null>(null);
    const [nearbyDatesLoading, setNearbyDatesLoading] = useState(false);
    const [nearbyDatesError, setNearbyDatesError] = useState<string | null>(null);
    const [pendingParams, setPendingParams] = useState<AggregatedSearchParams | null>(null);


    const airlineScrollRef = useRef<HTMLDivElement>(null);
    const isDraggingRef = useRef(false);
    const dragStartXRef = useRef(0);
    const scrollStartLeftRef = useRef(0);

    const [searchFormOpen, setSearchFormOpen] = useState(false);


    const [filters, setFilters] = useState<Filters>(defaultFilters(200000));
    const PAGE_SIZE = 20;
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

    const visibleGroups = flightGroups.filter((g) => {
        const cheapest = normalizeAggregatedOffer(g.offers[0]);
        return (!providerFilter || cheapest.provider === providerFilter) &&
            (!quickAirline || cheapest.airlineCode === quickAirline);
    });

    const offers = useMemo(
        () => flightGroups.map((g) => normalizeAggregatedOffer(g.offers[0])),
        [flightGroups]
    );

    const maxAvailablePrice = useMemo(
        () => (offers.length ? Math.max(...offers.map((o) => o.price)) : 200000),
        [offers]
    );

    const isRoundTrip = useMemo(() => offers.some((o) => o.legs.length > 1), [offers]);

    const filteredGroups = visibleGroups.filter((g) =>
        offerMatchesFilters(normalizeAggregatedOffer(g.offers[0]), filters)
    );
    const sortedGroups = [...filteredGroups].sort((a, b) => {
        const ca = normalizeAggregatedOffer(a.offers[0]);
        const cb = normalizeAggregatedOffer(b.offers[0]);
        switch (filters.sort) {
            case 'price-desc': return cb.price - ca.price;
            case 'duration': return ca.totalMinutes - cb.totalMinutes;
            case 'departure': return ca.departureTime.localeCompare(cb.departureTime);
            case 'arrival': return ca.arrivalTime.localeCompare(cb.arrivalTime);
            default: return ca.price - cb.price; // price-asc
        }
    });

    const { showPrompt, resetTimer, dismissWithRefresh, dismissWithNewSearch } = useStaleResultsPrompt({
        active: flightGroups.length > 0 && !loading,
        onRefresh: async () => {
            if (lastSearchParams) await runSearch(lastSearchParams);
        },
    })


    function handleAirlineMouseDown(e: React.MouseEvent) {
        if (!airlineScrollRef.current) return;
        isDraggingRef.current = true;
        dragStartXRef.current = e.pageX - airlineScrollRef.current.offsetLeft;
        scrollStartLeftRef.current = airlineScrollRef.current.scrollLeft;
    }

    function handleAirlineMouseLeave() {
        isDraggingRef.current = false;
    }

    function handleAirlineMouseUp() {
        isDraggingRef.current = false;
    }

    function handleAirlineMouseMove(e: React.MouseEvent) {
        if (!isDraggingRef.current || !airlineScrollRef.current) return;
        e.preventDefault();
        const x = e.pageX - airlineScrollRef.current.offsetLeft;
        const walk = x - dragStartXRef.current;
        airlineScrollRef.current.scrollLeft = scrollStartLeftRef.current - walk;
    }

    const availableProviders = useMemo(() => {
        const set = new Set(offers.map((o) => o.provider));
        return Array.from(set);
    }, [offers]);

    const airlineChips = useMemo(() => {
        const scoped = providerFilter
            ? offers.filter((o) => o.provider === providerFilter)
            : offers;

        const byAirline = new Map<string, { code: string; name: string; min: number; currency: string; count: number }>();
        for (const o of scoped) {
            const existing = byAirline.get(o.airlineCode);
            if (!existing) {
                byAirline.set(o.airlineCode, { code: o.airlineCode, name: o.airlineName, min: o.price, currency: o.currency, count: 1 });
            } else {
                existing.count += 1;
                if (o.price < existing.min) existing.min = o.price;
            }
        }
        return Array.from(byAirline.values()).sort((a, b) => a.min - b.min);
    }, [offers, providerFilter]);

    const handleProviderFilterChange = (p: string | null) => {
        setProviderFilter(p);
        setQuickAirline(null);
    };

    async function runSearch(params: AggregatedSearchParams) {
        setLoading(true);
        setError(null);
        setPendingParams(params);
        try {
            const raw = await searchFlightsAggregated(params);
            const groups = groupByFlightIdentity(raw);
            setFlightGroups(groups);
            setLastSearchParams(params);
            handleProviderFilterChange(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleShowNearbyDates() {
        if (!lastSearchParams || nearbyDatesLoading) return;
        setNearbyDatesLoading(true);
        setNearbyDatesError(null);
        try {
            const results = await getNearbyDates({
                origin: lastSearchParams.origin,
                destination: lastSearchParams.destination,
                date: lastSearchParams.date,
                dateWindowDays: 3,
                adults: lastSearchParams.adults,
                children: lastSearchParams.children,
                infants: lastSearchParams.infants,
                cabinClass: lastSearchParams.cabinClass,
            });
            setNearbyDates(results);
        } catch (err: any) {
            setNearbyDatesError(err.message);
        } finally {
            setNearbyDatesLoading(false);
        }
    }


    function handleSelectNearbyDate(date: string) {
        if (!lastSearchParams) return;
        setUrlParams(encodeSearchParams({ ...lastSearchParams, date }));
    }

    useEffect(() => {
        setVisibleCount(PAGE_SIZE);
    }, [filters, lastSearchParams]);

    const paginatedGroups = sortedGroups.slice(0, visibleCount);

    useEffect(() => {
        const parsed = decodeSearchParams(urlParams);
        if (parsed) runSearch(parsed);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [urlParams.toString()]);

    function handleFormSubmit(params: AggregatedSearchParams) {
        setUrlParams(encodeSearchParams(params));
    }

    function handleSelect(group: FlightIdentityGroup) {
        setSelectedGroup(group);
        setModalOpen(true);
        resetTimer();
    }

    function handleContinue(offer: DisplayOffer) {
        setModalOpen(false);
        sessionStorage.setItem('pendingFlightBooking', JSON.stringify({ offer, searchParams: lastSearchParams }));
        navigate('/flights/booking', { state: { offer, searchParams: lastSearchParams } });
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#DFECFF] via-[#F0F6FF] to-[#DFECFF] pb-24">

            <FlightSearchLoadingOverlay
                active={loading}
                origin={pendingParams?.origin}
                destination={pendingParams?.destination}
            />
            {searchFormOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs"
                    aria-hidden="true"
                />
            )}
            <ResultsHero
                onSubmit={handleFormSubmit}
                loading={loading}
                initialParams={decodeSearchParams(urlParams)}
                open={searchFormOpen}
                onOpenChange={setSearchFormOpen}
            />

            <div className="max-w-6xl mx-auto px-4 md:px-4 pb-10">
            {error && <p className="text-red-600 mt-4">{error}</p>}
                {lastSearchParams && !loading && flightGroups.length > 0 && (
                    <div className="mb-5">
                        {!nearbyDates && (
                            <button
                                type="button"
                                onClick={handleShowNearbyDates}
                                disabled={nearbyDatesLoading}
                                className="flex items-center gap-2 text-sm font-semibold text-[#0454E8] hover:underline disabled:opacity-60 bg-white/70 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-sky-100 shadow-2xs"
                            >
                                {nearbyDatesLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <CalendarSearch className="w-4 h-4" />
                                )}
                                {nearbyDatesLoading ? 'Recherche des dates proches...' : 'Voir les prix des dates proches'}
                            </button>
                        )}

                        {nearbyDatesError && (
                            <p className="text-sm text-amber-600 mt-2">{nearbyDatesError}</p>
                        )}

                        {nearbyDates && nearbyDates.length > 0 && (
                            <NearbyDatesCarousel
                                dates={nearbyDates}
                                selectedDate={lastSearchParams.date}
                                onSelectDate={handleSelectNearbyDate}
                            />
                        )}
                    </div>
                )}

                {/* Airlines chips carousel - visible on both mobile and desktop */}
                <div className="w-full min-w-0 mb-5">
                    <div
                        ref={airlineScrollRef}
                        onMouseDown={handleAirlineMouseDown}
                        onMouseLeave={handleAirlineMouseLeave}
                        onMouseUp={handleAirlineMouseUp}
                        onMouseMove={handleAirlineMouseMove}
                        className={cn(
                            'flex overflow-x-auto snap-x scrollbar-none pb-2 pt-1 cursor-grab active:cursor-grabbing select-none'
                        )}
                    >
                        <div className="flex items-center gap-2 min-w-max px-0.5">
                            <button
                                onClick={() => setQuickAirline(null)}
                                className={cn(
                                    'px-4 py-2.5 rounded-2xl text-sm font-bold border transition shrink-0 shadow-2xs',
                                    quickAirline === null
                                        ? 'bg-[#3566E3] text-white border-[#3566E3]'
                                        : 'bg-white/90 text-slate-700 border-slate-200 hover:border-[#3566E3]/50 hover:bg-white'
                                )}
                            >
                                Toutes
                            </button>
                            {airlineChips.map((a) => (
                                <button
                                    key={a.code}
                                    onClick={() => setQuickAirline(a.code === quickAirline ? null : a.code)}
                                    className={cn(
                                        'snap-start px-3.5 py-2 rounded-2xl text-sm font-medium border transition shrink-0 flex items-center gap-2.5 shadow-2xs',
                                        quickAirline === a.code
                                            ? 'bg-white text-slate-900 border-[#FFAA01] ring-2 ring-[#FFAA01]/30 font-bold'
                                            : 'bg-white/90 text-slate-700 border-slate-200 hover:border-[#3566E3]/50 hover:bg-white'
                                    )}
                                >
                                    <img
                                        src={getAirlineLogo(a.code)}
                                        alt={a.name}
                                        className="w-6 h-6 object-contain rounded-md"
                                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                    />
                                    <span className="font-semibold text-slate-800">{a.name}</span>
                                    <span className="text-xs text-slate-400">({a.count})</span>
                                    <span className="text-xs tabular-nums font-extrabold text-[#FFAA01]">
                                        {a.min.toLocaleString()} {a.currency}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            {availableProviders.length > 1 && (
                <div className="flex items-center gap-2 mt-4 mb-4 overflow-x-auto scrollbar-none pb-1">
                    <button
                        type="button"
                        onClick={() => handleProviderFilterChange(null)}
                        className={cn(
                            'px-3.5 py-1.5 rounded-full text-xs font-bold border transition shadow-2xs shrink-0',
                            providerFilter === null ? 'bg-[#3566E3] text-white border-[#3566E3]' : 'bg-white text-slate-600 border-slate-200'
                        )}
                    >
                        Tous ({offers.length})
                    </button>
                    {availableProviders.map((p) => {
                        const count = offers.filter((o) => o.provider === p).length;
                        return (
                            <button
                                key={p}
                                type="button"
                                onClick={() => handleProviderFilterChange(p)}
                                className={cn(
                                    'px-3.5 py-1.5 rounded-full text-xs font-bold border transition shadow-2xs shrink-0',
                                    providerFilter === p ? 'bg-[#3566E3] text-white border-[#3566E3]' : 'bg-white text-slate-600 border-slate-200'
                                )}
                            >
                                {PROVIDER_LABELS[p] ?? p} ({count})
                            </button>
                        );
                    })}
                </div>
            )}
                <FilterPillBar
                                   filters={filters}
                                    onChange={setFilters}
                                    offers={offers}
                                    maxAvailablePrice={maxAvailablePrice}
                                    isRoundTrip={isRoundTrip}
                                />
                <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 mt-6">
                    <aside className="hidden lg:block">
                        <FilterPanel
                            results={offers}
                            filters={filters}
                            onChange={setFilters}
                            maxAvailablePrice={maxAvailablePrice}
                            isRoundTrip={isRoundTrip}
                        />
                    </aside>

                    <div className="space-y-3">
                        {flightGroups.length === 0 && !loading && lastSearchParams ? (
                            <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-white rounded-2xl border border-slate-200">
                                <div className="text-4xl mb-3"><PlaneIcon className="w-16 h-16 object-contain" /> </div>
                                <h3 className="text-lg font-bold text-[#002161] mb-1">Aucun vol trouvé</h3>
                                <p className="text-sm text-slate-500 max-w-sm mb-4">
                                    Nous n'avons trouvé aucun vol correspondant à votre recherche. Essayez de modifier vos dates ou votre destination.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => navigate('/flights')}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#3566E3] hover:bg-[#2851b8] text-white text-sm font-bold shadow-sm transition active:scale-95 cursor-pointer"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    <span>Retour aux vols</span>
                                </button>
                            </div>
                        ) : sortedGroups.length === 0 && flightGroups.length > 0 ? (
                            <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-white rounded-2xl border border-slate-200">
                                <div className="text-4xl mb-3">🔍</div>
                                <h3 className="text-lg font-bold text-[#002161] mb-1">Aucun résultat avec ces filtres</h3>
                                <p className="text-sm text-slate-500 max-w-sm mb-4">
                                    Aucun vol ne correspond aux filtres sélectionnés. Essayez d'élargir vos critères.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setFilters(defaultFilters(maxAvailablePrice))}
                                    className="px-4 py-2 rounded-xl bg-[#F5A623] text-white text-sm font-semibold hover:opacity-90"
                                >
                                    Réinitialiser les filtres
                                </button>
                            </div>
                        ) : (
                            <>
                                {paginatedGroups.map((group) => {
                                    const cheapest = normalizeAggregatedOffer(group.offers[0]);
                                    return (
                                        <AggregatedFlightCard
                                            key={group.key}
                                            offer={cheapest}
                                            fareCount={group.offers.length}
                                            onSelect={() => handleSelect(group)}
                                        />
                                    );
                                })}

                                {visibleCount < sortedGroups.length && (
                                    <button
                                        type="button"
                                        onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                                        className="w-full py-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#0454E8] hover:bg-slate-50 transition"
                                    >
                                        Afficher plus de résultats ({sortedGroups.length - visibleCount} restants)
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>

            <AggregatedFlightDetailModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                group={selectedGroup}
                onContinue={handleContinue}
            />
                <StaleResultsModal
                    open={showPrompt}
                    onRefreshResults={dismissWithRefresh}
                    onNewSearch={() => dismissWithNewSearch(() => {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        setSearchFormOpen(true);
                    })}
                />


        </div>
        </div>
    );
}