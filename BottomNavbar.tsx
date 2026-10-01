import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plane, FileText, Signal, Building2, User } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';
import { hapticSelection } from '@/lib/haptics';

export const isBottomNavExcluded = (pathname: string): boolean => {
  return (
    pathname.startsWith('/receipt') ||
    pathname.startsWith('/satim') ||
    pathname.startsWith('/hotels/satim/result') ||
    pathname.startsWith('/flights/booking') ||
    pathname.startsWith('/flights/book') ||
    pathname.startsWith('/flights/confirmation') ||
    pathname.startsWith('/hotels/checkout') ||
    pathname.startsWith('/esim/checkout') ||
    pathname.startsWith('/client/pay') ||
    pathname.startsWith('/apply') ||
    pathname.startsWith('/admin')
  );
};

export const BottomNavbar = () => {
  const location = useLocation();
  const { language } = useLanguage();
  const { user } = useAuth();
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Detect mobile virtual keyboard with multi-layer listeners to completely hide navbar
  useEffect(() => {
    let unmounted = false;
    const handles: { remove: () => void }[] = [];

    // 1. Capacitor Native Keyboard listeners
    if (Capacitor.isNativePlatform()) {
      try {
        Keyboard.addListener('keyboardWillShow', () => {
          if (!unmounted) setIsKeyboardOpen(true);
        }).then((h) => handles.push(h)).catch(() => {});

        Keyboard.addListener('keyboardDidShow', () => {
          if (!unmounted) setIsKeyboardOpen(true);
        }).then((h) => handles.push(h)).catch(() => {});

        Keyboard.addListener('keyboardWillHide', () => {
          if (!unmounted) setIsKeyboardOpen(false);
        }).then((h) => handles.push(h)).catch(() => {});

        Keyboard.addListener('keyboardDidHide', () => {
          if (!unmounted) setIsKeyboardOpen(false);
        }).then((h) => handles.push(h)).catch(() => {});
      } catch (e) {
        // Fallback to web listeners
      }
    }

    // 2. Window Capacitor / Ionic keyboard events
    const onKeyShow = () => { if (!unmounted) setIsKeyboardOpen(true); };
    const onKeyHide = () => { if (!unmounted) setIsKeyboardOpen(false); };

    window.addEventListener('keyboardWillShow', onKeyShow);
    window.addEventListener('keyboardDidShow', onKeyShow);
    window.addEventListener('keyboardWillHide', onKeyHide);
    window.addEventListener('keyboardDidHide', onKeyHide);
    window.addEventListener('ionKeyboardDidShow', onKeyShow);
    window.addEventListener('ionKeyboardDidHide', onKeyHide);

    // 3. VisualViewport API (detects viewport shrink in mobile Safari / Chrome Android)
    const baseHeight = typeof window !== 'undefined' ? window.innerHeight : 0;
    const handleViewportResize = () => {
      if (typeof window !== 'undefined' && window.visualViewport) {
        const vh = window.visualViewport.height;
        const isShrunk = vh < window.innerHeight - 100 || vh < baseHeight - 100;
        if (isShrunk) {
          setIsKeyboardOpen(true);
        } else {
          const active = document.activeElement as HTMLElement;
          const isInput = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
          if (!isInput) {
            setIsKeyboardOpen(false);
          }
        }
      }
    };

    if (typeof window !== 'undefined' && window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportResize);
      window.visualViewport.addEventListener('scroll', handleViewportResize);
    }

    // 4. Window Resize (Android adjustResize / resize: 'body')
    const handleWindowResize = () => {
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        const active = document.activeElement as HTMLElement;
        const isInput = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
        if (isInput) {
          setIsKeyboardOpen(true);
        }
      }
    };
    window.addEventListener('resize', handleWindowResize);

    // 5. Global capture focusin & focusout on any editable element
    const handleFocusIn = (e: FocusEvent) => {
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        const target = e.target as HTMLElement;
        if (!target) return;
        const tag = target.tagName;
        const isEditable = tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
        const inputType = (target as HTMLInputElement).type;
        if (isEditable && inputType !== 'checkbox' && inputType !== 'radio' && inputType !== 'button' && inputType !== 'submit') {
          setIsKeyboardOpen(true);
        }
      }
    };

    const handleFocusOut = () => {
      setTimeout(() => {
        if (unmounted) return;
        const active = document.activeElement as HTMLElement;
        const isEditable = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
        if (!isEditable) {
          if (typeof window !== 'undefined' && window.visualViewport) {
            if (window.visualViewport.height >= window.innerHeight - 100) {
              setIsKeyboardOpen(false);
            }
          } else {
            setIsKeyboardOpen(false);
          }
        }
      }, 150);
    };

    document.addEventListener('focusin', handleFocusIn, true);
    document.addEventListener('focusout', handleFocusOut, true);

    return () => {
      unmounted = true;
      handles.forEach((h) => h.remove?.());
      window.removeEventListener('keyboardWillShow', onKeyShow);
      window.removeEventListener('keyboardDidShow', onKeyShow);
      window.removeEventListener('keyboardWillHide', onKeyHide);
      window.removeEventListener('keyboardDidHide', onKeyHide);
      window.removeEventListener('ionKeyboardDidShow', onKeyShow);
      window.removeEventListener('ionKeyboardDidHide', onKeyHide);
      window.removeEventListener('resize', handleWindowResize);
      if (typeof window !== 'undefined' && window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportResize);
        window.visualViewport.removeEventListener('scroll', handleViewportResize);
      }
      document.removeEventListener('focusin', handleFocusIn, true);
      document.removeEventListener('focusout', handleFocusOut, true);
    };
  }, []);

  // Sync body class for CSS-level hiding
  useEffect(() => {
    if (isKeyboardOpen) {
      document.body.classList.add('keyboard-visible');
    } else {
      document.body.classList.remove('keyboard-visible');
    }
    return () => {
      document.body.classList.remove('keyboard-visible');
    };
  }, [isKeyboardOpen]);

  // Detect when full-screen dialogs, sheets, or drawers are open to prevent clashing
  useEffect(() => {
    const checkModal = () => {
      const isScrollLocked = document.body.hasAttribute('data-scroll-locked');
      const hasOpenDialog = !!document.querySelector(
        '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"], [data-radix-portal] [role="dialog"]'
      );
      setIsModalOpen(isScrollLocked || hasOpenDialog);
    };

    checkModal();

    const observer = new MutationObserver(checkModal);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-scroll-locked', 'class', 'style'],
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  const labels = {
    flights: language === 'ar' ? 'رحلات' : language === 'fr' ? 'Vols' : 'Flights',
    hotels: language === 'ar' ? 'فنادق' : language === 'fr' ? 'Hôtels' : 'Hotels',
    visas: language === 'ar' ? 'تأشيرة' : language === 'fr' ? 'Visas' : 'Visas',
    esim: language === 'ar' ? 'ايسيم' : language === 'fr' ? 'e-SIM' : 'e-SIM',
    profile: language === 'ar' ? 'حسابي' : language === 'fr' ? 'Compte' : 'Account',
  };

  const navItems = [
    { to: '/flights', label: labels.flights, icon: Plane, isProfile: false },
    { to: '/hotels', label: labels.hotels, icon: Building2, isProfile: false },
    { to: '/esim', label: labels.esim, icon: Signal, isProfile: false },
    { to: '/visa', label: labels.visas, icon: FileText, isProfile: false },
    { to: user ? '/client/profile' : '/login', label: labels.profile, icon: User, isProfile: true },
  ];

  const userPhoto = (user as any)?.avatar || (user as any)?.photo || (user as any)?.avatarUrl || (user as any)?.profile?.avatar;
  const initials = (user?.name || user?.email || 'U')
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s: string) => s[0]?.toUpperCase())
    .join('');

  // COMPLETELY remove from DOM when virtual keyboard is open, modal is open, or on excluded routes
  if (isBottomNavExcluded(location.pathname) || isKeyboardOpen || isModalOpen) {
    return null;
  }

  return (
    <div
      data-bottom-navbar="true"
      className="bottom-navbar-container md:hidden print:hidden fixed left-4 right-4 z-40 max-w-md mx-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-gray-800 shadow-[0_10px_30px_rgba(0,0,0,0.12)] rounded-3xl p-1.5 flex items-center justify-around transition-all duration-200 ease-in-out"
      style={{
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)',
      }}
    >
      {navItems.map((item) => {
        const Icon = item.icon;

        const isFlightActive =
          item.to === '/flights' &&
          (location.pathname === '/' ||
            location.pathname === '/home' ||
            location.pathname === '/index.html' ||
            location.pathname.startsWith('/flights'));

        const isHotelActive =
          item.to === '/hotels' && location.pathname.startsWith('/hotels');

        const isVisaActive =
          item.to === '/visa' &&
          (location.pathname.startsWith('/visa') ||
            location.pathname.startsWith('/apply') ||
            location.pathname.startsWith('/destinations') ||
            location.pathname.startsWith('/visa-free'));

        const isEsimActive =
          item.to === '/esim' && location.pathname.startsWith('/esim');

        const isProfileActive =
          item.isProfile &&
          (location.pathname.startsWith('/client') ||
            location.pathname === '/login' ||
            location.pathname === '/forgot-password' ||
            location.pathname === '/verify-reset-otp' ||
            location.pathname === '/reset-password');

        const isActive =
          location.pathname === item.to ||
          isFlightActive ||
          isHotelActive ||
          isVisaActive ||
          isEsimActive ||
          isProfileActive;

        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => hapticSelection()}
            className={cn(
              'flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-150 active:scale-90 cursor-pointer select-none relative',
              isActive
                ? 'text-[#0865FE] font-bold scale-105'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium'
            )}
          >
            {item.isProfile && user ? (
              <div className={cn("p-0.5 rounded-full transition-all", isActive && "ring-2 ring-[#0865FE] ring-offset-1")}>
                <Avatar className="w-6 h-6 border border-slate-200 dark:border-slate-700 shadow-xs">
                  {userPhoto && <AvatarImage src={userPhoto} alt={user.name || 'User'} className="object-cover" />}
                  <AvatarFallback className="bg-gradient-to-tr from-[#0865FE] to-[#3B2F7E] text-white text-[10px] font-bold">
                    {initials || 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>
            ) : (
              <div className={cn('p-1 rounded-lg transition-colors', isActive && 'bg-blue-50 dark:bg-blue-950/60 text-[#0865FE]')}>
                <Icon className="w-5 h-5 stroke-[2]" />
              </div>
            )}
            <span className="text-[10px] mt-0.5 tracking-tight leading-tight">{item.label}</span>
            {isActive && (
              <span className="w-1 h-1 rounded-full bg-[#0865FE] mt-0.5 animate-in fade-in zoom-in" />
            )}
          </Link>
        );
      })}
    </div>
  );
};

export default BottomNavbar;
