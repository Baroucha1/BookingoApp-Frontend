import { useMemo } from 'react';
import { Luggage } from 'lucide-react';
import type { PassengerFormData } from '@/context/FlightContext';
import type { BagOption } from '@/service/flights_aggregator/aggregatedNormalize';

interface Props {
    options: BagOption[];
    passengers: PassengerFormData[];
    selections: Record<string, string>; // key: `${travelerId}|${segmentGroup}` → optionId
    disabled?: boolean;
    onChange: (key: string, optionId: string) => void;
}

const PAX_LABEL: Record<string, string> = { ADT: 'Adulte', CHD: 'Enfant', INF: 'Bébé' };

function optionLabel(o: BagOption) {
    const qty = `${o.quantity} bagage${o.quantity > 1 ? 's' : ''}`;
    const weight = o.weight ? ` de ${o.weight} ${(o.weightUnit ?? 'KG').toLowerCase()}` : '';
    return `${qty}${weight} — ${o.price.toLocaleString('fr-FR')} ${o.currency ?? ''}`;
}

export default function BaggageSelector({ options, passengers, selections, disabled, onChange }: Props) {
    // Group options by the segments they cover (one group = whole trip, or one itinerary)
    const groups = useMemo(() => {
        const map = new Map<string, BagOption[]>();
        for (const o of options) {
            const key = [...o.segmentIds].sort((a, b) => Number(a) - Number(b)).join(',');
            map.set(key, [...(map.get(key) ?? []), o]);
        }
        return [...map.entries()].sort(
            ([a], [b]) => Math.min(...a.split(',').map(Number)) - Math.min(...b.split(',').map(Number))
        );
    }, [options]);

    const groupLabel = (idx: number) =>
        groups.length === 1 ? 'Tout le voyage' : idx === 0 ? 'Aller' : idx === 1 ? 'Retour' : `Trajet ${idx + 1}`;

    return (
        <div className="space-y-4">
            {passengers.map((p, i) => {
                if (p.paxType === 'INF') return null;
                const travelerId = String(i + 1);
                const name = [p.firstName, p.lastName].filter(Boolean).join(' ') || `${PAX_LABEL[p.paxType]} ${i + 1}`;

                return (
                    <div key={travelerId} className="rounded-xl border border-slate-100 p-3 space-y-2">
                        <p className="text-sm font-medium text-[#0B0F2E]">{name}</p>
                        {groups.map(([segKey, groupOptions], idx) => {
                            const available = groupOptions.filter(
                                (o) => !o.travelerIds.length || o.travelerIds.includes(travelerId)
                            );
                            if (!available.length) return null;
                            const key = `${travelerId}|${segKey}`;
                            return (
                                <label key={key} className="block">
                                    <span className="text-xs text-slate-500">{groupLabel(idx)}</span>
                                    <select
                                        value={selections[key] ?? ''}
                                        disabled={disabled}
                                        onChange={(e) => onChange(key, e.target.value)}
                                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-[#0865FE] focus:outline-none focus:ring-2 focus:ring-[#0865FE]/20 disabled:opacity-60"
                                    >
                                        <option value="">Aucun bagage supplémentaire</option>
                                        {available.map((o) => (
                                            <option key={o.optionId} value={o.optionId}>{optionLabel(o)}</option>
                                        ))}
                                    </select>
                                </label>
                            );
                        })}
                    </div>
                );
            })}
            <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <Luggage className="w-3.5 h-3.5" />
                Les bagages achetés sont émis avec votre billet (EMD).
            </p>
        </div>
    );
}