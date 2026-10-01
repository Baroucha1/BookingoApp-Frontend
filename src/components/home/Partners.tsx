import { useEffect, useRef, useState } from 'react';
import { partners } from '@/data/data.ts';
import { useLanguage } from '@/i18n/LanguageContext';

const titles = {
    fr: "Nos partenaires",
    en: "Our partners",
    ar: "شركاؤنا",
};

export const Partners = () => {
    const { language } = useLanguage();
    const trackRef = useRef<HTMLDivElement>(null);
    const [isPaused, setIsPaused] = useState(false);

    // Drag state
    const isDragging = useRef(false);
    const dragStartX = useRef(0);
    const scrollStartLeft = useRef(0);

    // Auto-scroll loop
    useEffect(() => {
        const track = trackRef.current;
        if (!track) return;

        let raf: number;
        const speed = 0.6;

        const step = () => {
            if (!isPaused && track) {
                track.scrollLeft += speed;
                if (track.scrollLeft >= track.scrollWidth / 2) {
                    track.scrollLeft = 0;
                }
            }
            raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);

        return () => cancelAnimationFrame(raf);
    }, [isPaused]);

    const handleMouseDown = (e: React.MouseEvent) => {
        const track = trackRef.current;
        if (!track) return;
        isDragging.current = true;
        setIsPaused(true);
        dragStartX.current = e.pageX;
        scrollStartLeft.current = track.scrollLeft;
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging.current || !trackRef.current) return;
        e.preventDefault();
        const delta = e.pageX - dragStartX.current;
        trackRef.current.scrollLeft = scrollStartLeft.current - delta;
    };

    const stopDragging = () => {
        isDragging.current = false;
        setIsPaused(false);
    };

    const looped = [...partners, ...partners];

    return (
        <section className="my-4 py-4 bg-transparent">
            <div className="max-w-6xl mx-auto px-5 mb-2">
                <h2 className="text-sm sm:text-base font-semibold text-sky-900/70 uppercase tracking-widest text-center sm:text-left rtl:sm:text-right">
                    {titles[language] || titles.fr}
                </h2>
            </div>

            <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 w-12 md:w-28 z-10 bg-gradient-to-r from-transparent to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 right-0 w-12 md:w-28 z-10 bg-gradient-to-l from-transparent to-transparent" />

                <div
                    ref={trackRef}
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => { setIsPaused(false); stopDragging(); }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={stopDragging}
                    onTouchStart={() => setIsPaused(true)}
                    onTouchEnd={() => setIsPaused(false)}
                    className="flex overflow-x-auto scroll-smooth cursor-grab active:cursor-grabbing select-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-1"
                >
                    {looped.map((p, i) => (
                        <div key={`${p.name}-${i}`} className="flex items-center justify-center px-4 sm:px-6 shrink-0">
                            <div className="h-[60px] sm:h-[80px] w-[110px] sm:w-[140px] flex items-center justify-center">
                                <img
                                    src={p.logo}
                                    alt={p.name}
                                    className="max-h-full max-w-full object-contain transition-all pointer-events-none opacity-90 hover:opacity-100"
                                    draggable={false}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Partners;