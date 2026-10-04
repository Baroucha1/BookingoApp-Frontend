import { apiUrl } from '../_http';

export interface EsimTestPing {
    ok: boolean;
    message: string;
    env: {
        GOSIM_URL: string;
        GOSIM_KEY: string;
    };
}

export interface EsimTestFullFlow {
    step: string;
    location: {
        code: string;
        name: string;
        image: string;
        cover: string;
        fromPrice: number;
    };
    packages: unknown;
}

export async function pingEsimTest(): Promise<EsimTestPing | null> {
    const res = await fetch(apiUrl('/api/esim/ping'), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
        console.error('pingEsimTest failed:', res.status, await res.text());
        return null;
    }

    return res.json();
}

export async function testEsimFullFlow(
    search: string = 'france',
    currency: string = 'usd'
): Promise<EsimTestFullFlow | null> {
    const params = new URLSearchParams({ search, currency });

    const res = await fetch(apiUrl(`/api/esim/full?${params.toString()}`), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
        console.error('testEsimFullFlow failed:', res.status, await res.text());
        return null;
    }

    return res.json();
}