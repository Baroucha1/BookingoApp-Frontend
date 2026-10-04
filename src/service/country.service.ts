const API_URL = import.meta.env.VITE_API_URL;


export const getCountryImages = async (
    code: string,
    type?: 'FLAG' | 'HERO' | 'GALLERY' | 'THUMBNAIL' | string
): Promise<{ id: string; url: string; imageType: string; isMain: boolean }[]> => {
    const params = type ? `?type=${type}` : '';
    const res = await fetch(`${API_URL}/api/countries/${code}/images${params}`);
    const data = await res.json();
    return data.status === 'success' ? data.data : [];
};