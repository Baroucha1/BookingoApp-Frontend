import { X } from 'lucide-react';

interface RoomFilterPillsProps {
    filters: { id: string; label: string; count: number }[];
    selected: string[];
    onToggle: (id: string) => void;
    onClear: () => void;
}

export default function RoomFilterPills({ filters, selected, onToggle, onClear }: RoomFilterPillsProps) {
    if (filters.length === 0) return null;

    return (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 pb-1 mb-3">
            {selected.length > 0 && (
                <button
                    type="button"
                    onClick={onClear}
                    aria-label="Effacer les filtres"
                    className="shrink-0 w-8 h-8 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            )}
            {filters.map((f) => {
                const active = selected.includes(f.id);
                return (
                    <button
                        key={f.id}
                        type="button"
                        onClick={() => onToggle(f.id)}
                        aria-pressed={active}
                        className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium border transition-colors ${
                            active
                                ? 'bg-[#1775FF] border-[#1775FF] text-white'
                                : 'bg-white border-slate-200 text-slate-700 hover:border-[#1775FF]'
                        }`}
                    >
                        {f.label} <span className={active ? 'text-white/80' : 'text-slate-400'}>({f.count})</span>
                    </button>
                );
            })}
        </div>
    );
}