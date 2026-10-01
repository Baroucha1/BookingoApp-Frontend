import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

export interface StepperStep {
    label: string;
}

interface BookingStepperProps {
    steps: StepperStep[];
    currentStep: number; // 0-indexed
}

export default function BookingStepper({ steps, currentStep }: BookingStepperProps) {
    const { t } = useLanguage();
    const percent = Math.round(((currentStep + 1) / steps.length) * 100);

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <p className="text-xs font-semibold tracking-wide text-blue-500 uppercase">
                        {t('hotelStep')} {currentStep + 1} {t('hotelStepOf')} {steps.length}
                    </p>
                    <h2 className="text-xl font-bold text-gray-900 mt-0.5">{steps[currentStep].label}</h2>
                </div>
                <div className="flex items-center gap-2 bg-blue-50 text-blue-600 text-sm font-medium px-3 py-1.5 rounded-full">
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                    {percent}% {t('hotelCompleted')}
                </div>
            </div>

            <div className="flex items-center">
                {steps.map((step, i) => {
                    const isDone = i < currentStep;
                    const isActive = i === currentStep;
                    return (
                        <div key={step.label} className="flex items-center flex-1 last:flex-none">
                            <div className="flex flex-col items-center gap-2">
                                <motion.div
                                    initial={false}
                                    animate={{
                                        backgroundColor: isDone || isActive ? '#2563eb' : '#ffffff',
                                        borderColor: isDone || isActive ? '#2563eb' : '#e5e7eb',
                                        color: isDone || isActive ? '#ffffff' : '#9ca3af',
                                    }}
                                    className="w-10 h-10 rounded-full border-2 flex items-center justify-center font-semibold text-sm"
                                >
                                    {isDone ? <Check size={18} /> : i + 1}
                                </motion.div>
                                <span
                                    className={`text-xs font-medium whitespace-nowrap ${
                                        isActive ? 'text-blue-600' : isDone ? 'text-gray-700' : 'text-gray-400'
                                    }`}
                                >
                  {step.label}
                </span>
                            </div>
                            {i < steps.length - 1 && (
                                <div className="flex-1 h-0.5 mx-2 -mt-6 bg-gray-100 relative overflow-hidden rounded-full">
                                    <motion.div
                                        initial={false}
                                        animate={{ width: isDone ? '100%' : '0%' }}
                                        transition={{ duration: 0.3 }}
                                        className="h-full bg-blue-600 absolute left-0 top-0"
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}