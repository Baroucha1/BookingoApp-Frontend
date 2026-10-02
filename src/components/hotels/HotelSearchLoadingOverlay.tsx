import { useEffect, useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';

const MESSAGE_KEYS = [
    'hotelLoadingSearch',
    'hotelLoadingCompare',
    'hotelLoadingLive',
    'hotelLoadingFinalize',
] as const;

interface Props {
    active: boolean;
    checkInDate?: string;
    checkOutDate?: string;
    roomsCount?: number;
    guestsCount?: number;
}

export default function HotelSearchLoadingOverlay({ active }: Props) {
    const { t } = useLanguage();
    const [msgIdx, setMsgIdx] = useState(0);

    useEffect(() => {
        if (!active) return;
        setMsgIdx(0);
        const timer = setInterval(() => {
            setMsgIdx((prev) => (prev + 1) % MESSAGE_KEYS.length);
        }, 1800);

        return () => clearInterval(timer);
    }, [active]);

    if (!active) return null;

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F0F6FF]/80 backdrop-blur-xs px-4 select-none animate-in fade-in duration-150">
            <div className="flex flex-col items-center justify-center gap-4 text-center max-w-sm">
                <img
                    src="/chart/LOGO_BOOKINGO.png"
                    alt="BookinGO"
                    className="h-9 sm:h-10 w-auto object-contain opacity-90 drop-shadow-2xs"
                />

                {/* Animated Spinner */}
                <div className="w-10 h-10 rounded-full border-[3px] border-[#1775FF]/20 border-t-[#1775FF] animate-spin" />

                {/* Status message */}
                <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-800 animate-pulse">
                        {t(MESSAGE_KEYS[msgIdx])}
                    </p>
                    <p className="text-xs text-slate-400">
                        {t('hotelLoadingWait')}
                    </p>
                </div>
            </div>
        </div>
    );
}
