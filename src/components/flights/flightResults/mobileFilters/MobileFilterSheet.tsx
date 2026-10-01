import { X } from 'lucide-react';
import { useEffect } from 'react';

interface Props {
    open: boolean;
    title: string;
    onClose: () => void;
    onReset: () => void;
    onApply: () => void;
    children: React.ReactNode;
}

export default function MobileFilterSheet({ open, title, onClose, onReset, onApply, children }: Props) {
    useEffect(() => {
        if (!open) return;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative w-full bg-white rounded-t-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-200">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
                    <h3 className="text-lg font-bold text-[#0B0F2E]">{title}</h3>
                    <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-800">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

                <div className="flex items-center gap-3 px-5 py-4 border-t border-slate-100 shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
                    <button
                        type="button"
                        onClick={onReset}
                        className="flex-1 h-11 rounded-xl border border-[#3566E3] text-[#3566E3] text-sm font-semibold"
                    >
                        Réinitialiser
                    </button>
                    <button
                        type="button"
                        onClick={onApply}
                        className="flex-1 h-11 rounded-xl bg-[#3566E3] text-white text-sm font-semibold"
                    >
                        Appliquer
                    </button>
                </div>
            </div>
        </div>
    );
}