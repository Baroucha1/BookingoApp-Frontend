import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FilePlus2, FileText, CreditCard, Tag, User as UserIcon,
  Plane, Menu, X, ChevronUp, LogOut, Settings, ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { currentAgency, findGroup } from '@/lib/mockAdminData';

const navItems = [
  { to: '/agency', icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/agency/new-application', icon: FilePlus2, label: 'Nouvelle demande' },
  { to: '/agency/applications', icon: FileText, label: 'Mes demandes' },
  { to: '/agency/payments', icon: CreditCard, label: 'Paiements' },
  { to: '/agency/pricing', icon: Tag, label: 'Tarifs' },
  { to: '/agency/profile', icon: UserIcon, label: 'Profil' },
];

const PAGE_TITLES: Record<string, string> = {
  '/agency': 'Tableau de bord',
  '/agency/new-application': 'Nouvelle demande de visa',
  '/agency/applications': 'Mes demandes',
  '/agency/payments': 'Paiements',
  '/agency/pricing': 'Tarifs',
  '/agency/profile': 'Profil',
};

const initialsOf = (s: string) =>
  s.split(/\s+/).map(w => w[0]?.toUpperCase()).filter(Boolean).slice(0, 2).join('') || 'A';

const AgencyLayout = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const group = findGroup(currentAgency.groupId);
  const initials = initialsOf(currentAgency.companyName);
  const pageTitle = PAGE_TITLES[location.pathname] ?? 'Agence';

  return (
    <div className="agency-theme min-h-screen flex bg-background text-foreground">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 start-0 z-50 w-64 bg-sidebar text-sidebar-foreground border-e border-sidebar-border flex flex-col transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full'
        }`}
      >
        {/* Branding */}
        <div className="p-5 border-b border-sidebar-border flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-accent flex items-center justify-center shadow-elegant">
            <Plane className="w-5 h-5 text-sidebar-primary-foreground -rotate-45" />
          </div>
          <div className="leading-tight">
            <div className="font-bold text-base tracking-tight text-sidebar-foreground">
              VIS<span className="text-sidebar-primary">AGO</span>
            </div>
            <div className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60">Agency Portal</div>
          </div>
        </div>

        {/* Agency badge */}
        <div className="px-4 py-3 border-b border-sidebar-border bg-sidebar-accent/30">
          <div className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60">Agence</div>
          <div className="text-sm font-semibold truncate text-sidebar-foreground">{currentAgency.companyName}</div>
          <div className="flex items-center gap-1.5 mt-1.5">
            {group && (
              <Badge className="bg-sidebar-primary text-sidebar-primary-foreground border-0 text-[9px] px-1.5 py-0 h-4">
                {group.name}
              </Badge>
            )}
            {currentAgency.isVerified && (
              <Badge variant="outline" className="border-sidebar-primary text-sidebar-primary text-[9px] px-1.5 py-0 h-4 gap-0.5">
                <ShieldCheck className="w-2.5 h-2.5" /> Vérifiée
              </Badge>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item, i) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                style={{ animationDelay: `${i * 25}ms` }}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium animate-fade-in-up transition-all duration-200 ${
                  active
                    ? 'bg-gradient-accent text-sidebar-primary-foreground shadow-elegant'
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }`}
              >
                <item.icon className={`w-4 h-4 transition-transform ${active ? '' : 'group-hover:scale-110'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Profile section */}
        <div className="p-3 border-t border-sidebar-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent transition-colors text-start">
                <div className="w-9 h-9 rounded-full bg-gradient-accent flex items-center justify-center text-sidebar-primary-foreground font-semibold text-sm shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0 leading-tight">
                  <div className="text-sm font-medium truncate text-sidebar-foreground">{currentAgency.email}</div>
                  <div className="text-[10px] text-sidebar-foreground/60 mt-0.5">AGENCY</div>
                </div>
                <ChevronUp className="w-4 h-4 text-sidebar-foreground/60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="end" className="w-56">
              <DropdownMenuLabel className="truncate">{currentAgency.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/agency/profile"><UserIcon className="w-4 h-4 me-2" /> Profil</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info('Paramètres — bientôt disponible')}>
                <Settings className="w-4 h-4 me-2" /> Paramètres
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => toast.success('Déconnexion (mock)')}
              >
                <LogOut className="w-4 h-4 me-2" /> Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-card/80 backdrop-blur border-b flex items-center px-4 md:px-6 gap-3 sticky top-0 z-30">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold truncate">{pageTitle}</h2>
            <p className="text-xs text-muted-foreground hidden sm:block">{currentAgency.companyName} · Portail B2B</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="hidden sm:flex items-center gap-2 ps-3 border-s">
              <div className="text-end leading-tight">
                <div className="text-xs font-medium">{currentAgency.email}</div>
                <div className="text-[10px] text-muted-foreground">{group?.name ?? 'Standard'}</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-accent flex items-center justify-center text-primary-foreground text-xs font-semibold">
                {initials}
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-auto animate-fade-in-up">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AgencyLayout;
