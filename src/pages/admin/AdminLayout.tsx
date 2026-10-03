import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard, Globe, FileText, LogOut, Menu, X, MapPin,
  CreditCard, Users, Plane, ChevronRight, ChevronDown, User as UserIcon, Settings,
  Wifi, Bed, Bell, Tag, Percent, Receipt, Layers, RefreshCw, Wrench, Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { currentAdminUser } from '@/lib/mockAdminData';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';


interface NavLeaf {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

interface NavGroup {
  key: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: NavLeaf[];
  disabled?: boolean;
  defaultOpen?: boolean;
}

const rootTop: NavLeaf[] = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
];


const productGroups: NavGroup[] = [
  {
    key: 'vols',
    icon: Plane,
    label: 'Vols',
    defaultOpen: true,
    children: [
      { to: '/admin/flight-bookings',     icon: Plane,   label: 'Flights Bookings' },
      { to: '/admin/flight-service-fees', icon: Receipt, label: 'Frais de service' },
      { to: '/admin/flight-acd-fees',     icon: Tag,     label: 'Frais ACD Zone A' },
      { to: '/admin/flight-commissions',  icon: Percent, label: 'Commissions' },
      { to: '/admin/flight-promo-codes',  icon: Tag,     label: 'Codes Promos' },
    ],
  },
  {
    key: 'hotels',
    icon: Bed,
    label: 'Hôtels',
    defaultOpen: false,
    children: [
      { to: '/admin/hotels/test', icon: Wrench, label: 'Test API' },
    ],
  },
  {
    key: 'evisa',
    icon: Globe,
    label: 'e-visa',
    defaultOpen: false,
    children: [
      { to: '/admin/countries',    icon: MapPin,   label: 'Pays' },
      { to: '/admin/visa-types',   icon: Globe,    label: 'Types de visa' },
      { to: '/admin/applications', icon: FileText, label: 'Demandes' },
      { to: '/admin/payments', icon: CreditCard, label: 'visa Paiements' },
    ],
  },
];

const esimLeaf: NavLeaf = { to: '/admin/esim', icon: Wifi, label: 'eSIM' };



const parametresItems: NavLeaf[] = [

  { to: '/admin/client-payments', icon: CreditCard, label: 'Client Paiements' },
  { to: '/admin/contact-messages', icon: Mail, label: 'Messages de contact' },
  { to: '/admin/users',    icon: Users,      label: 'Utilisateurs' },
  { to: '/admin/fournisseurs',   icon: Layers,    label: 'Fournisseurs' },
  { to: '/admin/exchange-rates', icon: RefreshCw, label: 'Taux de change' },
];

const PAGE_TITLES: Record<string, string> = {
  '/admin':                     'Tableau de bord',
  '/admin/countries':           'Pays',
  '/admin/visa-types':          'Types de visa',
  '/admin/applications':        'Demandes',
  '/admin/payments':             'Paiements',
  '/admin/esim':                 'eSIM',
  '/admin/users':                'Utilisateurs',
  '/admin/flight-bookings':      'Flights Bookings',
  '/admin/flight-service-fees':  'Frais de service',
  '/admin/flight-acd-fees':      'Frais ACD Zone A',
  '/admin/flight-commissions':   'Commissions',
  '/admin/flight-promo-codes':   'Codes Promos',
  '/admin/fournisseurs':   'Fournisseurs',
  '/admin/exchange-rates': 'Taux de change',
  '/admin/custom-payments': 'Custom Paiements',
  '/admin/hotels/test': 'Test API Hôtels',
  '/admin/contact-messages': 'Messages de contact',
};

const ROLE_COLOR: Record<string, string> = {
  ADMIN:  'bg-white text-[#1775FF] border-white',
  AGENCY: 'bg-[#FEC425] text-[#0B0F2E] border-[#FEC425]',
  CLIENT: 'bg-white/20 text-white border-white/30',
};

const initialsOf = (name: string, email: string) => {
  if (name?.trim()) {
    return name.trim().split(/\s+/).map(s => s[0]?.toUpperCase()).filter(Boolean).slice(0, 2).join('');
  }
  return email.split('@')[0].split(/[._-]/).map(s => s[0]?.toUpperCase()).filter(Boolean).slice(0, 2).join('') || 'A';
};

const HEADER_HEIGHT = 'h-20'; // shared height so navbar and sidebar logo block line up exactly

