import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText, Shield, Scale, ArrowRight } from 'lucide-react';
import TermsModal from '@/components/TermsModal';
import PrivacyModal from '@/components/PrivacyModal';
import LegalMentionsModal from '@/components/LegalMentionsModal';
import { useLanguage } from '@/i18n/LanguageContext';
import type { TranslationKey } from '@/i18n/translations';

type ModalAction = 'terms-modal' | 'privacy-modal' | 'legal-modal';

interface LegalItem {
    icon: React.ComponentType<{ className?: string }>;
    iconBg: string;
    iconColor: string;
    titleKey: TranslationKey;
    descriptionKey: TranslationKey;
    action: ModalAction;
}

const legalItems: LegalItem[] = [
    {
        icon: FileText,
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        titleKey: 'termsConditions',
        descriptionKey: 'legalTermsDescription',
        action: 'terms-modal',
    },
    {
        icon: Shield,
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
        titleKey: 'privacyPolicy',
        descriptionKey: 'legalPrivacyDescription',
        action: 'privacy-modal',
    },
    {
        icon: Scale,
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-600',
        titleKey: 'footerLegalNotice',
        descriptionKey: 'legalNoticeDescription',
        action: 'legal-modal',
    },
];

const sidebarItems: {
    labelKey: TranslationKey;
    to?: string;
    action?: ModalAction;
    icon: React.ComponentType<{ className?: string }>;
}[] = [
    { labelKey: 'footerLegal', to: '/legal-info', icon: FileText },
    { labelKey: 'termsConditions', action: 'terms-modal', icon: FileText },
    { labelKey: 'privacyPolicy', action: 'privacy-modal', icon: Shield },
    { labelKey: 'footerLegalNotice', action: 'legal-modal', icon: Scale },
];

const LegalInfoPage = () => {
    const { t } = useLanguage();
    const location = useLocation();
    const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
    const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
    const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);

    const openModal = (action?: ModalAction) => {
        if (action === 'terms-modal') setIsTermsModalOpen(true);
        if (action === 'privacy-modal') setIsPrivacyModalOpen(true);
        if (action === 'legal-modal') setIsLegalModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-[#F3F6FB]">

            {/* ── Hero ── */}
            <section className="relative overflow-hidden">
                <img
                    src="/legalinfo.png"
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-white via-white/70 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#F3F6FB]" />

                <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 py-16 md:py-20">
                    <div className="w-14 h-1 mb-4 rounded-full flex overflow-hidden">
                        <div className="w-1/2 h-full" style={{ background: '#FFB400' }} />
                        <div className="w-1/2 h-full" style={{ background: '#0865FE' }} />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-[#0B1E5C]">
                        {t('footerLegal')}
                    </h1>
                    <p className="text-gray-600 mt-4 max-w-md leading-relaxed">
                        {t('legalInfoDescription')}
                    </p>
                    <div className="w-14 h-1 mt-5 rounded-full" style={{ background: '#FFB400' }} />
                </div>
            </section>

            {/* ── Contenu : sidebar + carte principale ── */}
            <section className="max-w-7xl mx-auto px-6 md:px-10 py-10 md:py-14">
                <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">

                    {/* Sidebar */}
                    <nav className="bg-white rounded-2xl shadow-sm p-3 h-fit">
                        {sidebarItems.map((item) => {
                            const Icon = item.icon;
                            const active = item.to ? location.pathname === item.to : false;

                            if (item.action) {
                                return (
                                    <button
                                        key={item.labelKey}
                                        onClick={() => openModal(item.action)}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors text-left"
                                    >
                                        <Icon className="w-4 h-4 shrink-0" />
                                        <span>{t(item.labelKey)}</span>
                                    </button>
                                );
                            }

                            return (
                                <Link
                                    key={item.to}
                                    to={item.to!}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                                        active
                                            ? 'bg-blue-50 text-[#0865FE]'
                                            : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    <Icon className="w-4 h-4 shrink-0" />
                                    <span>{t(item.labelKey)}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Carte principale */}
                    <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
                        <div className="flex items-start gap-4">
                            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                <FileText className="w-7 h-7 text-[#0865FE]" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-extrabold text-[#0B1E5C]">
                                    {t('footerLegal')}
                                </h2>
                                <p className="text-gray-500 mt-1">
                                    {t('legalInfoDescription')}
                                </p>
                                <div className="w-14 h-1 mt-3 rounded-full" style={{ background: '#FFB400' }} />
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 mt-8">
                            {legalItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <button
                                        key={item.titleKey}
                                        onClick={() => openModal(item.action)}
                                        className="flex items-center justify-between gap-4 border border-gray-100 rounded-2xl px-6 py-5 hover:shadow-md hover:border-gray-200 transition-all text-left w-full"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${item.iconBg}`}>
                                                <Icon className={`w-5 h-5 ${item.iconColor}`} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-[#0B1E5C]">{t(item.titleKey)}</h3>
                                                <p className="text-sm text-gray-500 mt-0.5 max-w-lg">
                                                    {t(item.descriptionKey)}
                                                </p>
                                            </div>
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-[#0865FE] shrink-0" />
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            <TermsModal isOpen={isTermsModalOpen} onClose={() => setIsTermsModalOpen(false)} />
            <PrivacyModal isOpen={isPrivacyModalOpen} onClose={() => setIsPrivacyModalOpen(false)} />
            <LegalMentionsModal isOpen={isLegalModalOpen} onClose={() => setIsLegalModalOpen(false)} />
        </div>
    );
};

export default LegalInfoPage;