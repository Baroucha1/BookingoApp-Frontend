import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, Bell, CreditCard, FileText, LayoutDashboard, Plane, Stamp, Hotel, Smartphone } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { type Language } from '@/i18n/translations';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';


const languages: { code: Language; label: string; flagUrl: string }[] = [
  { code: 'fr', label: 'FR', flagUrl: 'https://flagcdn.com/w20/fr.png' },
  { code: 'en', label: 'EN', flagUrl: 'https://flagcdn.com/w20/gb.png' },
  { code: 'ar', label: 'AR', flagUrl: 'https://flagcdn.com/w20/dz.png' },
];



const navLabels: Record<string, { fr: string; en: string; ar: string }> = {
  flights: { fr: 'VOLS', en: 'FLIGHTS', ar: 'رحلات' },
  visa: { fr: 'VISAS', en: 'VISAs', ar: 'تأشيرة' },
  hotel: { fr: 'HOTELS', en: 'HOTELs', ar: 'فندق' },
  esim: { fr: 'e-SIM', en: 'e-SIM', ar: 'ايسيم' },
};

const NAV_LINK_COLOR = '#0454E8';
const BRAND_GRADIENT = 'linear-gradient(135deg, #0865FE, #3B2F7E)';

const Navbar = () => {
  const { t, language, setLanguage } = useLanguage();
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  const isRtl = language === 'ar';
  const tr = (fr: string, en: string, ar: string) => (language === 'ar' ? ar : language === 'fr' ? fr : en);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      setHidden(y > 200 && y > lastScrollY.current);
      lastScrollY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close everything on route change
  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
    setLangOpen(false);
  }, [location.pathname]);

  // Lock body scroll + close on Escape while the drawer is open
  useEffect(() => {
    if (!mobileOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMobileOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [mobileOpen]);

  const initials = (user?.name || 'U')
      .split(/[\s@]/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s: string) => s[0]?.toUpperCase())
      .join('');

  const displayName = user?.name || user?.email?.split('@')[0];
  const roleLabel = isAdmin ? tr('Administrateur', 'Administrator', 'مسؤول') : tr('Client', 'Client', 'عميل');

  const handleLogout = async () => {
    setMobileOpen(false);
    setUserMenuOpen(false);
    await signOut();
    navigate('/');
  };

  const clientMenu = [
    { to: '/client/profile',       label: tr('Mon profil', 'My profile', 'ملفي'),                               icon: User },
    { to: '/client/applications',  label: tr('Mes demandes de visa', 'My visa applications', 'طلبات التأشيرة'), icon: FileText },
    { to: '/client/payments',      label: tr('Mes paiements', 'My payments', 'مدفوعاتي'),                       icon: CreditCard },
    { to: '/client/notifications', label: tr('Mes notifications', 'My notifications', 'الإشعارات'),            icon: Bell },
  ];

  const adminMenu = [
    { to: '/admin', label: tr('Tableau de bord', 'Dashboard', 'لوحة التحكم'), icon: LayoutDashboard },
  ];

  const accountItems = isAdmin ? adminMenu : clientMenu;

  const navLinkStyle: React.CSSProperties = {
    fontFamily: 'Archivo, sans-serif',
    fontWeight: 700,
    fontSize: '14px',
    lineHeight: '100%',
    color: NAV_LINK_COLOR,
  };

  const navLinks = [
    { to: '/flights', label: navLabels.flights[language], icon: Plane,      active: location.pathname === '/flights' },
    { to: '/visa',    label: navLabels.visa[language],    icon: Stamp,      active: location.pathname === '/visa' },
    { to: '/hotels',  label: navLabels.hotel[language],   icon: Hotel,      active: location.pathname.startsWith('/hotels') },
    { to: '/esim',    label: navLabels.esim[language],    icon: Smartphone, active: location.pathname.startsWith('/esim') },
  ];

  const UserAvatar = ({ className }: { className?: string }) => (
      <Avatar className={cn('border-2 border-gray-200', className)}>
        <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
          {initials || 'U'}
        </AvatarFallback>
      </Avatar>
  );

  return (
      <>
        <header
            className={cn(
                'fixed top-0 inset-x-0 z-50 transition-all duration-500 pt-safe px-safe',
                hidden && !mobileOpen ? '-translate-y-full' : 'translate-y-0',
                scrolled
                    ? 'bg-white/90 backdrop-blur-lg shadow-[0_2px_20px_-8px_rgba(0,0,0,0.10)] border-b border-gray-100'
                    : 'bg-white/60 border-b border-transparent',
            )}
        >
          <div className="container flex items-center justify-between h-16 gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center shrink-0">
              <img src="/newlogo.png" alt="BookinGO" style={{ width: '140px', height: 'auto' }} />
            </Link>

            {/* Desktop nav links */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map(link => (
                  <Link
                      key={link.to}
                      to={link.to}
                      style={navLinkStyle}
                      className={cn('transition-opacity hover:opacity-70', link.active && 'underline underline-offset-4')}
                  >
                    {link.label}
                  </Link>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* Language switcher */}
              <div className="relative">
                <Button
                    variant="ghost"
                    size="lg"
                    onClick={() => setLangOpen(!langOpen)}
                    className="gap-1.5 text-blue-700 hover:bg-gray-100 px-2"
                >
                  <img src={languages.find(l => l.code === language)?.flagUrl} alt="" className="w-5 h-5 rounded-lg" />
                  <span className="text-xs text-blue-700">{language.toUpperCase()}</span>
                </Button>
                {langOpen && (
                    <div className="absolute end-0 top-full mt-1 bg-white rounded-lg border border-gray-100 shadow-lg p-1 min-w-[120px] animate-fade-in">
                      {languages.map(l => (
                          <button
                              key={l.code}
                              onClick={() => { setLanguage(l.code); setLangOpen(false); }}
                              className={cn(
                                  'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-gray-50 transition-colors',
                                  language === l.code && 'bg-gray-50 font-medium',
                              )}
                          >
                            <img src={l.flagUrl} alt="" className="w-5 h-5 rounded-lg" />
                            <span className="text-blue-700">{l.label}</span>
                          </button>
                      ))}
                    </div>
                )}
              </div>

              {/* Desktop auth area */}
              {user ? (
                  <div className="relative hidden md:block">
                    <button
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                        className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 transition-colors hover:bg-gray-100 text-gray-800"
                    >
                      <UserAvatar className="w-8 h-8" />
                      <span className="text-sm font-medium max-w-[120px] truncate">{displayName}</span>
                    </button>
                    {userMenuOpen && (
                        <div className="absolute end-0 top-full mt-2 bg-white rounded-xl border border-gray-100 shadow-xl py-1.5 min-w-[220px] animate-fade-in">
                          <div className="px-3 py-2 border-b border-gray-100 mb-1">
                            <div className="text-sm font-medium truncate">{user.email}</div>
                            <div className="text-xs text-gray-400">{roleLabel}</div>
                          </div>
                          {accountItems.map(item => (
                              <Link
                                  key={item.to}
                                  to={item.to}
                                  className="flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-50 transition-colors text-gray-700"
                                  onClick={() => setUserMenuOpen(false)}
                              >
                                <item.icon className="w-4 h-4 text-gray-400" />
                                {item.label}
                              </Link>
                          ))}
                          <button
                              onClick={handleLogout}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-50 transition-colors text-red-500 border-t border-gray-100 mt-1"
                          >
                            <LogOut className="w-4 h-4" />
                            {t('logout')}
                          </button>
                        </div>
                    )}
                  </div>
              ) : (
                  <Link to="/login" className="hidden md:block">
                    <Button size="sm" className="rounded-sm px-4 font-semibold" style={{ background: BRAND_GRADIENT, color: '#fff' }}>
                      {t('login')}
                    </Button>
                  </Link>
              )}

              {/* Mobile menu trigger — always visible on mobile */}
              <button
                  onClick={() => setMobileOpen(true)}
                  aria-label={tr('Ouvrir le menu', 'Open menu', 'فتح القائمة')}
                  aria-expanded={mobileOpen}
                  className="md:hidden relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Menu className="w-6 h-6 text-gray-700" />
                {user && (
                    <Avatar className="absolute -bottom-0.5 -end-0.5 w-5 h-5 border-2 border-white shadow">
                      <AvatarFallback className="bg-primary text-primary-foreground text-[9px] font-semibold">
                        {initials || 'U'}
                      </AvatarFallback>
                    </Avatar>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Mobile drawer — rendered OUTSIDE <header> (see note below) */}
        <div
            className={cn(
                'fixed inset-0 z-[60] md:hidden transition-[visibility] duration-300',
                mobileOpen ? 'visible' : 'invisible',
            )}
            aria-hidden={!mobileOpen}
        >
          {/* Overlay */}
          <div
              onClick={() => setMobileOpen(false)}
              className={cn('absolute inset-0 bg-black/40 transition-opacity duration-300', mobileOpen ? 'opacity-100' : 'opacity-0')}
          />

          {/* Panel */}
          <aside
              role="dialog"
              aria-modal="true"
              className={cn(
                  'absolute inset-y-0 end-0 flex w-[85%] max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300 ease-out',
                  mobileOpen ? 'translate-x-0' : isRtl ? '-translate-x-full' : 'translate-x-full',
              )}
          >
            {/* Top bar with safe area */}
            <div className="flex items-center justify-between h-[calc(4rem+env(safe-area-inset-top,0px))] pt-safe px-4 border-b border-gray-100 shrink-0">
              <img src="/newlogo.png" alt="BookinGO" style={{ width: '130px', height: 'auto' }} />
              <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileOpen(false)}
                  aria-label={tr('Fermer', 'Close', 'إغلاق')}
                  className="text-gray-700 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col">
              {/* Main navigation */}
              <nav className="p-3 space-y-1">
                {navLinks.map(link => (
                    <Link
                        key={link.to}
                        to={link.to}
                        style={navLinkStyle}
                        className={cn(
                            'flex items-center gap-3 uppercase w-full px-4 py-3 rounded-xl transition-colors hover:bg-gray-50',
                            link.active && 'bg-gray-100',
                        )}
                    >
                      <link.icon className="w-5 h-5 shrink-0" strokeWidth={2} />
                      {link.label}
                    </Link>
                ))}
              </nav>

              {/* Bottom: user card + account section (or login) */}
              <div className="mt-auto border-t border-gray-100 p-3 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
                {user ? (
                    <>
                      <Link
                          to={isAdmin ? '/admin' : '/client/profile'}
                          className="flex items-center gap-3 rounded-xl p-3 mb-2 bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <UserAvatar className="w-11 h-11" />
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{displayName}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                          <p className="text-[11px] text-gray-400">{roleLabel}</p>
                        </div>
                      </Link>

                      <p className="px-4 pt-2 pb-2 text-[11px] font-medium uppercase tracking-wide text-gray-400">
                        {tr('Mon compte', 'My account', 'حسابي')}
                      </p>
                      {accountItems.map(item => (
                          <Link
                              key={item.to}
                              to={item.to}
                              className={cn(
                                  'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors',
                                  location.pathname === item.to && 'bg-gray-100 font-medium',
                              )}
                          >
                            <item.icon className="w-4 h-4 text-gray-400" />
                            {item.label}
                          </Link>
                      ))}
                      <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 mt-1 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        {t('logout')}
                      </button>
                    </>
                ) : (
                    <Link to="/login">
                      <Button className="w-full rounded-full" style={{ background: BRAND_GRADIENT, color: '#fff' }}>
                        {t('login')}
                      </Button>
                    </Link>
                )}
              </div>
            </div>
          </aside>
        </div>
      </>
  );
};

export default Navbar;