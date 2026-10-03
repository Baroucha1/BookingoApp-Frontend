import { Lottie } from 'lottie-react';
import loadingAnimation from './loadingAnimation';
import { cn } from '@/lib/utils';

interface AppLoadingProps {
    message?: string;
    messages?: string[];
    fullScreen?: boolean;
    className?: string;
    subMessage?: string;
    size?: 'sm' | 'md' | 'lg';
}

export const AppLoading = ({
    message,
    subMessage,
    fullScreen = true,
    className,
    size = 'md',
}: AppLoadingProps) => {
    const lottieSizes = {
        sm: 'w-36 h-48 sm:w-44 sm:h-56',
        md: 'w-52 h-64 sm:w-64 sm:h-80',
        lg: 'w-64 h-80 sm:w-80 sm:h-96',
    };

    const content = (
        <div className={cn("flex flex-col items-center justify-center gap-2 p-4 select-none", className)}>
            {/* Lottie Animation BookinGO */}
            <div className={cn("flex items-center justify-center", lottieSizes[size])}>
                <Lottie
                    src={loadingAnimation}
                    loop={true}
                    autoplay={true}
                    className="w-full h-full"
                    rendererSettings={{ preserveAspectRatio: 'xMidYMid meet' }}
                />
            </div>

            {(message || subMessage) && (
                <div className="flex flex-col items-center text-center gap-1 max-w-xs -mt-1">
                    {message && (
                        <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 tracking-wide">
                            {message}
                        </p>
                    )}
                    {subMessage && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {subMessage}
                        </p>
                    )}
                </div>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-50 bg-white/75 dark:bg-[#0B0F2E]/75 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-200">
                {content}
            </div>
        );
    }

    return content;
};

export default AppLoading;
