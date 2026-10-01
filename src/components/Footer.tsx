import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import {
  Plane, Building2, Stamp, Wifi, Tag,
  HelpCircle, FileQuestion, Mail, Ban,
  Users, BookOpen, Briefcase, Newspaper,
  FileCheck, Lock, ScrollText,
  Facebook, Instagram, X, Youtube,
} from 'lucide-react';

const Anchor = 'a';

const socials = [
  { label: 'Facebook', Icon: Facebook, href: '#' },
  { label: 'Instagram', Icon: Instagram, href: '#' },
  { label: 'X', Icon: X, href: '#' },
  { label: 'YouTube', Icon: Youtube, href: '#' },
];

const columns = [
  {
    title: 'Services',
    color: '#F5A623',
    to: '/#services',
    links: [
      { icon: Plane, label: 'Vols', to: '/flights' },
      { icon: Building2, label: 'Hotels', to: '/hotels' },
      { icon: Stamp, label: 'Visas', to: '/visa' },
      { icon: Wifi, label: 'eSIM', to: '/esim' },
      { icon: Tag, label: 'Offres', to: '/#offres' },
    ],
  },
  {
    title: 'Assistance',
    color: '#F5A623',
    to: '/assistance',
    links: [
      { icon: HelpCircle, label: "Centre d'aide", to: '/assistance' },
      { icon: FileQuestion, label: 'FAQ', to: '/assistance' },
      { icon: Mail, label: 'Nous contacter', to: '/contact' },
      { icon: Ban, label: 'Annulation/Remboursement', to: '/cancellation' },
    ],
  },
  {
    title: 'A propos',
    color: '#F5A623',
    links: [
      { icon: Users, label: 'Qui sommes nous ?', to: '/about' },
      { icon: BookOpen, label: 'Blog Voyage', to: '/blog' },
      { icon: Briefcase, label: 'Carrieres', to: '/careers' },
      { icon: Newspaper, label: 'Presse', to: '/press' },
    ],
  },
  {
    title: 'Informations Legales',
    color: '#0865FE',
    links: [
      { icon: FileCheck, label: 'Conditions generales', to: '/terms' },
      { icon: Lock, label: 'Politique de confidentialite', to: '/privacy' },
      { icon: ScrollText, label: 'Mentions legales', to: '/legal' },
    ],
  },
];

interface SocialLinkProps {
  label: string;
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
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
  label: string;
  to: string;
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
}

function FooterLink({ label, to, Icon, color }: FooterLinkProps) {
  return (
      <Link
          to={to}
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
  const location = useLocation();

  if (location.pathname === '/hotels') {
    return null;
  }

  return (
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
                Voyagez, explorez, vivez plus
              </p>

              <p className="text-sm mt-2 leading-relaxed max-w-xs text-gray-500">
                {t('footerDesc') || "Votre plateforme de confiance pour l'obtention de visas electroniques."}
              </p>
            </div>

            {/* Colonnes de liens */}
            {columns.map((col) => (
                <div key={col.title}>
                  <ColumnTitle title={col.title} color={col.color} to={col.to} />
                  <div className="space-y-3">
                    {col.links.map((l) => (
                        <FooterLink key={l.label} label={l.label} to={l.to} Icon={l.icon} color={col.color} />
                    ))}
                  </div>
                </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100" />

        {/* Bottom bar */}
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} <strong className="text-gray-700">BookinGO</strong>. Tous droits reserves.
          </p>

          <div className="flex items-center gap-3">
            {socials.map((s) => (
                <SocialLink key={s.label} label={s.label} Icon={s.Icon} href={s.href} />
            ))}
          </div>
        </div>
      </footer>
  );
};

export default Footer;