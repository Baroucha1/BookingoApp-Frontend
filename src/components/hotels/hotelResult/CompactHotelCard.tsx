import { Star } from 'lucide-react';
import type { SearchHotelResult } from '@/service/hotels/hotels.service';
import type { TravellandaHotelDetails } from '@/service/admin/hotel/staticdataTravellenda.ts';

interface CompactHotelCardProps {
    hotel: SearchHotelResult;
    details?: TravellandaHotelDetails;
    perNight: number;
    star: number;
    selected: boolean;
    onSelect: () => void;
    onDetails: () => void;
}

export default function CompactHotelCard({
                                             hotel, details, perNight, star, selected, onSelect, onDetails,
                                         }: CompactHotelCardProps) {
    const image = details?.images?.[0];

    return (
        <div
            onClick={onSelect}
            className={`flex gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                selected ? 'bg-[#DFECFF]' : 'hover:bg-slate-50'
            }`}
        >
            <div className="w-20 h-16 shrink-0 rounded-md overflow-hidden bg-slate-100">
                {image && (
                    <img src={image} alt={hotel.hotelName} loading="lazy" className="w-full h-full object-cover" />
                )}
            </div>
            <div className="flex-1 min-w-0">
                {star > 0 && (
                    <div className="flex gap-0.5">
                        {Array.from({ length: star }, (_, i) => (
                            <Star key={i} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                        ))}
                    </div>
                )}
                <div className="text-sm font-semibold text-slate-800 line-clamp-1">{hotel.hotelName}</div>
                <div className="text-xs text-slate-400 line-clamp-1">{details?.address}</div>
                <div className="flex items-center justify-between mt-1">
                    <span className="text-sm font-bold text-[#1775FF]">
                        {Math.round(perNight)} {hotel.options[0]?.currency}
                    </span>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDetails(); }}
                        className="text-xs text-[#1775FF] font-semibold hover:underline"
                    >
                        Détails
                    </button>
                </div>
            </div>
        </div>
    );
}