// components/home/BookingSteps.tsx
import { Plane, FileCheck2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
}

const steps: Step[] = [
    { title: 'Recherche', icon: Plane },
    { title: 'Details/Paiement', icon: FileCheck2 },
    { title: 'Confirmation', icon: CheckCircle2 },
];

interface BookingStepsProps {
    /** The real booking flow step — 2 (details/payment) or 4 (confirmation). */
    current: 2 | 4;
}

export const BookingSteps = ({ current }: BookingStepsProps) => {
    // Map real flow steps to this 3-circle stepper's indices:
    // 0 = Recherche (always considered done — the user already has an offer selected)
    // 1 = Details/Paiement (active while current === 2)
    // 2 = Confirmation (active once current === 4)
    const active = current === 4 ? 2 : 1;

    return (
        <section className="w-full py-8 px-4">
            <div className="max-w-xl mx-auto flex items-start justify-between relative">
                {steps.map((s, i) => {
                    const isActive = i === active;
                    const isDone = i < active;

                    return (
                        <div key={s.title} className="flex flex-col items-center text-center relative flex-1 px-1">
                            {/* Connecting line to next step */}
                            {i < steps.length - 1 && (
                                <div className="absolute top-7 left-1/2 w-full h-[2px] -z-0 bg-white/50">
                                    <div
                                        className="absolute inset-y-0 left-0 bg-white transition-all duration-700 ease-out"
                                        style={{ width: isDone ? '100%' : '0%' }}
                                    />
                                </div>
                            )}

                            {/* Icon circle */}
                            <div
                                className={cn(
                                    'relative z-10 rounded-full flex items-center justify-center transition-all duration-500 ease-out',
                                    isActive
                                        ? 'w-16 h-16 bg-[#0454E8] scale-110 ring-4 ring-white/40 shadow-lg shadow-black/10'
                                        : isDone
                                            ? 'w-14 h-14 bg-[#0454E8]'
                                            : 'w-14 h-14 bg-white'
                                )}
                            >
                                <s.icon
                                    className={cn(
                                        'transition-all duration-500',
                                        isActive ? 'w-7 h-7 text-white' : isDone ? 'w-6 h-6 text-white' : 'w-6 h-6 text-[#0454E8]'
                                    )}
                                />
                            </div>

                            {/* Label */}
                            <div
                                className={cn(
                                    'mt-3 font-bold text-sm transition-all duration-500',
                                    isActive ? 'text-[#002161] scale-105' : isDone ? 'text-[#002161]' : 'text-[#0454E8]/90'
                                )}
                            >
                                {s.title}
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

export default BookingSteps;