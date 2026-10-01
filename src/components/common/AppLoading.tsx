import { cn } from '@/lib/utils';

interface AppLoadingProps {
    message?: string;
    messages?: string[];
    fullScreen?: boolean;
    className?: string;
    subMessage?: string;
}

export const AppLoading = ({
    message,
    subMessage,
    fullScreen = true,
    className,
}: AppLoadingProps) => {
    const content = (
        <div className={cn("flex flex-col items-center justify-center gap-3.5 p-4 select-none", className)}>
            {/* Cercle minimaliste qui alterne entre Bleu (#0865FE) et Or (#FFAA01) */}
            <div className="relative w-11 h-11 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-[3px] border-slate-200/60 dark:border-white/10" />
                <div className="w-11 h-11 rounded-full border-[3px] border-transparent border-t-[#0865FE] border-r-[#0865FE] bookingo-circle-spinner" />
            </div>

            {(message || subMessage) && (
                <div className="flex flex-col items-center text-center gap-1 max-w-xs">
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
            <div className="fixed inset-0 z-50 bg-white/40 dark:bg-[#0B0F2E]/60 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-200">
                {content}
            </div>
        );
    }

    return content;
};

export default AppLoading;
