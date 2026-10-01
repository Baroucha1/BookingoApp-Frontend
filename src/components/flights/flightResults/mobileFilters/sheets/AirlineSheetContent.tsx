import { useMemo } from 'react';
import { formatPrice } from '@/service/flights/normalize.ts';
import { getAirlineLogo } from '@/service/flights/airlines.ts';
import type { Filters } from '@/service/flights_aggregator/filterHelpers';
import type { DisplayOffer } from '@/service/flights_aggregator/aggregatedNormalize';
import { cn } from '@/lib/utils.ts';

interface Props {
    draft: Filters;
    setDraft: React.Dispatch<React.SetStateAction<Filters>>;
    offers: DisplayOffer[];
}

export default function AirlineSheetContent({ draft, setDraft, offers }: Props) {
    const airlines = useMemo(() => {
        const map = new Map<string, { code: string; name: string; min: number; currency: string }>();
        for (const o of offers) {
            if (!o.airlineCode) continue;
            const cur = map.get(o.airlineCode);
            if (!cur || o.price < cur.min) {
                map.set(o.airlineCode, { code: o.airlineCode, name: o.airlineName, min: o.price, currency: o.currency });
            }
        }
        return Array.from(map.values()).sort((a, b) => a.min - b.min);
    }, [offers]);

    const toggle = (code: string) =>
        setDraft((d) => ({
            ...d,
            airlines: d.airlines.includes(code) ? d.airlines.filter((c) => c !== code) : [...d.airlines, code],
        }));

    return (
        <div className="grid grid-cols-3 gap-3">
            {airlines.map((a) => {
                const active = draft.airlines.includes(a.code);
                return (
                    <button
                        key={a.code}
                        type="button"
                        onClick={() => toggle(a.code)}
                        className={cn(
                            'flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-center transition',
                            active ? 'border-[#3566E3] bg-[#3566E3]/5' : 'border-slate-200'
                        )}
                    >
                        <img
                            src={getAirlineLogo(a.code)}
                            alt={a.name}
                            className="w-8 h-8 object-contain"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                        />
                        <span className="text-xs font-medium text-slate-800 leading-tight">{a.name}</span>
                        <span className="text-[11px] text-slate-500 tabular-nums">{formatPrice(a.min, a.currency)}</span>
                    </button>
                );
            })}
        </div>
    );
}