import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group.tsx';
import { cn } from '@/lib/utils.ts';
import type { Filters, StopsFilterValue } from '@/service/flights_aggregator/filterHelpers';

const STOPS_OPTIONS: { v: StopsFilterValue; l: string }[] = [
    { v: 'direct', l: 'Direct' },
    { v: 'one', l: '1 escale' },
    { v: 'twoPlus', l: '2+ escales' },
];

interface Props {
    draft: Filters;
    setDraft: React.Dispatch<React.SetStateAction<Filters>>;
    isRoundTrip: boolean;
}

export default function StopsSheetContent({ draft, setDraft, isRoundTrip }: Props) {
    const directions: ('outbound' | 'return')[] = isRoundTrip ? ['outbound', 'return'] : ['outbound'];

    const setDirection = (direction: 'outbound' | 'return', v: StopsFilterValue) =>
        setDraft((d) => ({ ...d, stops: { ...d.stops, [direction]: v } }));

    return (
        <div className="space-y-6">
            {directions.map((direction) => (
                <div key={direction}>
                    {isRoundTrip && (
                        <div className="text-sm font-semibold text-[#0B0F2E] mb-2">
                            {direction === 'outbound' ? 'Départ' : 'Retour'}
                        </div>
                    )}
                    <RadioGroup
                        value={draft.stops[direction]}
                        onValueChange={(v) => setDirection(direction, v as StopsFilterValue)}
                        className="grid grid-cols-3 gap-2"
                    >
                        {STOPS_OPTIONS.map((o) => {
                            const active = draft.stops[direction] === o.v;
                            return (
                                <label
                                    key={o.v}
                                    className={cn(
                                        'flex flex-col items-center justify-center gap-1 py-4 rounded-xl border text-center cursor-pointer text-sm font-medium',
                                        active ? 'border-[#3566E3] bg-[#3566E3]/5 text-[#3566E3]' : 'border-slate-200 text-slate-700'
                                    )}
                                >
                                    <RadioGroupItem value={o.v} className="sr-only" />
                                    {o.l}
                                </label>
                            );
                        })}
                    </RadioGroup>
                </div>
            ))}
        </div>
    );
}