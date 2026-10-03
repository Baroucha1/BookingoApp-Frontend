import { Plane } from 'lucide-react';
import { Lottie } from 'lottie-react';
import loadingAnimation from '@/components/common/loadingAnimation';

interface Props {
    origin?: string;
    destination?: string;
    active: boolean;
}

export default function FlightSearchLoadingOverlay({ origin, destination, active }: Props) {
    if (!active) return null;

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/75 dark:bg-[#0B0F2E]/75 backdrop-blur-md px-4 select-none animate-in fade-in duration-200">
            <div className="flex flex-col items-center justify-center gap-2 text-center">
                {/* Lottie Animation BookinGO */}
                <div className="w-52 h-64 sm:w-60 sm:h-76 flex items-center justify-center">
                    <Lottie
                        src={loadingAnimation}
                        loop={true}
                        autoplay={true}
                        className="w-full h-full"
                        rendererSettings={{ preserveAspectRatio: 'xMidYMid meet' }}
                    />
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