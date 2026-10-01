const BASE = `${import.meta.env.VITE_API_URL}/api/esim`;

const esimHeaders = (): HeadersInit => ({
    'Content-Type': 'application/json',
});

export interface Location {
    code:      string;
    name:      string;
    image:     string;
    cover:     string;
    fromPrice: number;
}

export interface Operator {
    operatorName: string;
    networkType:  string;
}

export interface NetworkList {
    operatorList: Operator[];
}

export interface DailyDiscount {
    day:      number;
    discount: number;
}

export interface EsimPackage {
    id:                  number;
    volume:              number;
    duration:            number;
    price:               number;
    daily_discounts:     DailyDiscount[];
    locationNetworkList: NetworkList[];
}

export interface LocationDetail {
    name:  string;
    image: string;
    code:  string;
}

export interface Esim {
    id:          number;
    iccid:       string;
    ac:          string;
    packageName: string;
    totalVolume: number;
}

export interface EsimOrder {
    batch_id: string;
    esims:    Esim[];
}

export interface EsimPaymentStatus {
    status: string;
    amount: number;
    extra:  { currency: string };
    order:  EsimOrder;
}

export interface CreateOrderPayload {
    package:            number;
    quantity:           number;
    days:               number;
    payment_method:     number;
    promo_codes:        string[];
    currency:           string;
    email:              string;
    name:               string;
    phone?:             string;
    country:            string;
    country_phone_code: string;
    delivery: {
        name:      string;
        email:     string;
        phone?:    string;
        whatsapp?: string;
    };
    // ── Champs supplémentaires pour la BD ─────────────────────────────────────
    locationCode?: string;
    locationName?: string;
    volumeBytes?:  number;
    price?:        number;
    clientId?:     string | null;
}

/** 1. GET /api/esim/locations?search=... */
export const searchLocations = async (
    query: string = ''
): Promise<{ countries: Location[]; regions: Location[] }> => {
    const res  = await fetch(`${BASE}/locations?search=${encodeURIComponent(query)}`, {
        headers: esimHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message ?? 'Impossible de récupérer les destinations');
    return data.data;
};

/** 2. POST /api/esim/packages */
export const getPackages = async (
    code:     string,
    currency: string = 'dzd'
): Promise<{ location: LocationDetail; packages: EsimPackage[] }> => {
    const res  = await fetch(`${BASE}/packages`, {
        method:  'POST',
        headers: esimHeaders(),
        body:    JSON.stringify({ code, currency }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message ?? 'Impossible de récupérer les forfaits');
    return data.data;
};

/** 3. POST /api/esim/order → retourne paymentId */
export const createEsimOrder = async (
    payload: CreateOrderPayload
): Promise<string> => {
    const res  = await fetch(`${BASE}/order`, {
        method:  'POST',
        headers: esimHeaders(),
        body:    JSON.stringify(payload),
    });
    const data = await res.json();

    // ── GoSIM retourne parfois failure même si la commande passe ──────────────
    if (!res.ok || data.status === 'failure') {
        throw new Error(data.message ?? 'Échec de la création de la commande');
    }

    // ── Essayer tous les chemins possibles pour le paymentId ──────────────────
    const paymentId =
        data?.data?.data?.payment?.id ||
        data?.data?.payment?.id       ||
        data?.payment?.id             ||
        data?.id                      ||
        null;

    if (!paymentId) throw new Error('Payment ID introuvable dans la réponse GoSIM');

    return paymentId;
};

/** 4. GET /api/esim/order/status/:paymentId */
export const getEsimPaymentStatus = async (
    paymentId: string
): Promise<EsimPaymentStatus> => {
    const res  = await fetch(`${BASE}/order/status/${paymentId}`, {
        headers: esimHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message ?? 'Impossible de récupérer le statut');
    return data.data;
};

export const formatBytes = (bytes: number): string => {
    if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(0)} GB`;
    return `${(bytes / 1048576).toFixed(0)} MB`;
};

export const getDiscountedPrice = (pkg: EsimPackage, days: number): number => {
    const discount = pkg.daily_discounts?.find((d) => d.day === days);
    if (!discount) return pkg.price;
    return Math.round(pkg.price * (1 - discount.discount / 100));
};