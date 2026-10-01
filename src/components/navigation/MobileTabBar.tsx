import { useLocation, useNavigate } from 'react-router-dom';
import { Plane, Building2, SimCard, FileText, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/i18n/LanguageContext';
import { hapticSelection } from '@/lib/haptics';
import { cn } from '@/lib/utils';

export default function MobileTabBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  const p = location.pathname;

  // Hide in deep checkout, payment, booking, or admin pages
  const isHidden =
    p.startsWith('/flights/booking') ||
    p.startsWith('/flights/book') ||
    p.startsWith('/flights/confirmation') ||
    p.startsWith('/apply') ||
    p.startsWith('/esim/checkout') ||
    p.startsWith('/client/pay') ||
    p.startsWith('/satim') ||
    p.startsWith('/admin') ||
    p.startsWith('/receipt');

  if (isHidden) return null;

  const tabs = [
    {
      id: 'flights',
      label: t('flights') || 'Vols',
      path: '/flights',
      icon: Plane,
      isActive: p === '/' || p.startsWith('/flights'),
    },
    {
      id: 'hotels',
      label: t('hotels') || 'Hôtels',
      path: '/hotels',
      icon: Building2,
      isActive: p.startsWith('/hotels'),
    },
    {
      id: 'esim',
      label: 'eSIM',
      path: '/esim',
      icon: SimCard,
      isActive: p.startsWith('/esim'),
    },
    {
      id: 'visa',
      label: t('visas') || 'Visas',
      path: '/visa',
      icon: FileText,
      isActive: p.startsWith('/visa'),
    },
    {
      id: 'profile',
      label: user ? (t('profile') || 'Compte') : (t('signIn') || 'Connexion'),
      path: user ? '/client/profile' : '/login',
      icon: User,
      isActive: p.startsWith('/client') || p === '/login',
    },
  ];

  const handleTabClick = (path: string, isActive: boolean) => {
    hapticSelection();
    if (!isActive) {
      navigate(path);
    }
  };

  return (
    <nav
      aria-label="Navigation principale mobile"
      className="lg:hidden fixed bottom-0 inset-x-0 z-[50] bg-white/92 backdrop-blur-xl border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(8,101,254,0.06)] transition-all duration-200"
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.25rem)',
      }}
    >
      <div className="grid grid-cols-5 h-[54px] max-w-md mx-auto items-center px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.isActive;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabClick(tab.path, active)}
              className={cn(
                'flex flex-col items-center justify-center py-1 rounded-xl transition-all duration-150 active:scale-90 cursor-pointer select-none relative',
                active ? 'text-[#0865FE]' : 'text-slate-500 hover:text-slate-800'
              )}
            >
              <div
                className={cn(
                  'relative flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200',
                  active ? 'bg-[#0865FE]/10 -translate-y-0.5' : ''
                )}
              >
                <Icon
                  className={cn(
                    'w-[19px] h-[19px] transition-transform duration-200',
                    active ? 'stroke-[2.35] scale-105' : 'stroke-[1.8]'
                  )}
                />
              </div>
              <span
                className={cn(
                  'text-[10px] tracking-tight leading-tight transition-all duration-200',
                  active ? 'font-bold text-[#0865FE]' : 'font-medium text-slate-500'
                )}
              >
                {tab.label}
              </span>

              {/* Active pill dot indicator */}
              {active && (
                <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-[#0865FE] animate-in fade-in zoom-in-50 duration-200" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
