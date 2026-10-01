import { Plane } from 'lucide-react';

interface Props {
    origin?: string;
    destination?: string;
    active: boolean;
}

export default function FlightSearchLoadingOverlay({ origin, destination, active }: Props) {
    if (!active) return null;

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/40 dark:bg-[#0B0F2E]/60 backdrop-blur-md px-4 select-none animate-in fade-in duration-200">
            <div className="flex flex-col items-center justify-center gap-3.5 text-center">
                {/* Cercle BookinGO (Bleu #0865FE et Or #FFAA01) */}
                <div className="relative w-12 h-12 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-[3px] border-slate-200/60 dark:border-white/10" />
                    <div className="w-12 h-12 rounded-full border-[3px] border-transparent border-t-[#0865FE] border-r-[#0865FE] bookingo-circle-spinner" />
                    <Plane className="w-5 h-5 text-[#0865FE] absolute -rotate-45" />
                </div>

                {/* Itinéraire épuré si disponible */}
                {origin && destination && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs">
                        <span>{origin}</span>
                        <Plane className="w-3 h-3 text-[#FFAA01]" />
                        <span>{destination}</span>
                    </div>
                )}

                {/* Message simple et discret */}
                <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 tracking-wide">
                        Recherche des vols en direct...
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Comparaison des meilleures offres
                    </p>
                </div>
            </div>
        </div>
    );
}