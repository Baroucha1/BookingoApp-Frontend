import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from 'next-themes';
import {
  LayoutDashboard, User, Plane, FileCheck2, Wifi, Building2,
  CreditCard, Wallet, Bell, LogOut, Sun, Moon,
  Mail, ChevronDown, Lock, Luggage, Menu, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n/LanguageContext';
import type { TranslationKey } from '@/i18n/translations';

const navItems = [
  { labelKey: 'clientNavDashboard', icon: LayoutDashboard, to: '/client' },
  { labelKey: 'profile', icon: User, to: '/client/profile' },
  { labelKey: 'clientNavFlights', icon: Plane, to: '/client/flights' },
  { labelKey: 'clientNavApplications', icon: FileCheck2, to: '/client/applications' },
  { labelKey: 'clientNavEsim', icon: Wifi, to: '/client/esim' },
  { labelKey: 'clientNavHotels', icon: Building2, to: null },
] satisfies readonly { labelKey: TranslationKey; icon: typeof LayoutDashboard; to: string | null }[];

const navItemsSecondary = [
  { labelKey: 'clientNavVisaPayments', icon: CreditCard, to: '/client/payments' },
  { labelKey: 'clientNavCustomPayments', icon: Wallet, to: '/client/custom-payments' },
  { labelKey: 'clientNavNotifications', icon: Bell, to: '/client/notifications' },
] satisfies readonly { labelKey: TranslationKey; icon: typeof CreditCard; to: string }[];

const ClientLayout = () => {
  const { t } = useLanguage();
  const { user, signOut } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isDark = resolvedTheme === 'dark';

  const fullName = user?.name && user?.lastName
      ? `${user.name} ${user.lastName}`
      : user?.email?.split('@')[0] ?? t('clientUser');

  const initials = fullName
      .split(' ')
      .map(p => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

  const isActive = (to: string) =>
      to === '/client' ? location.pathname === '/client' : location.pathname.startsWith(to);

  // Close drawer on navigation
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Lock body scroll + Escape to close while drawer is open (mobile)
  useEffect(() => {
    if (!sidebarOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSidebarOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [sidebarOpen]);

  const handleLogout = async () => {
    setSidebarOpen(false);
    await signOut();
    navigate('/login');
  };

  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');

  const linkClass = (active: boolean) =>
      cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
          active ? 'bg-white text-blue-600 shadow-sm' : 'text-blue-50 hover:bg-white/10',
      );

  return (
      <div className="min-h-screen lg:h-screen lg:overflow-hidden flex bg-[#F5F7FB] dark:bg-gray-950">

        {/* Mobile overlay */}
        <div
            onClick={() => setSidebarOpen(false)}
            className={cn(
                'fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 lg:hidden',
                sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
            )}
            aria-hidden="true"
        />

        {/* Sidebar: drawer on mobile, static on desktop */}
        <aside
            className={cn(
                'fixed inset-y-0 left-0 z-50 w-[280px] max-w-[85vw] shrink-0',
                'bg-gradient-to-b from-blue-600 to-blue-700 flex flex-col overflow-hidden',
                'transition-transform duration-300 ease-out',
                'lg:static lg:max-w-none lg:translate-x-0',
                sidebarOpen ? 'translate-x-0' : '-translate-x-full',
            )}
        >
          {/* Background image */}
          <img
              src="/sidebar.png"
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover opacity-15 pointer-events-none select-none"
          />

          {/* Decorative plane trails */}
          <svg className="absolute bottom-24 left-0 w-full h-40 text-white/10 pointer-events-none" viewBox="0 0 280 160" fill="none">
            <path d="M-10 40 Q 60 10, 120 50 T 290 30" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 5" />
            <path d="M-10 110 Q 80 90, 150 130 T 290 100" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 5" />
          </svg>

          {/* Logo + close (mobile) */}
          <div className="flex items-start justify-between px-6 pt-[calc(1.75rem+env(safe-area-inset-top,0px))] lg:pt-7 pb-4 relative z-10">
            <Link to="/">
              <p className="text-2xl font-bold text-white leading-tight">
                Bookin<span className="text-amber-400">GO</span>
              </p>
                <p className="text-xs text-blue-100/80 mt-0.5">{t('footerTagline')}</p>
            </Link>
            <button
                onClick={() => setSidebarOpen(false)}
                aria-label={t('clientCloseMenu')}
                className="lg:hidden -mr-2 w-9 h-9 flex items-center justify-center rounded-full text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable content: nav + logout + promo */}
          <div className="flex-1 overflow-y-auto relative z-10 flex flex-col">
            <nav className="mt-2 px-3">
              <ul className="space-y-1">
                {navItems.map(item => (
                    <li key={item.labelKey}>
                      {item.to ? (
                          <Link to={item.to} className={linkClass(isActive(item.to))}>
                            <item.icon className="w-4 h-4" />
                            {t(item.labelKey)}
                          </Link>
                      ) : (
                          <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-blue-200/50 cursor-not-allowed">
                      <span className="flex items-center gap-3">
                        <item.icon className="w-4 h-4" />
                        {t(item.labelKey)}
                      </span>
                            <Lock className="w-3.5 h-3.5" />
                          </div>
                      )}
                    </li>
                ))}
              </ul>

              <div className="my-4 border-t border-white/15" />

              <ul className="space-y-1">
                {navItemsSecondary.map(item => (
                    <li key={item.to}>
                      <Link to={item.to} className={linkClass(isActive(item.to))}>
                        <item.icon className="w-4 h-4" />
                        {t(item.labelKey)}
                      </Link>
                    </li>
                ))}
              </ul>
            </nav>

            <div className="mt-auto pt-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
              <div className="px-3 pb-3">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-blue-50 hover:bg-white/10 transition-colors"
                >
                        <LogOut className="w-4 h-4" /> {t('logout')}
                </button>
              </div>

              {/* Promo card */}
              <div className="mx-3 mb-4 rounded-2xl bg-blue-500/40 backdrop-blur-sm border border-white/10 p-4 text-center">
                <Luggage className="w-10 h-10 mx-auto text-amber-300 mb-2" strokeWidth={1.5} />
                <p className="font-semibold text-sm text-white">{t('clientPromoTitle')}</p>
                <p className="text-xs text-blue-100/80 mt-1 leading-snug">
                  {t('clientPromoDescription')}
                </p>
                <button className="w-full mt-3 flex items-center justify-center gap-2 rounded-xl bg-white hover:bg-blue-50 transition-colors text-blue-600 text-xs font-medium py-2">
                  <Mail className="w-3.5 h-3.5" /> {t('clientPromoSubscribe')}
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main column */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Header */}
          <header className="sticky top-0 z-30 h-[calc(4rem+env(safe-area-inset-top,0px))] lg:h-[72px] shrink-0 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 sm:px-6 lg:px-8 pt-[env(safe-area-inset-top,0px)] lg:pt-0 flex items-center justify-between lg:justify-end gap-3 sm:gap-5">

            {/* Left (mobile): hamburger + logo */}
            <div className="flex items-center gap-2 lg:hidden">
              <button
                  onClick={() => setSidebarOpen(true)}
                  aria-label={t('clientOpenMenu')}
                  aria-expanded={sidebarOpen}
                  className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
              <Link to="/" className="text-xl font-bold text-blue-600 leading-none">
                Bookin<span className="text-amber-400">GO</span>
              </Link>
            </div>

            {/* Right */}
            <div className="flex items-center gap-1 sm:gap-3 lg:gap-5">
              <button
                  onClick={toggleTheme}
                  className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 text-amber-500 transition-colors"
                  aria-label={isDark ? t('clientLightMode') : t('clientDarkMode')}
              >
                {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>
              <Link
                  to="/client/notifications"
                  aria-label={t('clientNavNotifications')}
                  className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 relative"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
              </Link>
              <div className="hidden sm:block w-px h-8 bg-gray-100 dark:bg-gray-800" />
              <Link to="/client/profile" className="flex items-center gap-2 min-w-0">
                <div className="w-9 h-9 shrink-0 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                  {initials}
                </div>
                <div className="hidden sm:block leading-tight min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate max-w-[160px]">{fullName}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[160px]">{user?.email}</p>
                </div>
                <ChevronDown className="hidden sm:block w-4 h-4 text-gray-400 shrink-0" />
              </Link>
            </div>
          </header>

          <main className="flex-1 lg:overflow-y-auto p-4 sm:p-6 lg:p-8 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] lg:pb-8">
            <Outlet />
          </main>
        </div>
      </div>
  );
};

export default ClientLayout;