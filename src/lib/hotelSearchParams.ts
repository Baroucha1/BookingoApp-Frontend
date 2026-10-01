// src/lib/hotelSearchParams.ts
import type { RoomInput, HotelSearchParams } from '@/components/hotels/HotelsSearchForm.tsx';

export function encodeHotelSearchParams(params: HotelSearchParams): URLSearchParams {
    const qs = new URLSearchParams();
    qs.set('countryCode', params.countryCode);
    qs.set('cityId', String(params.cityId));
    if (params.hotelIds.length > 0) qs.set('hotelIds', params.hotelIds.join(','));
    qs.set('cityName', params.cityName);
    qs.set('checkInDate', params.checkInDate);
    qs.set('checkOutDate', params.checkOutDate);
    qs.set('rooms', JSON.stringify(params.rooms));
    qs.set('nationality', params.nationality);
    qs.set('availableOnly', params.availableOnly ? '1' : '0');
    return qs;
}

export function decodeHotelSearchParams(qs: URLSearchParams): HotelSearchParams | null {
    const countryCode = qs.get('countryCode');
    const cityId = qs.get('cityId');
    const checkInDate = qs.get('checkInDate');
    const checkOutDate = qs.get('checkOutDate');
    const roomsRaw = qs.get('rooms');

    if (!countryCode || !cityId || !checkInDate || !checkOutDate || !roomsRaw) return null;

    let rooms: RoomInput[];
    try {
        rooms = JSON.parse(roomsRaw);
    } catch {
        return null;
    }

    return {
        countryCode,
        cityId: Number(cityId),
        hotelIds: qs.get('hotelIds')?.split(',').map(Number).filter(Boolean) ?? [],
        cityName: qs.get('cityName') ?? '',
        checkInDate,
        checkOutDate,
        rooms,
        nationality: qs.get('nationality') ?? 'DZ',
        availableOnly: qs.get('availableOnly') !== '0',
    };
}

// src/lib/hotelSearchParams.ts — add this alongside existing exports
export function formatDateRangeFr(checkIn: string, checkOut: string): string {
    const opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' };
    const inD = new Date(checkIn).toLocaleDateString('fr-FR', opts);
    const outD = new Date(checkOut).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    return `${inD} - ${outD}`;
}

export function nightsBetween(checkIn: string, checkOut: string): number {
    return Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000));
}