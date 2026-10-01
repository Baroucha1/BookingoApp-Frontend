import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

const RouteTopLoader = () => {
    const { pathname } = useLocation();
    const [width, setWidth]   = useState(0);
    const timer = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        // new route → flash the bar
        setWidth(0);
        setTimeout(() => setWidth(40), 10);
        setTimeout(() => setWidth(70), 80);
        const done = setTimeout(() => {
            setWidth(100);
            setTimeout(() => setWidth(0), 300);
        }, 200);
        return () => {
            clearTimeout(done);
            if (timer.current) clearInterval(timer.current);
        };
    }, [pathname]);

    if (width === 0) return null;
    return (
        <div style={{
            position:     'fixed',
            top:          0,
            left:         0,
            height:       3,
            width:        `${width}%`,
            background:   '#29d',
            zIndex:       9999,
            transition:   width === 100 ? 'width .15s ease, opacity .3s .1s ease' : 'width .2s ease',
            opacity:      width === 100 ? 0 : 1,
            borderRadius: '0 2px 2px 0',
            boxShadow:    '0 0 8px rgba(34,153,221,.6)',
        }} />
    );
};

export default RouteTopLoader;