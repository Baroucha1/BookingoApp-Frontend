import { Capacitor } from '@capacitor/core';
import type { NavigateFunction } from 'react-router-dom';

export const APP_ORIGIN = 'https://app.bookingo.net';

/**
 * Mark in storage and cookie that the payment was initiated from the app.
 * Using domain=.bookingo.net ensures the cookie is available if SATIM returns to bookingo.net.
 */
export function setAppSession() {
    try {
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('satim_source', 'app');
            localStorage.setItem('satim_source', 'app');
            // Shared cookie across all *.bookingo.net subdomains
            document.cookie = 'satim_source=app; domain=.bookingo.net; path=/; max-age=7200; SameSite=Lax';
        }
    } catch {
        // ignore storage errors
    }
}

/**
 * Check if the payment session was initiated from the app.
 */
export function isAppSession(): boolean {
    if (typeof window === 'undefined') return false;

    if (Capacitor.isNativePlatform()) return true;

    if (
        window.location.origin.includes('app.bookingo.net') ||
        window.location.origin.includes('localhost') ||
        window.location.origin.includes('127.0.0.1')
    ) {
        return true;
    }

    if (document.cookie.includes('satim_source=app')) return true;

    if (
        sessionStorage.getItem('satim_source') === 'app' ||
        localStorage.getItem('satim_source') === 'app'
    ) {
        return true;
    }

    const ua = navigator.userAgent || '';
    if (/wv|Capacitor|MobileApp/i.test(ua)) return true;

    return false;
}

/**
 * Redirect back to the BookinGO app instead of remaining on the bookingo.net website.
 */
export function redirectToApp(
    navigate: NavigateFunction,
    path: string = '/visa',
    options?: { replace?: boolean }
) {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    if (typeof window === 'undefined') return;

    const hostname = window.location.hostname.toLowerCase();
    const isWebsite = hostname === 'bookingo.net' || hostname === 'www.bookingo.net';

    // If we're on the public website (or if this is an app session), redirect back to the app
    if (isWebsite) {
        // Attempt native app deep link
        try {
            window.location.href = `bookingo:/${cleanPath.replace(/^\//, '')}`;
        } catch {
            // ignore
        }

        // Fallback to app domain
        setTimeout(() => {
            window.location.href = `${APP_ORIGIN}${cleanPath}`;
        }, 200);
        return;
    }

    // Inside the app (app.bookingo.net or Capacitor native)
    if (window.location.hash || window.location.href.includes('/#/')) {
        window.location.hash = `#${cleanPath}`;
    } else {
        navigate(cleanPath, { replace: options?.replace ?? false });
    }
}
