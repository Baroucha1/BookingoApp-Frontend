import { useEffect, useState } from 'react';

const MESSAGES = [
    'Recherche des meilleurs hôtels...',
    'Comparaison des prix en temps réel...',
    'Vérification des disponibilités...',
    'On finalise votre sélection...',
];

export default function HotelSearchLoading() {
    const [msgIndex, setMsgIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setMsgIndex((i) => (i + 1) % MESSAGES.length);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 z-50 bg-[#F0F6FF] flex flex-col items-center justify-center gap-6 px-6">
            <img src="/bookingo-logo.png" alt="Bookingo" className="h-12 sm:h-14 w-auto animate-pulse" />

            <div className="w-48 sm:w-64 h-1.5 bg-slate-200 rounded-full overflow-hidden relative">
                <div className="absolute top-0 h-full w-1/3 bg-[#1775FF] rounded-full loading-bar-segment" />
            </div>

            <p key={msgIndex} className="text-sm font-medium text-slate-500 text-center loading-fade-in">
                {MESSAGES[msgIndex]}
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