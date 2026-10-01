import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import type { TranslationKey } from '@/i18n/translations';
import type { LucideIcon } from 'lucide-react';
import {
  Plane, Building2, Stamp, Wifi, Tag,
  HelpCircle, FileQuestion, Mail, Ban,
  Users, BookOpen, Briefcase, Newspaper,
  FileCheck, Lock, ScrollText,
  Facebook, Instagram, X, Youtube,
} from 'lucide-react';
import TermsModal from '@/components/TermsModal';
import PrivacyModal from '@/components/PrivacyModal';
import LegalMentionsModal from '@/components/LegalMentionsModal';

const Anchor = 'a';

const socials = [
  { label: 'Facebook', Icon: Facebook, href: '#' },
  { label: 'Instagram', Icon: Instagram, href: '#' },
  { label: 'X', Icon: X, href: '#' },
  { label: 'YouTube', Icon: Youtube, href: '#' },
];

type ModalAction = 'terms-modal' | 'privacy-modal' | 'legal-modal';

interface ColumnLink {
  icon: LucideIcon;
  label: TranslationKey;
  to?: string;
  action?: ModalAction;
}

interface Column {
  title: TranslationKey;
  color: string;
  to?: string;
  links: ColumnLink[];
}

const columns: Column[] = [
  {
    title: 'footerServices',
    color: '#F5A623',
    to: '/#services',
    links: [
      { icon: Plane, label: 'footerFlights', to: '/flights' },
      { icon: Building2, label: 'footerHotels', to: '/hotels' },
      { icon: Stamp, label: 'footerVisas', to: '/visa' },
      { icon: Wifi, label: 'footerEsim', to: '/esim' },
      { icon: Tag, label: 'footerOffers', to: '/#offres' },
    ],
  },
  {
    title: 'footerSupport',
    color: '#F5A623',
    to: '/assistance',
    links: [
      { icon: HelpCircle, label: 'footerHelpCenter', to: '/assistance' },
      { icon: FileQuestion, label: 'footerFaq', to: '/assistance' },
      { icon: Mail, label: 'contactUs', to: '/contact' },
      { icon: Ban, label: 'footerCancellation', to: '/cancellation' },
    ],
  },
  {
    title: 'aboutUs',
    color: '#F5A623',
    links: [
      { icon: Users, label: 'footerWhoWeAre', to: '/about' },
      { icon: BookOpen, label: 'footerTravelBlog', to: '/blog' },
      { icon: Briefcase, label: 'footerCareers', to: '/careers' },
      { icon: Newspaper, label: 'footerPress', to: '/press' },
    ],
  },
  {
    title: 'footerLegal',
    color: '#0865FE',
    to: '/legal-info',
    links: [
      { icon: FileCheck, label: 'termsConditions', action: 'terms-modal' },
      { icon: Lock, label: 'privacyPolicy', action: 'privacy-modal' },
      { icon: ScrollText, label: 'footerLegalNotice', action: 'legal-modal' },
    ],
  },
];

interface SocialLinkProps {
  label: string;
  Icon: LucideIcon;
  href: string;
}

function SocialLink({ label, Icon, href }: SocialLinkProps) {
  return (
      <Anchor
          href={href}
          aria-label={label}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110 bg-[#1a1a2e] text-white hover:bg-[#0865FE]"
      >
        <Icon className="w-4 h-4" strokeWidth={2} />
      </Anchor>
  );
}

interface FooterLinkProps {
  link: ColumnLink;
  label: string;
  color: string;
  onModalOpen: (action: ModalAction) => void;
}

function FooterLink({ link, label, color, onModalOpen }: FooterLinkProps) {
  const Icon = link.icon;

  if (link.action) {
    return (
        <button
            onClick={() => onModalOpen(link.action!)}
            className="flex items-start gap-2 text-sm text-gray-500 hover:text-[#0B1E5C] transition-colors text-left"
        >
          <Icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color }} />
          <span>{label}</span>
        </button>
    );
  }

  return (
      <Link
          to={link.to!}
          className="flex items-start gap-2 text-sm text-gray-500 hover:text-[#0B1E5C] transition-colors"
      >
        <Icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color }} />
        <span>{label}</span>
      </Link>
  );
}

interface ColumnTitleProps {
  title: string;
  color: string;
  to?: string;
}

function ColumnTitle({ title, color, to }: ColumnTitleProps) {
  const className = 'font-bold text-sm mb-4 block';

  if (to) {
    return (
        <Link to={to} className={`${className} hover:underline`} style={{ color }}>
          {title}
        </Link>
    );
  }

  return (
      <h4 className={className} style={{ color }}>
        {title}
      </h4>
  );
}

const Footer = () => {
  const { t } = useLanguage();
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);

  const handleModalOpen = (action: ModalAction) => {
    if (action === 'terms-modal') setIsTermsModalOpen(true);
    if (action === 'privacy-modal') setIsPrivacyModalOpen(true);
    if (action === 'legal-modal') setIsLegalModalOpen(true);
  };

  return (
      <>
        <footer className="bg-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 md:py-12">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-x-8 gap-y-10">

              {/* Brand */}
              <div className="col-span-2 md:col-span-1">
              <span className="font-extrabold text-3xl tracking-tight select-none">
                <span className="text-[#0865FE]">Bookin</span>
                <span style={{ color: '#F5A623' }}>GO</span>
              </span>

                <p className="text-gray-900 text-sm font-bold mt-3">
                  {t('footerTagline')}
                </p>

                <p className="text-sm mt-2 leading-relaxed max-w-xs text-gray-500">
                  {t('footerDesc')}
                </p>
              </div>

              {/* Colonnes de liens */}
              {columns.map((col) => (
                  <div key={col.title}>
                      <ColumnTitle title={t(col.title)} color={col.color} to={col.to} />
                    <div className="space-y-3">
                      {col.links.map((l) => (
                        <FooterLink key={l.label} link={l} label={t(l.label)} color={col.color} onModalOpen={handleModalOpen} />
                      ))}
                    </div>
                  </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100" />

          {/* Bottom bar */}
          <div className="max-w-7xl mx-auto px-6 md:px-12 py-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} <strong className="text-gray-700">BookinGO</strong>. {t('allRightsReserved')}.
            </p>

            <div className="flex items-center gap-3">
              {socials.map((s) => (
                  <SocialLink key={s.label} label={s.label} Icon={s.Icon} href={s.href} />
              ))}
            </div>
          </div>
        </footer>

        <TermsModal isOpen={isTermsModalOpen} onClose={() => setIsTermsModalOpen(false)} />
        <PrivacyModal isOpen={isPrivacyModalOpen} onClose={() => setIsPrivacyModalOpen(false)} />
        <LegalMentionsModal isOpen={isLegalModalOpen} onClose={() => setIsLegalModalOpen(false)} />
      </>
  );
};

export default Footer;