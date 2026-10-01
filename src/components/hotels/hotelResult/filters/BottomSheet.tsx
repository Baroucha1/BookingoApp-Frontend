import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomSheetProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    footer?: ReactNode;
}

export default function BottomSheet({ open, onClose, title, children, footer }: BottomSheetProps) {
    const [mounted, setMounted] = useState(open);
    const [visible, setVisible] = useState(false);

    // Mount → then animate in; animate out → then unmount
    useEffect(() => {
        if (open) {
            setMounted(true);
            const raf = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
            return () => cancelAnimationFrame(raf);
        }
        setVisible(false);
        const t = setTimeout(() => setMounted(false), 300);
        return () => clearTimeout(t);
    }, [open]);

    // Lock body scroll + close on Escape
    useEffect(() => {
        if (!open) return;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = prevOverflow;
            window.removeEventListener('keydown', onKey);
        };
    }, [open, onClose]);

    if (!mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
            <div
                className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            />
            <div
                className={`absolute inset-x-0 bottom-0 max-h-[85vh] flex flex-col bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out ${
                    visible ? 'translate-y-0' : 'translate-y-full'
                }`}
            >
                <div className="flex justify-center pt-2.5">
                    <span className="w-10 h-1 rounded-full bg-slate-200" />
                </div>
                <div className="flex items-center justify-between px-5 pt-3 pb-4">
                    <h2 className="text-lg font-bold text-slate-900">{title}</h2>
                    <button onClick={onClose} aria-label="Fermer" className="p-1 -mr-1 text-slate-500 hover:text-slate-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className={cn("flex-1 overflow-y-auto px-5 pb-4", !footer && "pb-[calc(1rem+env(safe-area-inset-bottom,0px))]")}>{children}</div>
                {footer && (
                    <div
                        className="px-5 pt-4 border-t border-slate-100"
                        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
                    >
                        {footer}
                    </div>
                )}
            </div>
        </div>,
        document.body,
    );
}