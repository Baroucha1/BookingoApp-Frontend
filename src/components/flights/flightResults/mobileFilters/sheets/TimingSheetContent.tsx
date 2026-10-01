import { Sun, Sunrise, CloudSun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils.ts';
import type { Filters, TimeBlock } from '@/service/flights_aggregator/filterHelpers';

const TIME_BLOCKS: { key: TimeBlock; label: string; range: string; icon: React.ReactNode }[] = [
    { key: 'morning_early', label: 'Tôt le matin', range: '00:00–07:59', icon: <Sunrise className="w-5 h-5" /> },
    { key: 'morning', label: 'Matin', range: '08:00–11:59', icon: <Sun className="w-5 h-5" /> },
    { key: 'afternoon', label: 'Après-midi', range: '12:00–15:59', icon: <CloudSun className="w-5 h-5" /> },
    { key: 'evening', label: 'Soir', range: '16:00–23:59', icon: <Moon className="w-5 h-5" /> },
];

function toggle<T>(arr: T[], v: T): T[] {
    return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

interface Props {
    draft: Filters;
    setDraft: React.Dispatch<React.SetStateAction<Filters>>;
    isRoundTrip: boolean;
}

export default function TimingSheetContent({ draft, setDraft, isRoundTrip }: Props) {
    const directions: ('outbound' | 'return')[] = isRoundTrip ? ['outbound', 'return'] : ['outbound'];

    const toggleDeparture = (direction: 'outbound' | 'return', key: TimeBlock) =>
        setDraft((d) => ({
            ...d,
            departureTimeBlocks: { ...d.departureTimeBlocks, [direction]: toggle(d.departureTimeBlocks[direction], key) },
        }));

    const toggleArrival = (direction: 'outbound' | 'return', key: TimeBlock) =>
        setDraft((d) => ({
            ...d,
            arrivalTimeBlocks: { ...d.arrivalTimeBlocks, [direction]: toggle(d.arrivalTimeBlocks[direction], key) },
        }));

    const renderGrid = (active: TimeBlock[], onToggle: (key: TimeBlock) => void) => (
        <div className="grid grid-cols-3 gap-2">
            {TIME_BLOCKS.map((tb) => {
                const isActive = active.includes(tb.key);
                return (
                    <button
                        key={tb.key}
                        type="button"
                        onClick={() => onToggle(tb.key)}
                        className={cn(
                            'flex flex-col items-center gap-1 py-3 rounded-xl border text-center transition',
                            isActive ? 'bg-[#3566E3]/5 border-[#3566E3] text-[#3566E3]' : 'border-slate-200 text-slate-700'
                        )}
                    >
                        {tb.icon}
                        <span className="text-xs font-medium">{tb.label}</span>
                        <span className="text-[10px] text-slate-400">{tb.range}</span>
                    </button>
                );
            })}
        </div>
    );

    return (
        <div className="space-y-8">
            {directions.map((direction) => (
                <div key={direction} className="space-y-5">
                    {isRoundTrip && (
                        <div className="text-sm font-semibold text-[#0B0F2E]">
                            {direction === 'outbound' ? 'Départ' : 'Retour'}
                        </div>
                    )}
                    <div>
                        <div className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-2">Heure de départ</div>
                        {renderGrid(draft.departureTimeBlocks[direction], (key) => toggleDeparture(direction, key))}
                    </div>
                    <div>
                        <div className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-2">Heure d'arrivée</div>
                        {renderGrid(draft.arrivalTimeBlocks[direction], (key) => toggleArrival(direction, key))}
                    </div>
                </div>
            ))}
        </div>
    );
}