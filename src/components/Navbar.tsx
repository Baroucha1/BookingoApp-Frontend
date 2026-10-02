import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, Bell, CreditCard, FileText, LayoutDashboard, ChevronDown, Globe } from 'lucide-react';
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

// Nav link label per language — labels match the target design (uppercase, French-first)
const navLabels: Record<string, { fr: string; en: string; ar: string }> = {
  flights: { fr: 'VOLS', en: 'FLIGHTS', ar: 'رحلات' },
  visa: { fr: 'VISAS', en: 'VISAs', ar: 'تأشيرة' },
  hotel: { fr: 'HOTELS', en: 'HOTELs', ar: 'فندق' },
  esim: { fr: 'e-SIM', en: 'e-SIM', ar: 'ايسيم' },
};

const NAV_LINK_COLOR = '#0454E8';

const Navbar = () => {
  const { t, language, setLanguage } = useLanguage();
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);



  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
    setLangOpen(false);
  }, [location.pathname]);

  // Scroll detection for backdrop blur and contrast
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const initials = ( user?.name || 'U')
      .split(/[\s@]/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s: string) => s[0]?.toUpperCase())
      .join('');

  const handleLogout = async () => {
    signOut();
    navigate('/');
  };

  const clientMenu = [
    { to: '/client/profile',       label: t('profile'),          icon: User },
    { to: '/client/applications',  label: t('myApplications'),   icon: FileText },
    { to: '/client/payments',      label: t('myPayments'),       icon: CreditCard },
    { to: '/client/notifications', label: t('myNotifications'),  icon: Bell },
  ];

  const adminMenu = [
    { to: '/admin', label: t('dashboard'), icon: LayoutDashboard },
  ];

  const dropdownItems = isAdmin ? adminMenu : clientMenu;

  const navLinks = [
    { to: '/flights', label: t('flights'), active: location.pathname === '/flights' },
    { to: '/hotels', label: t('hotels'), active: location.pathname.startsWith('/hotels') },
    { to: '/visa', label: t('visas'), active: location.pathname === '/visa' },
    { to: '/esim', label: t('esim'), active: location.pathname.startsWith('/esim') },
  ];

  // Pages where header must disappear: search results, ticket booking, payment, visa application forms, etc.
  const isHiddenPage =
    location.pathname.startsWith('/flights/booking') ||
    location.pathname === '/flights/book' ||
    location.pathname === '/flights/confirmation' ||
    location.pathname === '/flights/v2' ||
    location.pathname.startsWith('/apply') ||
    location.pathname.startsWith('/esim/checkout') ||
    location.pathname.startsWith('/client/pay') ||
    location.pathname.startsWith('/receipt');

  if (isHiddenPage) {
    return null;
  }

  const isHotelSection = location.pathname.startsWith('/hotels');

  const isDarkHeroPage =
    location.pathname === '/' ||
    location.pathname === '/home' ||
    location.pathname === '/index.html' ||
    location.pathname === '/flights' ||
    location.pathname === '/login' ||
    isHotelSection;
  const isTransparentAndDark = isDarkHeroPage && !scrolled;

  return (
      <header
        className="absolute top-0 inset-x-0 z-[60] transition-all duration-300 bg-transparent px-4 sm:px-8"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)',
          paddingBottom: '0.75rem',
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between h-12">

          {/* Logo */}
          <Link to="/" className="flex items-center shrink-0 active:scale-95 transition-transform" aria-label="BookinGO">
            <img
              src="/chart/LOGO_BOOKINGO.png"
              alt="BookinGO"
              className={cn(
                "h-7 sm:h-8 w-auto object-contain transition-all",
                (isTransparentAndDark || isHotelSection)
                  ? "brightness-0 invert drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
                  : "drop-shadow-xs"
              )}
            />
          </Link>

          {/* Nav links (Desktop & Tablet) */}
          <nav className="hidden md:flex items-center gap-3.5 lg:gap-7">
            {navLinks.map(link => (
                <Link
                    key={link.to}
                    to={link.to}
                    className={cn(
                        'transition-all duration-200 font-semibold text-sm tracking-tight',
                        isTransparentAndDark
                          ? 'text-white/90 hover:text-white'
                          : 'text-[#002161] dark:text-gray-200 hover:text-blue-600',
                        link.active && (isTransparentAndDark ? 'text-white underline underline-offset-4' : 'text-blue-600 dark:text-white underline underline-offset-4 font-bold'),
                    )}
                >
                  {link.label}
                </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2.5">

            {/* Language switcher select with Apple frost pill */}
            <div className="relative inline-flex items-center">
              <div
                className={cn(
                  "flex items-center gap-1.5 sm:gap-2 backdrop-blur-xl rounded-full px-2.5 sm:px-3 py-1.5 transition-all duration-200 border text-xs font-semibold pointer-events-none select-none",
                  isTransparentAndDark
                    ? "bg-white/15 border-white/25 text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)]"
                    : "bg-white/80 hover:bg-white dark:bg-white/10 dark:hover:bg-white/15 border-black/[0.08] dark:border-white/[0.12] text-gray-800 dark:text-gray-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]"
                )}
              >
                <Globe className={cn("w-3.5 h-3.5 shrink-0", isTransparentAndDark ? "text-white" : "text-gray-600 dark:text-gray-300")} />
                <img
                  src={languages.find(l => l.code === language)?.flagUrl}
                  alt=""
                  className="w-4 h-4 rounded-full object-cover shrink-0 shadow-xs"
                />
                <span className="tracking-wider">{language.toUpperCase()}</span>
                <ChevronDown className={cn("w-3.5 h-3.5 shrink-0 transition-transform duration-200", isTransparentAndDark ? "text-white/80" : "text-gray-500")} />
              </div>

              {/* Native mobile-first select: reliable on mobile web, Android & iOS Capacitor WebView */}
              <select
                id="header-language-select"
                aria-label={t('selectLanguage')}
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-base bg-transparent z-20 appearance-none"
              >
                <option value="fr" className="text-gray-900 bg-white">FR — Français</option>
                <option value="en" className="text-gray-900 bg-white">EN — English</option>
                <option value="ar" className="text-gray-900 bg-white">AR — العربية</option>
              </select>
            </div>

            {/* Auth area (desktop only) */}
            {user ? (
                <div className="relative hidden md:block">
                  <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className={cn(
                        "flex items-center gap-2 rounded-full pl-1 pr-3 py-1 transition-all duration-200 border",
                        isTransparentAndDark
                          ? "text-white bg-white/15 hover:bg-white/25 border-white/25 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)]"
                          : "text-gray-800 dark:text-gray-100 bg-white/80 hover:bg-white dark:bg-white/10 dark:hover:bg-white/15 border-black/[0.08] dark:border-white/[0.12] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]"
                      )}
                  >
                    <Avatar className="w-7 h-7 border border-white/60 shadow-xs">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                        {initials || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline text-xs font-semibold max-w-[120px] truncate">
                      {user.name || user.email?.split('@')[0]}
                    </span>
                  </button>
                  {userMenuOpen && (
                      <div className="absolute end-0 top-full mt-2.5 bg-white/80 dark:bg-[#1c1c1e]/85 backdrop-blur-2xl backdrop-saturate-[190%] rounded-2xl border border-black/[0.08] dark:border-white/[0.12] shadow-[0_20px_40px_-8px_rgba(0,0,0,0.15),inset_0_1px_0_0_rgba(255,255,255,0.9)] py-2 min-w-[220px] animate-fade-in z-50">
                        <div className="px-4 py-2 border-b border-black/[0.06] dark:border-white/[0.08] mb-1">
                          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{user.email}</div>
                          <div className="text-xs text-gray-400">
                            {isAdmin ? t('adminRole') : t('clientRole')}
                          </div>
                        </div>
                        {dropdownItems.map(item => (
                            <Link
                                key={item.to}
                                to={item.to}
                                className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium hover:bg-black/[0.05] dark:hover:bg-white/[0.08] rounded-xl mx-1.5 transition-colors text-gray-700 dark:text-gray-200"
                                onClick={() => setUserMenuOpen(false)}
                            >
                              <item.icon className="w-4 h-4 text-gray-400" />
                              {item.label}
                            </Link>
                        ))}
                        <button
                            onClick={handleLogout}
                            className="w-[calc(100%-12px)] mx-1.5 flex items-center gap-2.5 px-3 py-2 text-xs font-medium hover:bg-red-500/10 transition-colors text-red-500 rounded-xl border-t border-black/[0.06] dark:border-white/[0.08] mt-1"
                        >
                          <LogOut className="w-4 h-4" />
                          {t('logout')}
                        </button>
                      </div>
                  )}
                </div>
            ) : (
                <Link to="/login" className="hidden md:block">
                  <Button
                      size="sm"
                      className="rounded-full px-5 font-semibold shadow-[0_2px_8px_rgba(8,101,254,0.3)] hover:shadow-[0_4px_12px_rgba(8,101,254,0.4)] hover:brightness-105 transition-all active:scale-95 text-xs h-8.5"
                      style={{ background: 'linear-gradient(135deg, #0865FE, #3B2F7E)', color: '#fff' }}
                  >
                    {t('login')}
                  </Button>
                </Link>
            )}
          </div>
        </div>
      </header>
  );
};

export default Navbar;