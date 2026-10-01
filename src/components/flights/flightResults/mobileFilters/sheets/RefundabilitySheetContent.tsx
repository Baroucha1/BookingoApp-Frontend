import type { Filters, Refundability } from '@/service/flights_aggregator/filterHelpers';
import { cn } from '@/lib/utils.ts';

const OPTIONS: { v: Refundability; title: string; desc: string }[] = [
    { v: 'all', title: 'Tous les billets', desc: 'Afficher tous les tarifs disponibles' },
    { v: 'refundable', title: 'Remboursable', desc: 'Récupérez votre argent facilement' },
    { v: 'non_refundable', title: 'Non-remboursable', desc: 'Prix plus bas, pas de remboursement' },
];

interface Props {
    draft: Filters;
    setDraft: React.Dispatch<React.SetStateAction<Filters>>;
}

export default function RefundabilitySheetContent({ draft, setDraft }: Props) {
    return (
        <div className="space-y-3">
            {OPTIONS.map((o) => {
                const active = draft.refundability === o.v;
                return (
                    <button
                        key={o.v}
                        type="button"
                        onClick={() => setDraft((d) => ({ ...d, refundability: o.v }))}
                        className={cn(
                            'w-full flex items-center justify-between gap-3 px-4 py-4 rounded-xl border text-left transition',
                            active ? 'border-[#3566E3] bg-[#3566E3]/5' : 'border-slate-200'
                        )}
                    >
                        <div>
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