const AdminLayout = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
      Object.fromEntries(productGroups.map(g => [g.key, !!g.defaultOpen]))
  );

  const toggleGroup = (key: string) =>
      setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="animate-spin w-8 h-8 border-4 border-[#1775FF] border-t-transparent rounded-full" />
        </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  const displayEmail = user.email ?? currentAdminUser.email;
  const displayName  = (user as any).name?.trim() || displayEmail.split('@')[0];
  const role         = currentAdminUser.role;
  const initials     = initialsOf((user as any).name, displayEmail);
  const pageTitle    = PAGE_TITLES[location.pathname] ?? 'Admin';

  const isLeafActive = (to: string) => location.pathname === to;
  const isGroupActive = (g: NavGroup) => g.children.some(c => isLeafActive(c.to));

  const renderLeaf = (item: NavLeaf, indent = false) => {
    const active = isLeafActive(item.to);
    return (
        <Link
            key={item.to}
            to={item.to}
            onClick={() => setSidebarOpen(false)}
            className={cn(
                'group flex items-center gap-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                indent ? 'ps-9 pe-3' : 'px-3',
                active
                    ? 'bg-[#1775FF] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-[#DFECFF]/60 hover:text-[#1775FF]'
            )}
        >
          <item.icon className={cn('w-4 h-4 transition-transform shrink-0', !active && 'group-hover:scale-110')} />
          <span className="truncate">{item.label}</span>
        </Link>
    );
  };

  const renderGroup = (g: NavGroup) => {
    const open = !!openGroups[g.key];
    const active = isGroupActive(g);

    if (g.disabled) {
      return (
          <div
              key={g.key}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 cursor-not-allowed select-none"
              title="Bientôt disponible"
          >
            <g.icon className="w-4 h-4 shrink-0" />
            <span className="flex-1 truncate">{g.label}</span>
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 leading-none border-slate-200 text-slate-400">
              Bientôt
            </Badge>
          </div>
      );
    }

    return (
        <div key={g.key}>
          <button
              type="button"
              onClick={() => toggleGroup(g.key)}
              className={cn(
                  'w-full group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  active && !open
                      ? 'text-[#1775FF] bg-[#DFECFF]/70'
                      : 'text-slate-600 hover:bg-[#DFECFF]/60 hover:text-[#1775FF]'
              )}
          >
            <g.icon className="w-4 h-4 shrink-0 group-hover:scale-110 transition-transform" />
            <span className="flex-1 text-start truncate">{g.label}</span>
            <ChevronDown className={cn('w-3.5 h-3.5 shrink-0 transition-transform duration-200', open && 'rotate-180')} />
          </button>
          {open && (
              <div className="mt-1 space-y-1">
                {g.children.map((c) => renderLeaf(c, true))}
              </div>
          )}
        </div>
    );
  };

  return (
      <div className="min-h-screen flex bg-[#F7FAFF] text-foreground">
        {sidebarOpen && (
            <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <aside
            className={`fixed lg:static inset-y-0 start-0 z-50 w-64 bg-white text-slate-700 border-e border-slate-100 flex flex-col transform transition-transform duration-300 lg:translate-x-0 ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full'
            }`}
        >
          {/* Branding — clean white block so logo stands out with its real colors */}
          <div className={cn(HEADER_HEIGHT, 'px-5 flex items-center bg-white border-b border-slate-100 shrink-0')}>
            <Link to="/" className="flex items-center active:scale-95 transition-transform" aria-label="BookinGO">
              <img
                  src="/chart/LOGO_BOOKINGO.png"
                  alt="BookinGO"
                  className="h-9.5 w-auto object-contain select-none"
              />
            </Link>
          </div>

          {/* Profile card — photo background, like the reference */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                  className="relative w-full h-24 flex items-center gap-3 px-4 shrink-0 text-start overflow-hidden group"
                  style={{
                    backgroundImage: `linear-gradient(90deg, rgba(23,117,255,0.55) 0%, rgba(11,15,46,0.35) 100%), url(/assets/admin/profile_bc.webp)`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
              >
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white font-semibold text-sm shrink-0 border border-white/40">
                  {initials}
                </div>
                <div className="flex-1 min-w-0 leading-tight">
                  <div className="text-sm font-semibold truncate text-white drop-shadow">{displayName}</div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Badge variant="outline" className={`${ROLE_COLOR[role]} text-[9px] px-1.5 py-0 h-4 leading-none border`}>
                      {role}
                    </Badge>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/80 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="start" className="w-56">
              <DropdownMenuLabel className="truncate">{displayEmail}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => toast.info('Profil — bientôt disponible')}>
                <UserIcon className="w-4 h-4 me-2" /> Profil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info('Paramètres — bientôt disponible')}>
                <Settings className="w-4 h-4 me-2" /> Paramètres
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => { signOut(); }}
              >
                <LogOut className="w-4 h-4 me-2" /> Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Nav — white background, distinct from the blue header/photo card above */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto bg-white">
            {rootTop.map((item) => renderLeaf(item))}

            <div className="pt-4 pb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Produits
            </div>
            {productGroups.map((g) => renderGroup(g))}
            {renderLeaf(esimLeaf)}

            <div className="pt-4 pb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Paramètres
            </div>
            <div className="space-y-1">
              {parametresItems.map((item) => renderLeaf(item))}
            </div>
          </nav>
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className={cn(HEADER_HEIGHT, 'bg-[#1775FF] flex items-center px-4 md:px-6 gap-3 sticky top-0 z-30 shrink-0')}>
            <Button variant="ghost" size="icon" className="lg:hidden text-white hover:bg-white/10 hover:text-white" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold truncate text-white">{pageTitle}</h2>
              <p className="text-xs text-white/70 hidden sm:block">Administration · BookinGO</p>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />

              <Button variant="ghost" size="icon" className="relative text-white hover:bg-white/10 hover:text-white" onClick={() => toast.info('Notifications — bientôt disponible')}>
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FEC425]" />
              </Button>

              {/* Status glance only — the real menu lives in the sidebar profile card */}
              <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white text-xs font-semibold shrink-0 border border-white/30" title={displayEmail}>
                {initials}
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
  );
};

export default AdminLayout;