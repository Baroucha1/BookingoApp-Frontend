// src/lib/hotelSearchParams.ts
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface RoomInput {
    numAdults: number;
    childAges: number[];
}

export interface HotelSearchParams {
    countryCode: string;
    cityId: number;
    hotelIds: number[];
    checkInDate: string;
    checkOutDate: string;
    rooms: RoomInput[];
    nationality: string;
    availableOnly: boolean;
}

export function encodeHotelSearchParams(params: HotelSearchParams): URLSearchParams {
    const sp = new URLSearchParams();
    if (params.countryCode) sp.set('countryCode', params.countryCode);
    if (params.cityId) sp.set('cityId', String(params.cityId));
    if (params.hotelIds && params.hotelIds.length > 0) {
        sp.set('hotelIds', params.hotelIds.join(','));
    }
    if (params.checkInDate) sp.set('checkInDate', params.checkInDate);
    if (params.checkOutDate) sp.set('checkOutDate', params.checkOutDate);
    if (params.nationality) sp.set('nationality', params.nationality);
    sp.set('availableOnly', params.availableOnly ? 'true' : 'false');
    if (params.rooms && params.rooms.length > 0) {
        sp.set('rooms', JSON.stringify(params.rooms));
    }
    return sp;
}

export function decodeHotelSearchParams(sp: URLSearchParams): HotelSearchParams | null {
    const cityIdStr = sp.get('cityId');
    const checkInDate = sp.get('checkInDate');
    const checkOutDate = sp.get('checkOutDate');
    if (!cityIdStr || !checkInDate || !checkOutDate) {
        return null;
    }
    const cityId = Number(cityIdStr);
    if (isNaN(cityId)) return null;

    const countryCode = sp.get('countryCode') ?? '';
    const hotelIdsStr = sp.get('hotelIds');
    const hotelIds = hotelIdsStr
        ? hotelIdsStr.split(',').map(Number).filter((n) => !isNaN(n))
        : [];
    const nationality = sp.get('nationality') ?? 'DZ';
    const availableOnly = sp.get('availableOnly') !== 'false';

    let rooms: RoomInput[] = [{ numAdults: 2, childAges: [] }];
    const roomsStr = sp.get('rooms');
    if (roomsStr) {
        try {
            const parsed = JSON.parse(roomsStr);
            if (Array.isArray(parsed) && parsed.length > 0) {
                rooms = parsed.map((r: any) => ({
                    numAdults: Number(r.numAdults) || 1,
                    childAges: Array.isArray(r.childAges) ? r.childAges.map(Number) : [],
                }));
            }
        } catch {
            // fallback to default 1 room
        }
    }

    return {
        countryCode,
        cityId,
        hotelIds,
        checkInDate,
        checkOutDate,
        rooms,
        nationality,
        availableOnly,
    };
}

export function formatDateRangeFr(checkIn: string, checkOut: string): string {
    try {
        const dIn = new Date(checkIn);
        const dOut = new Date(checkOut);
        if (isNaN(dIn.getTime()) || isNaN(dOut.getTime())) {
            return `${checkIn} - ${checkOut}`;
        }
        const fIn = format(dIn, 'd MMM', { locale: fr });
        const fOut = format(dOut, 'd MMM yyyy', { locale: fr });
        return `${fIn} - ${fOut}`;
    } catch {
        return `${checkIn} - ${checkOut}`;
    }
}

export function nightsBetween(checkIn: string, checkOut: string): number {
    try {
        const dIn = new Date(checkIn);
        const dOut = new Date(checkOut);
        const diff = Math.round((dOut.getTime() - dIn.getTime()) / (1000 * 60 * 60 * 24));
        return Math.max(1, isNaN(diff) ? 1 : diff);
    } catch {
        return 1;
    }
}
