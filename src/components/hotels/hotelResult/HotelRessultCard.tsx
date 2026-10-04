import { Star, MapPin, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { hotelHasAmenity } from '@/lib/hotelAmenities';
import type { SearchHotelResult } from '@/service/hotels/hotels.service';
import type { TravellandaHotelDetails } from '@/service/admin/hotel/staticdataTravellenda.ts';


export interface HotelRow {
    hotel: SearchHotelResult;
    details?: TravellandaHotelDetails;
    cheapestTotal: number;
    perNight: number;
    star: number;
}

interface HotelResultCardProps extends Pick<HotelRow, 'hotel' | 'details' | 'perNight' | 'star'> {
    onDetails: () => void;
}


export default function HotelResultCard({ hotel, details, perNight, star, onDetails }: HotelResultCardProps) {
    const currency = hotel.options[0]?.currency ?? '';
    const image = details?.images?.[0];

    return (
        <article className="bg-white rounded-xl border border-slate-100 overflow-hidden flex flex-col sm:flex-row hover:shadow-md transition-shadow">
            <div className="relative w-full h-48 sm:h-auto sm:min-h-[160px] sm:w-48 md:w-56 shrink-0 bg-slate-100">
                {image ? (
                    <img src={image} alt={hotel.hotelName} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-300 text-xs">Pas d'image</div>
                )}
            </div>

            <div className="flex-1 p-4 min-w-0">
                {star > 0 && (
                    <div className="flex items-center gap-0.5 mb-1">
                        {Array.from({ length: star }, (_, i) => (
                            <Star key={i} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                        ))}
                    </div>
                )}
                <h3 className="font-bold text-blue-900 line-clamp-2">{hotel.hotelName}</h3>
                {details?.address && (
                    <div className="text-xs text-blue-900 flex items-start gap-1 mt-1">
                        <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{details.address}</span>
                    </div>
                )}
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                    {hotelHasAmenity(details, 'Wi-Fi gratuit') && (
                        <span className="flex items-center gap-1"><Wifi className="w-3.5 h-3.5" /> Wi-Fi gratuit</span>
                    )}
                </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 p-4 sm:w-44 shrink-0 sm:text-right border-t sm:border-t-0 sm:border-l border-slate-100">
                <div>
                    <div className="text-[11px] text-slate-400">À partir de</div>
                    <div className="text-xl font-bold text-slate-800 whitespace-nowrap">{Math.round(perNight)} {currency}</div>
                    <div className="text-[11px] text-slate-400">par nuit</div>
                </div>
                <Button
                    className="bg-[#F5A623] hover:bg-[#F5A623]/90 text-[#0B2A5C] font-bold text-xs sm:w-full"
                    onClick={onDetails}
                >
                    Voir les détails
                </Button>
            </div>
        </article>
    );
}