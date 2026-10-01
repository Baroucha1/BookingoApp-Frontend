import { useState, type ReactNode } from 'react';
import { MapPin, CalendarDays, Users, Search, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HotelSearchSummaryProps {
    destinationLabel?: string;
    dateLabel: string;
    roomsCount: number;
    totalGuests: number;
    onEdit: () => void;
    defaultExpanded?: boolean;
}

function SummaryField({ icon, label, value, onClick }: {
    icon: ReactNode; label: string; value: string; onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className="flex-1 min-w-0 flex items-center gap-2 px-4 sm:px-5 py-3 sm:py-4 text-left hover:bg-slate-50"
        >
            <span className="text-[#1775FF] shrink-0">{icon}</span>
            <div className="min-w-0">
                <div className="text-[10px] uppercase font-bold text-slate-400">{label}</div>
                <div className="text-sm font-semibold text-slate-700 truncate">{value}</div>
            </div>
        </button>
    );
}

export default function HotelSearchSummary({
                                               destinationLabel = 'Ville sélectionnée',
                                               dateLabel,
                                               roomsCount,
                                               totalGuests,
                                               onEdit,
                                               defaultExpanded = false,
                                           }: HotelSearchSummaryProps) {
    const [expanded, setExpanded] = useState(defaultExpanded);
    const guestsLabel = `${roomsCount} chambre${roomsCount > 1 ? 's' : ''} - ${totalGuests} voyageur${totalGuests > 1 ? 's' : ''}`;

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-6 relative z-20">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
                {/* Compact header — mobile/tablet only */}
                <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    aria-expanded={expanded}
                    className="lg:hidden w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50"
                >
                    <span className="w-9 h-9 rounded-full bg-[#DFECFF] flex items-center justify-center shrink-0">
                        <Search className="w-4 h-4 text-[#1775FF]" />
                    </span>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-800 truncate">{destinationLabel}</div>
                        <div className="text-xs text-slate-500 truncate">{dateLabel} · {guestsLabel}</div>
                    </div>
                    <ChevronDown
                        className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
                    />
                </button>

                {/* Expandable content — always open on desktop */}
                <div
                    className={`grid transition-[grid-template-rows] duration-300 ease-in-out lg:grid-rows-[1fr] ${
                        expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                    }`}
                >
                    <div className="overflow-hidden">
                        <div
                            className={`flex flex-col lg:flex-row lg:items-center divide-y lg:divide-y-0 lg:divide-x divide-slate-100 ${
                                expanded ? 'border-t border-slate-100 lg:border-t-0' : ''
                            }`}
                        >
                            <SummaryField icon={<MapPin className="w-4 h-4" />} label="Destination" value={destinationLabel} onClick={onEdit} />
                            <SummaryField icon={<CalendarDays className="w-4 h-4" />} label="Dates de séjour" value={dateLabel} onClick={onEdit} />
                            <SummaryField icon={<Users className="w-4 h-4" />} label="Chambres & voyageurs" value={guestsLabel} onClick={onEdit} />
                            <div className="p-3 lg:p-2">
                                <Button
                                    className="w-full lg:w-auto bg-[#F5A623] hover:bg-[#F5A623]/90 text-[#0B2A5C] font-bold"
                                    onClick={onEdit}
                                >
                                    Rechercher
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}