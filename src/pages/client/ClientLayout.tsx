import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from 'next-themes';
import {
  LayoutDashboard, User, Plane, FileCheck2, Wifi, Building2,
  CreditCard, Wallet, Bell, LogOut, Sun, Moon,
  Mail, ChevronDown, Lock, Luggage,
} from 'lucide-react';
import BottomNavbar from '@/components/BottomNavbar';

const navItems = [
  { label: 'Tableau de bord', icon: LayoutDashboard, to: '/client' },
  { label: 'Profil', icon: User, to: '/client/profile' },
  { label: 'Mes vols', icon: Plane, to: '/client/flights' },
  { label: 'Mes visas', icon: FileCheck2, to: '/client/applications' },
  { label: 'Mes eSIM', icon: Wifi, to: '/client/esim' },
  { label: 'Mes hôtels', icon: Building2, to: null }, // module suspendu
];

const navItemsSecondary = [
  { label: 'Paiements', icon: CreditCard, to: '/client/payments' },
  { label: 'Demandes de paiements', icon: Wallet, to: '/client/custom-payments' },
  { label: 'Notifications', icon: Bell, to: '/client/notifications' },
];

const ClientLayout = () => {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const isDark = theme === 'dark';

  const fullName = user?.name && user?.lastName
      ? `${user.name} ${user.lastName}`
      : user?.email?.split('@')[0] ?? 'Utilisateur';

  const initials = fullName
      .split(' ')
      .map(p => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

  const isActive = (to: string) =>
      to === '/client' ? location.pathname === '/client' : location.pathname.startsWith(to);

  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');

  const renderNavLinks = () => (
    <>
      <ul className="space-y-1">
        {navItems.map(item => (
          <li key={item.label}>
            {item.to ? (
              <Link
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive(item.to)
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-blue-50 hover:bg-white/10'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ) : (
              <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-blue-200/50 cursor-not-allowed">
                <span className="flex items-center gap-3">
                  <item.icon className="w-4 h-4" />
                  {item.label}
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
            <Link
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive(item.to)
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-blue-50 hover:bg-white/10'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );

  return (
    <div className={`min-h-screen flex ${location.pathname === '/client/profile' ? 'bg-white' : 'bg-[#F5F7FB]'} dark:bg-gray-950`}>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-[280px] shrink-0 bg-gradient-to-b from-blue-600 to-blue-700 flex-col relative overflow-hidden">
        {/* Background image, reduced opacity */}
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

        <Link to="/" className="px-5 pt-6 pb-4 relative z-10 block" aria-label="BookinGO">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl px-3.5 py-2 shadow-md border border-white/40 inline-flex items-center hover:bg-white transition-all">
            <img
              src="/chart/LOGO_BOOKINGO.png"
              alt="BookinGO"
              className="h-8.5 w-auto object-contain select-none"
            />
          </div>
          <p className="text-[11px] text-blue-100/90 mt-2 font-medium tracking-wide">Book Easy. Go Anywhere !</p>
        </Link>

        <nav className="mt-2 px-3 flex-1 overflow-y-auto relative z-10">
          {renderNavLinks()}
        </nav>

        <div className="px-3 pb-3 relative z-10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-blue-50 hover:bg-white/10 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Déconnexion
          </button>
        </div>

        {/* Promo card */}
        <div className="mx-3 mb-4 rounded-2xl bg-blue-500/40 backdrop-blur-sm border border-white/10 p-4 text-center relative overflow-hidden z-10">
          <Luggage className="w-10 h-10 mx-auto text-amber-300 mb-2" strokeWidth={1.5} />
          <p className="font-semibold text-sm text-white">Des offres exclusives</p>
          <p className="text-xs text-blue-100/80 mt-1 leading-snug">
            Recevez nos meilleures offres et bons plans voyage !
          </p>
          <button className="w-full mt-3 flex items-center justify-center gap-2 rounded-xl bg-white hover:bg-blue-50 transition-colors text-blue-600 text-xs font-medium py-2">
            <Mail className="w-3.5 h-3.5" /> S'inscrire
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <header
          className="shrink-0 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 md:px-8 flex items-center justify-between gap-3 md:h-[72px]"
          style={{
            paddingTop: 'env(safe-area-inset-top, 0px)',
            minHeight: 'calc(env(safe-area-inset-top, 0px) + 64px)',
          }}
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2 md:hidden">
            <Link to="/" className="flex items-center active:scale-95 transition-transform" aria-label="BookinGO">
              <img
                src="/chart/LOGO_BOOKINGO.png"
                alt="BookinGO"
                className="h-8.5 w-auto object-contain select-none"
              />
            </Link>
          </div>

          <div className="flex items-center gap-3 md:gap-5 ml-auto">
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 text-amber-500 transition-colors"
              aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
            >
              {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            <Link
              to="/client/notifications"
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 relative"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
            </Link>
            <div className="w-px h-6 md:h-8 bg-gray-100 dark:bg-gray-800" />
            <Link to="/client/profile" className="flex items-center gap-2 cursor-pointer">
              <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold shrink-0">
                {initials}
              </div>
              <div className="leading-tight hidden sm:block">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate max-w-[140px]">{fullName}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[140px]">{user?.email}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
            </Link>
          </div>
        </header>

        {/* Main content with bottom padding for mobile BottomNavbar */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 pb-28 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Floating Bottom Navbar for mobile */}
      <BottomNavbar />
    </div>
  );
};

export default ClientLayout;