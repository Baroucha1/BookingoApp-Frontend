// src/service/admin/travellanda.service.ts

const API = import.meta.env.VITE_API_URL;

export interface TravellandaCountry {
    code: string;
    name: string;
}

export interface TravellandaCity {
    cityId: number;
    cityName: string;
    stateCode: string | null;
    countryCode: string;
}

export interface TravellandaHotel {
    hotelId: number;
    cityId: number;
    hotelName: string;
}

export interface TravellandaHotelDetails {
    hotelId: number;
    cityId: number;
    name: string;
    starRating: string;
    latitude: number;
    longitude: number;
    address: string;
    description: string;
    images: string[];
    facilities?: { facilityType: string; facilityName: string }[];
}

function authHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
}

async function handle<T>(res: Response): Promise<T> {
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message ?? 'Une erreur est survenue');
    return data.data as T;
}

export async function getTravellandaCountries(): Promise<TravellandaCountry[]> {
    const res = await fetch(`${API}/api/admin/hotels/sync/travellanda/countries`, {
        headers: authHeaders(),
    });
    return handle<TravellandaCountry[]>(res);
}

export async function getTravellandaCities(countryCode: string): Promise<TravellandaCity[]> {
    const res = await fetch(`${API}/api/admin/hotels/sync/travellanda/cities?countryCode=${countryCode}`, {
        headers: authHeaders(),
    });
    return handle<TravellandaCity[]>(res);
}

export async function getTravellandaHotels(cityId: number): Promise<TravellandaHotel[]> {
    const res = await fetch(`${API}/api/admin/hotels/sync/travellanda/hotels?cityId=${cityId}`, {
        headers: authHeaders(),
    });
    return handle<TravellandaHotel[]>(res);
}

export async function getTravellandaHotelDetails(hotelId: number): Promise<TravellandaHotelDetails> {
    const res = await fetch(`${API}/api/admin/hotels/sync/travellanda/hotels/${hotelId}`, {
        headers: authHeaders(),
    });
    return handle<TravellandaHotelDetails>(res);
}