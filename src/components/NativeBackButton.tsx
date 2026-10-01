import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NativeBackButtonProps {
    label?: string;
    showLabel?: boolean;
    fallbackTo?: string;
    variant?: 'glass' | 'light' | 'ghost' | 'white' | 'none';
    className?: string;
    onClick?: () => void;
}

export default function NativeBackButton({
    label = 'Retour',
    showLabel = false,
    fallbackTo = '/hotels',
    variant = 'none',
    className,
    onClick,
}: NativeBackButtonProps) {
    const navigate = useNavigate();

    const handleClick = () => {
        if (onClick) {
            onClick();
            return;
        }
        if (window.history.length > 1) {
            navigate(-1);
        } else {
            navigate(fallbackTo);
        }
    };

    const variantStyles = {
        glass: 'bg-white/80 hover:bg-white text-slate-800 dark:bg-black/40 dark:text-white border border-white/50 dark:border-white/20 backdrop-blur-md shadow-md',
        light: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 shadow-xs hover:border-slate-300',
        white: 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-md',
        ghost: 'bg-transparent hover:bg-slate-100 text-slate-700 border-transparent',
        none: 'bg-transparent text-white border-0 shadow-none hover:scale-110 drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] p-1.5',
    }[variant];

    return (
        <button
            type="button"
            onClick={handleClick}
            title={label}
            aria-label={label}
            className={cn(
                'inline-flex items-center justify-center transition-all duration-200 active:scale-90 hover:scale-105 cursor-pointer shrink-0',
                showLabel
                    ? 'gap-2 px-3.5 py-2 rounded-full text-xs font-semibold'
                    : 'w-10 h-10 rounded-full',
                variantStyles,
                className
            )}
        >
            <ArrowLeft className={cn("shrink-0", variant === 'none' ? "w-6 h-6" : "w-5 h-5")} />
            {showLabel && <span>{label}</span>}
        </button>
    );
}
