import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { toast } from 'sonner';
import { App } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';

export const MobileBackButtonHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();

  const locationRef = useRef(location.pathname);
  locationRef.current = location.pathname;

  const languageRef = useRef(language);
  languageRef.current = language;

  const lastPressRef = useRef<number>(0);
  const lastBackActionRef = useRef<number>(0);

  useEffect(() => {
    const handleBack = () => {
      const now = Date.now();
      if (now - lastBackActionRef.current < 350) {
        return;
      }
      lastBackActionRef.current = now;

      // 1. If any modal / dialog / sheet / popover is currently open, close it
      const closeBtn = document.querySelector(
        '[data-state="open"] button[aria-label="Close"], ' +
        '[data-state="open"] button[aria-label="Fermer"], ' +
        '[data-state="open"] button[aria-label="Retour"], ' +
        '[role="dialog"] button[aria-label="Close"], ' +
        '[role="dialog"] button[aria-label="Fermer"], ' +
        '[role="dialog"] button[aria-label="Retour"], ' +
        '[aria-modal="true"] button[aria-label="Close"], ' +
        '[aria-modal="true"] button[aria-label="Fermer"], ' +
        '[aria-modal="true"] button[aria-label="Retour"], ' +
        '.fixed.inset-0 button[aria-label="Fermer"], ' +
        '.fixed.inset-0 button[aria-label="Retour"]'
      ) as HTMLElement | null;

      if (closeBtn) {
        closeBtn.click();
        return;
      }

      const currentPath = locationRef.current;
      const isRoot =
        currentPath === '/' ||
        currentPath === '/home' ||
        currentPath === '/index.html';

      // 2. If not on home / root, navigate back in router history
      if (!isRoot) {
        if (window.history.state && window.history.state.idx > 0) {
          navigate(-1);
        } else {
          // If no history stack exists, go to home
          navigate('/');
        }
        return;
      }

      // 3. If on root, prompt double press to exit app
      if (lastPressRef.current && now - lastPressRef.current < 2000) {
        App.exitApp();
      } else {
        lastPressRef.current = now;
        const lang = languageRef.current;
        toast.info(lang === 'ar' ? 'اضغط مرة أخرى للخروج' : 'Appuyez à nouveau pour quitter', {
          duration: 2000,
        });
      }
    };

    // Expose global callback for Android MainActivity or webview
    (window as any).__handleAppBack = handleBack;

    // Listen to Capacitor App plugin backButton event (native Android back button & gestures)
    let backListener: PluginListenerHandle | undefined;
    App.addListener('backButton', () => {
      handleBack();
    }).then((handle) => {
      backListener = handle;
    }).catch(() => {});

    // Listen to Cordova / Capacitor document 'backbutton' event as fallback
    const onDocBackButton = (e: Event) => {
      e.preventDefault();
      handleBack();
    };
    document.addEventListener('backbutton', onDocBackButton);

    // iOS Edge Swipe Gesture Handler
    const isRTL = languageRef.current === 'ar' || document.documentElement.dir === 'rtl';
    const EDGE_THRESHOLD = 35;
    const MIN_SWIPE_DISTANCE = 50;
    const MAX_VERTICAL_DEVIATION = 60;
    const MAX_SWIPE_DURATION = 650;

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
        isEdgeSwipeCandidate = touchStartX <= EDGE_THRESHOLD;
      } else {
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
      if (backListener) {
        backListener.remove();
      }
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [navigate]);

  return null;
};

export default MobileBackButtonHandler;
