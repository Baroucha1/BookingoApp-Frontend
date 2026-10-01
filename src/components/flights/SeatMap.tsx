
// ── SeatMap.tsx ──
// Renders Amadeus coordinate-based seat map, falls back to static CabinLayout
import { useEffect, useState } from 'react';
import { getSeatMap } from '@/service/flights/seatMap.service';
import { Skeleton } from '@/components/ui/skeleton';
import { CabinLayout } from './CabinLayout';
import { cn } from '@/lib/utils';

// Seat characteristic codes from Amadeus docs
const CHAR_LABELS: Record<string, string> = {
    W: '🪟 Hublot',
    A: '🚶 Couloir',
    M: '🪑 Milieu',
    CH: '📏 Extra legroom',
    RS: '🚪 Sortie',
    UP: '⬆️ Étage supérieur',
    LS: '◀️ Gauche',
    '1A': '⭐ Première rangée',
};

// Facility codes
const FACILITY_LABELS: Record<string, string> = {
    LA: '🚻', // lavatory
    GN: '🍽️', // galley
    WC: '🚻',
};

const CELL = 22; // px per grid cell

function AmadeusSeatMap({ data, highlightCabin }: { data: any; highlightCabin?: string }) {
    const deck = data?.decks?.[0];
    if (!deck) return <p className="text-xs text-slate-400">Données de plan de cabine indisponibles.</p>;

    const { width = 7, length = 35, startWingsX, endWingsX, exitRowsX = [] } = deck.deckConfiguration ?? {};
    const seats: any[] = deck.seats ?? [];
    const facilities: any[] = deck.facilities ?? [];

    // Track selected seat
    const [selected, setSelected] = useState<string | null>(null);

    const gridW = width * CELL;
    const gridH = length * CELL;

    // Group seats by status for legend
    const hasAvailable = seats.some(s => s.travelerPricing?.[0]?.seatAvailabilityStatus === 'AVAILABLE');
    const hasBlocked   = seats.some(s => s.travelerPricing?.[0]?.seatAvailabilityStatus === 'BLOCKED');
    const hasPriced    = seats.some(s => s.travelerPricing?.[0]?.price?.total);

    return (
        <div className="space-y-3">
            {/* In-flight amenities from Amadeus */}
            {data?.cabins?.[0]?.aircraftCabinAmenities && (
                <div className="flex flex-wrap gap-3 text-xs text-slate-600 px-1">
                    {data.cabins[0].aircraftCabinAmenities.wifi && (
                        <span>📶 Wi-Fi {data.cabins[0].aircraftCabinAmenities.wifi.isChargeable ? '(payant)' : '(gratuit)'}</span>
                    )}
                    {data.cabins[0].aircraftCabinAmenities.food && (
                        <span>🍱 Repas {data.cabins[0].aircraftCabinAmenities.food.isChargeable ? '(payant)' : '(inclus)'}</span>
                    )}
                    {data.cabins[0].aircraftCabinAmenities.seat?.legSpace && (
                        <span>🦵 {data.cabins[0].aircraftCabinAmenities.seat.legSpace} {data.cabins[0].aircraftCabinAmenities.seat.spaceUnit?.toLowerCase() ?? 'in'} legroom</span>
                    )}
                    {data.cabins[0].aircraftCabinAmenities.entertainment && (
                        <span>🎬 Divertissement {data.cabins[0].aircraftCabinAmenities.entertainment.isChargeable ? '(payant)' : '(inclus)'}</span>
                    )}
                </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap gap-3 text-xs">
                {hasAvailable && (
                    <span className="flex items-center gap-1">
            <span className="w-4 h-4 rounded bg-emerald-100 border border-emerald-400 inline-block" /> Disponible
          </span>
                )}
                {hasPriced && (
                    <span className="flex items-center gap-1">
            <span className="w-4 h-4 rounded bg-amber-100 border border-amber-400 inline-block" /> Payant
          </span>
                )}
                {hasBlocked && (
                    <span className="flex items-center gap-1">
            <span className="w-4 h-4 rounded bg-slate-200 border border-slate-300 inline-block" /> Bloqué
          </span>
                )}
                <span className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-red-200 border border-red-300 inline-block" /> Occupé
        </span>
                {selected && (
                    <span className="ml-auto text-[#F5A623] font-medium">Siège {selected} sélectionné</span>
                )}
            </div>

            {/* Seat grid */}
            <div className="overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex justify-center">
                    {/* Nose */}
                    <div className="w-full text-center text-xs text-slate-400 mb-1">▲ AVANT</div>
                </div>

                <div className="relative mx-auto" style={{ width: gridW, height: gridH }}>

                    {/* Wings */}
                    {startWingsX != null && endWingsX != null && (
                        <>
                            <div className="absolute bg-blue-100 border border-blue-200 rounded opacity-60"
                                 style={{ left: -40, top: startWingsX * CELL, width: 38, height: (endWingsX - startWingsX) * CELL }} />
                            <div className="absolute bg-blue-100 border border-blue-200 rounded opacity-60"
                                 style={{ right: -40, top: startWingsX * CELL, width: 38, height: (endWingsX - startWingsX) * CELL }} />
                        </>
                    )}

                    {/* Exit rows */}
                    {exitRowsX.map((row: number) => (
                        <div key={`exit-${row}`} className="absolute flex justify-between w-full pointer-events-none"
                             style={{ top: row * CELL - 1 }}>
                            <span className="text-[9px] text-emerald-600 font-bold -ml-6">EXIT</span>
                            <span className="text-[9px] text-emerald-600 font-bold -mr-6">EXIT</span>
                            <div className="absolute left-0 right-0 border-t border-emerald-300 border-dashed" style={{ top: 0 }} />
                        </div>
                    ))}

                    {/* Facilities (lavatories, galleys) */}
                    {facilities.map((f: any, i: number) => (
                        <div key={`fac-${i}`}
                             className="absolute flex items-center justify-center bg-yellow-100 border border-yellow-300 rounded text-sm"
                             style={{
                                 left: f.coordinates.y * CELL,
                                 top: f.coordinates.x * CELL,
                                 width: CELL - 2,
                                 height: CELL - 2,
                             }}
                             title={f.code}
                        >
                            {FACILITY_LABELS[f.code] ?? f.code}
                        </div>
                    ))}

                    {/* Seats */}
                    {seats.map((seat: any) => {
                        const status = seat.travelerPricing?.[0]?.seatAvailabilityStatus;
                        const price  = seat.travelerPricing?.[0]?.price?.total;
                        const chars  = seat.characteristicsCodes ?? [];
                        const isAvailable = status === 'AVAILABLE';
                        const isOccupied  = status === 'OCCUPIED';
                        const isBlocked   = status === 'BLOCKED';
                        const isSelected  = selected === seat.number;
                        const isPriced    = isAvailable && !!price;

                        const tooltip = [
                            `Siège ${seat.number}`,
                            ...chars.map((c: string) => CHAR_LABELS[c] ?? c),
                            price ? `${price} ${seat.travelerPricing?.[0]?.price?.currency}` : '',
                            isBlocked ? 'Bloqué' : '',
                        ].filter(Boolean).join(' · ');

                        return (
                            <div
                                key={seat.number}
                                title={tooltip}
                                onClick={() => isAvailable && setSelected(isSelected ? null : seat.number)}
                                className={cn(
                                    'absolute flex items-center justify-center rounded text-[8px] font-bold transition-all border',
                                    isSelected  ? 'bg-[#F5A623] border-[#F5A623] text-white scale-110 z-10' :
                                        isOccupied  ? 'bg-red-100 border-red-300 text-red-400 cursor-not-allowed' :
                                            isBlocked   ? 'bg-slate-100 border-slate-300 text-slate-400 cursor-not-allowed' :
                                                isPriced    ? 'bg-amber-100 border-amber-400 text-amber-800 cursor-pointer hover:scale-110 hover:z-10' :
                                                    isAvailable ? 'bg-emerald-100 border-emerald-400 text-emerald-800 cursor-pointer hover:scale-110 hover:z-10' :
                                                        'bg-slate-100 border-slate-200 text-slate-400'
                                )}
                                style={{
                                    left: seat.coordinates.y * CELL + 1,
                                    top:  seat.coordinates.x * CELL + 1,
                                    width:  CELL - 4,
                                    height: CELL - 4,
                                }}
                            >
                                {seat.number}
                            </div>
                        );
                    })}
                </div>

                <div className="text-center text-xs text-slate-400 mt-1">▼ ARRIÈRE</div>
            </div>

            {/* Selected seat summary */}
            {selected && (
                <div className="px-3 py-2 rounded-lg bg-[#FFF8EC] border border-[#F5A623] text-sm">
                    <span className="font-semibold text-[#F5A623]">Siège {selected}</span>
                    <span className="text-slate-600 ml-2">sélectionné — confirmez lors de la réservation</span>
                </div>
            )}
        </div>
    );
}

export function SeatMap({ segment, cabin, classCode }: {
    segment: any;
    cabin?: string;
    classCode?: string;
}) {
    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState<any>(null);

    useEffect(() => {
        if (!segment) { setLoading(false); return; }
        setLoading(true);
        getSeatMap(segment, cabin ?? 'ECONOMY', classCode ?? 'Y')
            .then(r => setResult(r))
            .catch(() => setResult(null))
            .finally(() => setLoading(false));
    }, [segment?.flightNumber, segment?.departureAirportLocationCode]);

    const equipment = result?.equipment ?? segment?.equipment ?? segment?.operatingAirline?.equipment;

    if (loading) return (
        <div className="space-y-2 p-3 rounded-xl border border-slate-200 bg-slate-50">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-64 w-full rounded-lg" />
        </div>
    );

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">✈️ Configuration cabine</span>
                {result?.source === 'amadeus'
                    ? <span className="text-xs text-emerald-600">● Disponibilité temps réel</span>
                    : <span className="text-xs text-slate-400">● Schéma indicatif</span>
                }
            </div>

            {result?.source === 'amadeus'
                ? <AmadeusSeatMap data={result.data} highlightCabin={cabin} />
                : <CabinLayout equipment={equipment} highlightCabin={cabin} />
            }
        </div>
    );
}