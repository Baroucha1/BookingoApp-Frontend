import { useEffect, useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Lottie } from 'lottie-react';
import loadingAnimation from '@/components/common/loadingAnimation';

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
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F0F6FF]/85 backdrop-blur-xs px-4 select-none animate-in fade-in duration-150">
            <div className="flex flex-col items-center justify-center gap-2 text-center max-w-sm">
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
