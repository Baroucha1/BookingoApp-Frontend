import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    HelpCircle, FileQuestion, Mail, Ban, ClipboardList,
    ChevronRight, Headphones, MessageCircle,
} from 'lucide-react';
import HelpCenterModal from '@/components/HelpCenterModal';
import FAQModal from '@/components/FAQModal';
import { useLanguage } from '@/i18n/LanguageContext';
import type { TranslationKey } from '@/i18n/translations';

interface AssistanceItem {
    icon: React.ComponentType<{ className?: string }>;
    iconBg: string;
    iconColor: string;
    titleKey: TranslationKey;
    descriptionKey: TranslationKey;
    to?: string;
    action?: 'help-modal' | 'faq-modal';
}

const items: AssistanceItem[] = [
    {
        icon: HelpCircle,
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        titleKey: 'assistanceHelpTitle',
        descriptionKey: 'assistanceHelpDescription',
        action: 'help-modal',
    },
    {
        icon: FileQuestion,
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-600',
        titleKey: 'footerFaq',
        descriptionKey: 'assistanceFaqDescription',
        action: 'faq-modal',
    },
    {
        icon: Mail,
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        titleKey: 'assistanceContactTitle',
        descriptionKey: 'assistanceContactDescription',
        to: '/contact',
    },
    {
        icon: Ban,
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600',
        titleKey: 'assistanceCancellationTitle',
        descriptionKey: 'assistanceCancellationDescription',
        to: '/cancellation',
    },
    {
        icon: ClipboardList,
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
        titleKey: 'assistanceBookingTermsTitle',
        descriptionKey: 'assistanceBookingTermsDescription',
        to: '/booking-terms',
    },
];

const AssistancePage = () => {
    const { t } = useLanguage();
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
    const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#F3F6FB]">

            {/* ── Hero ── */}
            <section className="relative overflow-hidden">
                <img
                    src="/assistance.png"
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-white via-white/70 to-transparent" />

                <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 py-16 md:py-20">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-[#0B1E5C]">
                        {t('assistanceTitle')}
                    </h1>
                    <p className="text-gray-600 mt-4 max-w-md leading-relaxed">
                        {t('assistanceDescription')}
                    </p>
                    <div className="w-14 h-1 mt-5 rounded-full" style={{ background: '#FFB400' }} />
                </div>
            </section>

            {/* ── List ── */}
            <section className="max-w-4xl mx-auto px-6 md:px-10 py-10 md:py-14">
                <div className="flex flex-col gap-4">
                    {items.map((item) => {
                        const Icon = item.icon;

                        const content = (
                            <>
                                <div className="flex items-center gap-4">
                                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${item.iconBg}`}>
                                        <Icon className={`w-5 h-5 ${item.iconColor}`} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-[#0B1E5C]">{t(item.titleKey)}</h3>
                                        <p className="text-sm text-gray-500 mt-0.5">{t(item.descriptionKey)}</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
                            </>
                        );

                        if (item.action === 'help-modal') {
                            return (
                                <button
                                    key={item.titleKey}
                                    onClick={() => setIsHelpModalOpen(true)}
                                    className="flex items-center justify-between gap-4 bg-white rounded-2xl px-6 py-5 shadow-sm hover:shadow-md transition-shadow text-left w-full"
                                >
                                    {content}
                                </button>
                            );
                        }

                        if (item.action === 'faq-modal') {
                            return (
                                <button
                                    key={item.titleKey}
                                    onClick={() => setIsFaqModalOpen(true)}
                                    className="flex items-center justify-between gap-4 bg-white rounded-2xl px-6 py-5 shadow-sm hover:shadow-md transition-shadow text-left w-full"
                                >
                                    {content}
                                </button>
                            );
                        }

                        return (
                            <Link
                                key={item.titleKey}
                                to={item.to!}
                                className="flex items-center justify-between gap-4 bg-white rounded-2xl px-6 py-5 shadow-sm hover:shadow-md transition-shadow"
                            >
                                {content}
                            </Link>
                        );
                    })}

                    {/* ── CTA banner ── */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl px-6 py-5 mt-2" style={{ background: '#E3EAFB' }}>
                        <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center shrink-0">
                                <Headphones className="w-5 h-5 text-[#0B1E5C]" />
                            </div>
                            <div>
                                <h3 className="font-bold text-[#0B1E5C]">{t('assistanceUrgentTitle')}</h3>
                                <p className="text-sm text-gray-600 mt-0.5">
                                    {t('assistanceAvailability')}
                                </p>
                            </div>
                        </div>
                        <Link
                            to="/contact"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white shrink-0"
                            style={{ background: '#0B1E5C' }}
                        >
                            <MessageCircle className="w-4 h-4" />
                            {t('assistanceContactTitle')}
                        </Link>
                    </div>
                </div>
            </section>

            <HelpCenterModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
            <FAQModal isOpen={isFaqModalOpen} onClose={() => setIsFaqModalOpen(false)} />
        </div>
    );
};

export default AssistancePage;