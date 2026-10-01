// src/service/hotels/hotelStaticData.public.service.ts
const API = import.meta.env.VITE_API_URL;

export interface TravellandaCountry { code: string; name: string; }
export interface TravellandaCity { cityId: number; cityName: string; stateCode: string | null; countryCode: string; }
export interface TravellandaHotel { hotelId: number; cityId: number; hotelName: string; }

async function handle<T>(res: Response): Promise<T> {
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message ?? 'Une erreur est survenue');
    return data.data as T;
}

export async function getCountries(): Promise<TravellandaCountry[]> {
    const res = await fetch(`${API}/api/hotels/countries`);
    return handle<TravellandaCountry[]>(res);
}

export async function getCities(countryCode: string): Promise<TravellandaCity[]> {
    const res = await fetch(`${API}/api/hotels/cities?countryCode=${countryCode}`);
    return handle<TravellandaCity[]>(res);
}

export async function getHotels(cityId: number): Promise<TravellandaHotel[]> {
    const res = await fetch(`${API}/api/hotels/hotels?cityId=${cityId}`);
    return handle<TravellandaHotel[]>(res);
}