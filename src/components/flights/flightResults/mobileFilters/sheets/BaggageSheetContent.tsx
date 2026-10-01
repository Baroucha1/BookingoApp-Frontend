import { Luggage, Briefcase, Globe } from 'lucide-react';
import { cn } from '@/lib/utils.ts';
import type { Filters, BaggageFilter } from '@/service/flights_aggregator/filterHelpers';

const OPTIONS: { v: BaggageFilter; title: string; desc: string; icon: React.ReactNode }[] = [
    { v: 'all', title: 'Peu importe', desc: 'Afficher tous les tarifs', icon: <Globe className="w-5 h-5" /> },
    { v: 'with', title: 'Avec bagage en soute', desc: 'Un bagage enregistré inclus', icon: <Luggage className="w-5 h-5" /> },
    { v: 'cabin_only', title: 'Cabine uniquement', desc: 'Pas de bagage en soute inclus', icon: <Briefcase className="w-5 h-5" /> },
];

interface Props {
    draft: Filters;
    setDraft: React.Dispatch<React.SetStateAction<Filters>>;
}

export default function BaggageSheetContent({ draft, setDraft }: Props) {
    return (
        <div className="space-y-3">
            {OPTIONS.map((o) => {
                const active = draft.baggage === o.v;
                return (
                    <button
                        key={o.v}
                        type="button"
                        onClick={() => setDraft((d) => ({ ...d, baggage: o.v }))}
                        className={cn(
                            'w-full flex items-center gap-3 px-4 py-4 rounded-xl border text-left transition',
                            active ? 'border-[#3566E3] bg-[#3566E3]/5' : 'border-slate-200'
                        )}
                    >
                        <div className={cn('shrink-0', active ? 'text-[#3566E3]' : 'text-slate-400')}>{o.icon}</div>
                        <div className="flex-1">
                            <div className="text-sm font-semibold text-[#0B0F2E]">{o.title}</div>
                            <div className="text-xs text-slate-500">{o.desc}</div>
                        </div>
                        <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0', active ? 'border-[#3566E3]' : 'border-slate-300')}>
                            {active && <div className="w-2.5 h-2.5 rounded-full bg-[#3566E3]" />}
                        </div>
                    </button>
                );
            })}
        </div>
    );
}