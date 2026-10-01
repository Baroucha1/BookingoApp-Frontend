import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLanguage } from '@/i18n/LanguageContext';

export interface MapHotelPoint {
    hotelId: string;
    hotelName: string;
    lat: number;
    lng: number;
    price: number;
    currency: string;
}

interface Props {
    points: MapHotelPoint[];
    selectedHotelId?: string | null;
    onSelectHotel: (hotelId: string) => void;
}

export default function HotelsMap({ points, selectedHotelId, onSelectHotel }: Props) {
    const { t } = useLanguage();
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markersRef = useRef<Record<string, L.Marker>>({});

    // 1. Initialize Map ONCE on container mount
    useEffect(() => {
        if (!mapContainerRef.current) return;

        // Reset if previously had leaflet id to prevent 'Map container is already initialized' error
        if ((mapContainerRef.current as any)._leaflet_id) {
            (mapContainerRef.current as any)._leaflet_id = undefined;
            mapContainerRef.current.innerHTML = '';
        }

        const defaultCenter: [number, number] = points.length > 0
            ? [
                points.reduce((s, p) => s + p.lat, 0) / points.length,
                points.reduce((s, p) => s + p.lng, 0) / points.length,
            ]
            : [36.75, 3.05];

        const map = L.map(mapContainerRef.current, {
            center: defaultCenter,
            zoom: points.length > 0 ? 13 : 11,
            zoomControl: false,
        });

        // Zoom control on bottom-right to keep top-bar and bottom card clean
        L.control.zoom({ position: 'bottomright' }).addTo(map);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19,
        }).addTo(map);

        mapInstanceRef.current = map;

        // Multiple invalidateSize calls to ensure full rendering across animation timings
        const t1 = setTimeout(() => map.invalidateSize(), 100);
        const t2 = setTimeout(() => map.invalidateSize(), 300);
        const t3 = setTimeout(() => map.invalidateSize(), 600);

        const handleResize = () => {
            map.invalidateSize();
        };
        window.addEventListener('resize', handleResize);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
            window.removeEventListener('resize', handleResize);
            map.remove();
            mapInstanceRef.current = null;
        };
    }, []);

    // 2. Update Markers & Bounds whenever points change
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        // Clear existing markers
        Object.values(markersRef.current).forEach((m) => m.remove());
        markersRef.current = {};

        if (points.length === 0) return;

        const bounds = L.latLngBounds([]);

        points.forEach((p) => {
            const isSelected = selectedHotelId === p.hotelId;
            const icon = L.divIcon({
                html: `<div style="
                    background:${isSelected ? '#FFAA01' : '#0454E8'};
                    color:${isSelected ? '#002161' : 'white'};
                    padding:5px 9px;
                    border-radius:9999px;
                    font-size:11px;
                    font-weight:800;
                    white-space:nowrap;
                    box-shadow:0 3px 12px rgba(0,0,0,0.35);
                    border:2px solid white;
                    transform:${isSelected ? 'scale(1.18)' : 'scale(1)'};
                    transition:transform 0.15s ease, background 0.15s ease;
                    cursor:pointer;
                ">${Math.round(p.price)} ${p.currency}</div>`,
                className: '',
                iconSize: [0, 0],
            });

            const marker = L.marker([p.lat, p.lng], { icon, zIndexOffset: isSelected ? 1000 : 0 })
                .addTo(map)
                .on('click', () => onSelectHotel(p.hotelId));

            markersRef.current[p.hotelId] = marker;
            bounds.extend([p.lat, p.lng]);
        });

        // Fit bounds to show all available hotels
        if (points.length > 0 && !selectedHotelId && bounds.isValid()) {
            map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
        }
    }, [points]);

    // 3. Update active marker appearance & panTo when selectedHotelId changes
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        points.forEach((p) => {
            const marker = markersRef.current[p.hotelId];
            if (!marker) return;

            const isSelected = selectedHotelId === p.hotelId;
            const icon = L.divIcon({
                html: `<div style="
                    background:${isSelected ? '#FFAA01' : '#0454E8'};
                    color:${isSelected ? '#002161' : 'white'};
                    padding:5px 9px;
                    border-radius:9999px;
                    font-size:11px;
                    font-weight:800;
                    white-space:nowrap;
                    box-shadow:0 3px 12px rgba(0,0,0,0.35);
                    border:2px solid white;
                    transform:${isSelected ? 'scale(1.18)' : 'scale(1)'};
                    transition:transform 0.15s ease, background 0.15s ease;
                    cursor:pointer;
                ">${Math.round(p.price)} ${p.currency}</div>`,
                className: '',
                iconSize: [0, 0],
            });

            marker.setIcon(icon);
            marker.setZIndexOffset(isSelected ? 1000 : 0);

            if (isSelected) {
                map.panTo([p.lat, p.lng], { animate: true });
            }
        });
    }, [selectedHotelId, points]);

    return (
        <div className="relative w-full h-full min-h-[350px]">
            <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
            {points.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 backdrop-blur-xs z-10 text-slate-500 text-xs font-medium">
                    {t('hotelMapLoadingPositions')}
                </div>
            )}
        </div>
    );
}