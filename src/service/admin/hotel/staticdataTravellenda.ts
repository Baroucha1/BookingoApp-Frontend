// src/service/admin/hotel/staticdataTravellenda.ts

export interface TravellandaFacility {
    facilityName: string;
    facilityType?: string;
}

export interface TravellandaHotelDetails {
    hotelId: number;
    name: string;
    address: string;
    description: string;
    starRating: number | string | null;
    images: string[];
    facilities: TravellandaFacility[];
    latitude?: number | string | null;
    longitude?: number | string | null;
    cityId?: number;
    cityName?: string;
    countryCode?: string;
    countryName?: string;
    phone?: string;
    email?: string;
    website?: string;
}
