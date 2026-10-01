import { useEffect } from 'react';
import { X, Scale } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import type { TranslationKey } from '@/i18n/translations';

interface Section {
    number: number;
    titleKey: TranslationKey;
    textKey: TranslationKey;
}

const sections: Section[] = [
    {
        number: 1,
        titleKey: 'legalSection1',
        textKey: 'legalBody1',
    },
    {
        number: 2,
        titleKey: 'legalSection2',
        textKey: 'legalBody2',
    },
    {
        number: 3,
        titleKey: 'legalSection3',
        textKey: 'legalBody3',
    },
    {
        number: 4,
        titleKey: 'legalSection4',
        textKey: 'legalBody4',
    },
    {
        number: 5,
        titleKey: 'legalSection5',
        textKey: 'legalBody5',
    },
    {
        number: 6,
        titleKey: 'legalSection6',
        textKey: 'legalBody6',
    },
];

interface LegalMentionsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const LegalMentionsModal = ({ isOpen, onClose }: LegalMentionsModalProps) => {
    const { t } = useLanguage();

    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleKey);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-10 px-4 pt-[calc(2.5rem+env(safe-area-inset-top,0px))] pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))] px-[max(1rem,env(safe-area-inset-left,0px))]"
            style={{ background: 'rgba(15, 23, 42, 0.55)' }}
            onClick={onClose}
        >
            <div
                className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl relative"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    aria-label={t('flightClose')}
                    className="absolute top-5 right-5 w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors z-10"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="px-6 md:px-10 pt-8 md:pt-10 pb-8 max-h-[80vh] overflow-y-auto">
                    {/* Header */}
                    <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                            <Scale className="w-7 h-7 text-purple-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-extrabold text-[#0B1E5C]">
                                {t('footerLegalNotice')}
                            </h2>
                            <p className="text-gray-500 mt-1 text-sm max-w-xl">
                                {t('legalModalIntro')}
                            </p>
                        </div>
                    </div>

                    {/* Sections */}
                    <div className="flex flex-col gap-6 mt-8">
                        {sections.map((section, i) => (
                            <div key={section.number}>
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 font-bold text-sm flex items-center justify-center shrink-0">
                                        {section.number}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-[#0B1E5C]">{t(section.titleKey)}</h3>
                                        <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
                                            {t(section.textKey)}
                                        </p>
                                    </div>
                                </div>
                                {i < sections.length - 1 && (
                                    <div className="border-t border-gray-100 mt-6" />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Encadre final */}
                    <div className="flex items-start gap-4 mt-8 bg-purple-50 rounded-2xl px-6 py-5">
                        <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                            <Scale className="w-4 h-4 text-purple-600" />
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            {t('legalModalFinal')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LegalMentionsModal;