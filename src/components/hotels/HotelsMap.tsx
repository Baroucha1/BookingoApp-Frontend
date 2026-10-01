// src/components/hotels/HotelsMap.tsx
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

function priceIcon(price: number, currency: string, selected: boolean) {
    return L.divIcon({
        html: `<div style="
            background:${selected ? '#F5A623' : '#1775FF'};
            color:${selected ? '#0B2A5C' : 'white'};
            padding:4px 8px;
            border-radius:9999px;
            font-size:11px;
            font-weight:bold;
            white-space:nowrap;
            box-shadow:0 1px 4px rgba(0,0,0,0.3);
        ">${Math.round(price)} ${currency}</div>`,
        className: '',
        iconSize: [0, 0],
    });
}



export default function HotelsMap({ points, selectedHotelId, onSelectHotel }: Props) {
    if (points.length === 0) {
        return <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 text-sm">Aucune position disponible</div>;
    }

    const center: [number, number] = [
        points.reduce((s, p) => s + p.lat, 0) / points.length,
        points.reduce((s, p) => s + p.lng, 0) / points.length,
    ];

    return (
        <MapContainer center={center} zoom={13} style={{ width: '100%', height: '100%' }}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
            />
            {points.map((p) => (
                <Marker
                    key={p.hotelId}
                    position={[p.lat, p.lng]}
                    icon={priceIcon(p.price, p.currency, selectedHotelId === p.hotelId)}
                    eventHandlers={{ click: () => onSelectHotel(p.hotelId) }}
                >
                    <Popup>{p.hotelName}</Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}