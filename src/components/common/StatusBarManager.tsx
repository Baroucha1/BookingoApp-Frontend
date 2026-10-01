import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

export default function StatusBarManager() {
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const path = location.pathname;

    // Dark hero pages where status bar text should be light/white
    const isDarkHeaderPage =
      path === '/' ||
      path === '/home' ||
      path === '/flights' ||
      path.startsWith('/hotels') ||
      path === '/login';

    try {
      if (isDarkHeaderPage) {
        StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
      } else {
        StatusBar.setStyle({ style: Style.Light }).catch(() => {});
      }
    } catch {
      // Ignore if not supported
    }
  }, [location.pathname]);

  return null;
}
