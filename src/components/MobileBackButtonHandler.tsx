import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { toast } from 'sonner';

export const MobileBackButtonHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const lastPressRef = useRef<number>(0);
  const lastBackActionRef = useRef<number>(0);

  useEffect(() => {
    const handleBack = () => {
      const now = Date.now();
      if (now - lastBackActionRef.current < 450) {
        return;
      }
      lastBackActionRef.current = now;

      // 1. If any modal / dialog / sheet / popover is currently open, close it
      const closeBtn = document.querySelector(
        '[data-state="open"] button[aria-label="Close"], [data-state="open"] .lucide-x, [role="dialog"] button[aria-label="Close"], [aria-modal="true"] button[aria-label="Close"]'
      ) as HTMLElement | null;

      if (closeBtn) {
        closeBtn.click();
        return;
      }

      // 2. If not on home / root, navigate back in router history
      const isRoot =
        location.pathname === '/' ||
        location.pathname === '/home' ||
        location.pathname === '/index.html';

      if (!isRoot) {
        navigate(-1);
        return;
      }

      // 3. If on root, prompt double press to exit app
      if (lastPressRef.current && now - lastPressRef.current < 2000) {
        const nativeApp = (window as any).AndroidNativeApp;
        const capApp = (window as any).Capacitor?.Plugins?.App;

        if (nativeApp?.exitApp) {
          nativeApp.exitApp();
        } else if (capApp?.exitApp) {
          capApp.exitApp();
        }
      } else {
        lastPressRef.current = now;
        toast.info(language === 'ar' ? 'اضغط مرة أخرى للخروج' : 'Appuyez à nouveau pour quitter', {
          duration: 2000,
        });
      }
    };

    // Expose global callback for Android MainActivity
    (window as any).__handleAppBack = handleBack;

    // Listen to Cordova / Capacitor document 'backbutton' event
    const onDocBackButton = (e: Event) => {
      e.preventDefault();
      handleBack();
    };
    document.addEventListener('backbutton', onDocBackButton);

    // Also listen to Capacitor App plugin if available
    let removeCapListener: (() => void) | undefined;
    try {
      const capApp = (window as any).Capacitor?.Plugins?.App;
      if (capApp?.addListener) {
        const handle = capApp.addListener('backButton', () => {
          handleBack();
        });
        removeCapListener = () => handle?.remove?.();
      }
    } catch (_) {}

    // iOS Edge Swipe Gesture Handler (Works in Capacitor WKWebView, Safari, and PWA)
    const isRTL = language === 'ar' || document.documentElement.dir === 'rtl';
    const EDGE_THRESHOLD = 35; // px from screen edge
    const MIN_SWIPE_DISTANCE = 50; // px minimum swipe
    const MAX_VERTICAL_DEVIATION = 60; // px
    const MAX_SWIPE_DURATION = 650; // ms

    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let isEdgeSwipeCandidate = false;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('input[type="range"]')) return;

      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchStartTime = Date.now();

      const screenWidth = window.innerWidth;
      if (!isRTL) {
        // Left edge swipe (from left edge towards right)
        isEdgeSwipeCandidate = touchStartX <= EDGE_THRESHOLD;
      } else {
        // Right edge swipe for RTL Arabic (from right edge towards left)
        isEdgeSwipeCandidate = touchStartX >= screenWidth - EDGE_THRESHOLD;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!isEdgeSwipeCandidate) return;
      isEdgeSwipeCandidate = false;

      const duration = Date.now() - touchStartTime;
      if (duration > MAX_SWIPE_DURATION) return;

      if (!e.changedTouches || e.changedTouches.length === 0) return;
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;

      // Ensure gesture is predominantly horizontal
      if (Math.abs(deltaY) > MAX_VERTICAL_DEVIATION) return;

      if (!isRTL) {
        if (deltaX >= MIN_SWIPE_DISTANCE) {
          handleBack();
        }
      } else {
        if (deltaX <= -MIN_SWIPE_DISTANCE) {
          handleBack();
        }
      }
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      (window as any).__handleAppBack = undefined;
      document.removeEventListener('backbutton', onDocBackButton);
      if (removeCapListener) removeCapListener();
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [location.pathname, navigate, language]);

  return null;
};

export default MobileBackButtonHandler;
