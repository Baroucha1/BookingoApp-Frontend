import type { TravellandaHotelDetails } from '@/service/admin/hotel/staticdataTravellenda.ts';

export const AMENITY_KEYWORDS: Record<string, string[]> = {
    'Wi-Fi gratuit': ['wifi', 'wireless', 'internet'],
    'Piscine': ['pool', 'piscine'],
    'Parking': ['parking'],
    'Climatisation': ['air-conditioned', 'air conditioning', 'climatisation'],
    'Restaurant': ['restaurant'],
};

export const AMENITY_LABELS = Object.keys(AMENITY_KEYWORDS);

export function hotelHasAmenity(details: TravellandaHotelDetails | undefined, amenity: string): boolean {
    if (!details?.facilities) return false;
    const keywords = AMENITY_KEYWORDS[amenity] ?? [];
    return details.facilities.some((f) =>
        keywords.some((kw) => f.facilityName.toLowerCase().includes(kw)),
    );
}