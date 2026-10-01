// src/components/flights/FlightSearchLoadingOverlay.tsx
import { useEffect, useState } from 'react';

interface FlightSearchLoadingOverlayProps {
    active: boolean;
    origin?: string;
    destination?: string;
}

export default function FlightSearchLoadingOverlay({
                                                       active,
                                                       origin,
                                                       destination,
                                                   }: FlightSearchLoadingOverlayProps) {
    const route = origin && destination ? `${origin} → ${destination}` : null;

    const messages = [
        route ? `Recherche des vols ${route}...` : "Recherche des meilleurs vols...",
        "Comparaison des compagnies aériennes...",
        "Vérification des tarifs disponibles...",
        "On finalise votre sélection...",
    ];
    const [msgIndex, setMsgIndex] = useState(0);

    useEffect(() => {
        if (!active) return;
        setMsgIndex(0);
        const interval = setInterval(() => {
            setMsgIndex((i) => (i + 1) % messages.length);
        }, 2000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active, route]);

    if (!active) return null;

    return (
        <div className="fixed inset-0 z-50 bg-[#DFECFF] flex flex-col items-center justify-center gap-6">
            <img
                src="/newlogo.png"
                alt="BookinGO"
                className="h-10 sm:h-12 w-auto animate-pulse"
            />

            <div className="w-64 h-1.5 bg-slate-200 rounded-full overflow-hidden relative">
                <div className="absolute top-0 h-full w-1/3 bg-[#1775FF] rounded-full loading-bar-segment" />
            </div>

            <p key={msgIndex} className="text-sm font-medium text-slate-500 loading-fade-in">
                {messages[msgIndex]}
            </p>

            <style>{`
                @keyframes loadingBarSlide {
                    0% { left: -33%; }
                    50% { left: 66%; }
                    100% { left: -33%; }
                }
                .loading-bar-segment {
                    animation: loadingBarSlide 1.4s ease-in-out infinite;
                }
                @keyframes fadeIn {
                    0% { opacity: 0; transform: translateY(4px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                .loading-fade-in {
                    animation: fadeIn 0.4s ease-out;
                }
            `}</style>
        </div>
    );
}