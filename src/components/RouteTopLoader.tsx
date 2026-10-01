import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import AppLoading from '@/components/common/AppLoading';

const RouteTopLoader = () => {
    const { pathname } = useLocation();
    const [visible, setVisible] = useState(false);
    const [fading, setFading] = useState(false);
    const prevPathname = useRef<string>(pathname);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const fadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (prevPathname.current !== pathname) {
            prevPathname.current = pathname;
            setVisible(true);
            setFading(false);

            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);

            // Display briefly (300ms) then smooth fade out (160ms)
            fadeTimeoutRef.current = setTimeout(() => {
                setFading(true);
                timeoutRef.current = setTimeout(() => {
                    setVisible(false);
                    setFading(false);
                }, 160);
            }, 300);
        }

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
        };
    }, [pathname]);

    if (!visible) return null;

    return (
        <div
            className={`fixed inset-0 z-[99999] pointer-events-none transition-opacity duration-160 ease-out select-none ${
                fading ? 'opacity-0' : 'opacity-100'
            }`}
        >
            <AppLoading message="Chargement..." fullScreen={false} className="h-full w-full bg-white/40 dark:bg-[#0B0F2E]/60 backdrop-blur-md" />
        </div>
    );
};

export default RouteTopLoader;