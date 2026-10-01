import type { Payment } from '../lib/types';

const API_URL = import.meta.env.VITE_API_URL;

// ─── Custom payments (admin-created, paid via SATIM) ────────────────────────

export interface CustomPayment {
    id:                string;
    title:              string;
    description:        string | null;
    amount:             number;
    currency:           string;
    method:             string;
    status:             'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
    satimOrderId:       string | null;
    satimIdentifiant:   string | null;
    satimOrderNumber:   string | null;
    satimApprovalCode:  string | null;
    receiptRef:         string | null;
    receiptNumber:      number | null;
    paidAt:             string | null;
    createdAt:          string;
    clientId:           string;
}

/** Client: list their own payment requests */
export const getClientCustomPayments = async (clientId: string): Promise<CustomPayment[]> => {
    const res  = await fetch(`${API_URL}/api/payments/custom/client/${clientId}`, { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message ?? 'Something went wrong');
    return data.data;
};

/** Fetch a single custom payment (the "pay" page) */
export const getCustomPayment = async (id: string): Promise<CustomPayment> => {
    const res  = await fetch(`${API_URL}/api/payments/custom/${id}`, { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message ?? 'Impossible de récupérer le paiement');
    return data.data;
};

/** Admin: list all custom payments */
export const getAllCustomPayments = async (): Promise<CustomPayment[]> => {
    const res  = await fetch(`${API_URL}/api/payments/custom`, { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message ?? 'Something went wrong');
    return data.data;
};

/** Admin: create a payment request for a client */
export const createCustomPayment = async (payload: {
    clientId: string; title: string; description?: string; amount: number;
}): Promise<CustomPayment> => {
    const res  = await fetch(`${API_URL}/api/payments/custom`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message ?? 'Échec de la création du paiement');
    return data.data;
};

/** Admin: cancel a not-yet-paid request */
export const cancelCustomPayment = async (id: string): Promise<void> => {
    const res  = await fetch(`${API_URL}/api/payments/custom/${id}`, {
        method: 'DELETE', headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message ?? 'Échec de l\'annulation');
};

/** Client: initiate SATIM payment for a custom request */
export const initiateCustomSatimPayment = async (
    id: string,
    captchaToken: string,
): Promise<SatimInitiateResult> => {
    if (!id) {
        throw new Error("Identifiant du paiement introuvable.");
    }
    const res = await fetch(`${API_URL}/api/payments/custom/${id}/initiate`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ captchaToken }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const msg = (typeof data?.message === 'string' && data.message !== 'null' && data.message.trim())
            ? data.message
            : (typeof data?.error === 'string' && data.error !== 'null' && data.error.trim())
            ? data.error
            : (typeof data?.errorMessage === 'string' && data.errorMessage !== 'null' && data.errorMessage.trim())
            ? data.errorMessage
            : "Échec de l'initiation du paiement SATIM";
        throw new Error(msg);
    }
    if (!data?.formUrl) {
        throw new Error("Lien de redirection bancaire SATIM indisponible");
    }
    return data;
};

/** Client: confirm after SATIM redirect */
export const confirmCustomSatimPayment = async (
    id: string,
    orderId: string,
): Promise<SatimConfirmResult> => {
    const res  = await fetch(`${API_URL}/api/payments/custom/${id}/confirm`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ orderId }),
    });
    const data = await res.json();
    if (!res.ok) {
        const err: any = new Error(
            data.respCode_desc         ||
            data.actionCodeDescription ||
            data.message               ||
            'Échec de la confirmation du paiement SATIM'
        );
        err.respCode_desc         = data.respCode_desc;
        err.actionCodeDescription = data.actionCodeDescription;
        err.rejectionCase         = data.rejectionCase;
        throw err;
    }
    return data;
};
// ─── helpers ──────────────────────────────────────────────────────────────────
const authHeaders = (): HeadersInit => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};



export const getClientPayments = async (clientId: string): Promise<Payment[]> => {
    const res  = await fetch(`${API_URL}/api/payments/my-payments/${clientId}`, { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message ?? 'Something went wrong');
    return data.data;
};

export const getPayments = async (): Promise<Payment[]> => {
    const res  = await fetch(`${API_URL}/api/payments/payments-list`, { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message ?? 'Something went wrong');
    return data.data;
};



// ─── SATIM (CIB / EDAHABIA) ──────────────────────────────────────────────────

export interface SatimInitiateResult {
    formUrl:     string;
    orderId:     string;
    orderNumber: string;
    reused?:     boolean;
}

export const initiateSatimPayment = async (
    applicationId: string,
    captchaToken: string,
): Promise<SatimInitiateResult> => {
    if (!applicationId) {
        throw new Error("Identifiant de la demande introuvable.");
    }
    const res = await fetch(`${API_URL}/api/payments/satim/initiate`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ applicationId, captchaToken }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const msg = (typeof data?.message === 'string' && data.message !== 'null' && data.message.trim())
            ? data.message
            : (typeof data?.error === 'string' && data.error !== 'null' && data.error.trim())
            ? data.error
            : (typeof data?.errorMessage === 'string' && data.errorMessage !== 'null' && data.errorMessage.trim())
            ? data.errorMessage
            : "Échec de l'initiation du paiement SATIM";
        throw new Error(msg);
    }
    if (!data?.formUrl) {
        const msg = (typeof data?.message === 'string' && data.message !== 'null' && data.message.trim())
            ? data.message
            : (typeof data?.error === 'string' && data.error !== 'null' && data.error.trim())
            ? data.error
            : "Lien de redirection bancaire SATIM indisponible";
        throw new Error(msg);
    }
    return data;
};

export const initiateFlightSatimPayment = async (
    flightBookingId: string,
    captchaToken: string,
): Promise<SatimInitiateResult> => {
    if (!flightBookingId) {
        throw new Error("Identifiant de réservation introuvable.");
    }
    const res = await fetch(`${API_URL}/api/payments/satim/initiate-flight`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ flightBookingId, captchaToken }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const msg = (typeof data?.error === 'string' && data.error !== 'null' && data.error.trim())
            ? data.error
            : (typeof data?.message === 'string' && data.message !== 'null' && data.message.trim())
            ? data.message
            : (typeof data?.errorMessage === 'string' && data.errorMessage !== 'null' && data.errorMessage.trim())
            ? data.errorMessage
            : "Échec de l'initiation du paiement SATIM";
        throw new Error(msg);
    }
    if (!data?.formUrl) {
        const msg = (typeof data?.error === 'string' && data.error !== 'null' && data.error.trim())
            ? data.error
            : (typeof data?.message === 'string' && data.message !== 'null' && data.message.trim())
            ? data.message
            : "Lien de redirection bancaire SATIM indisponible";
        throw new Error(msg);
    }
    return data;
};

export interface SatimConfirmResult {
    payment: Payment;
    satimDetails: {
        identifiant:     string;
        orderNumber:     string;
        approvalCode:    string;
        respCode_desc:   string;
        pan:             string;
        amount:          number;
        currency:        string;
        paymentMethod:   string;
        transactionDate: string;
        receiptRef:      string;
    };
}

export const confirmSatimPayment = async (
    applicationId: string,
    orderId: string,
): Promise<SatimConfirmResult> => {
    const res  = await fetch(`${API_URL}/api/payments/satim/confirm`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ applicationId, orderId }),
    });
    const data = await res.json();
    if (!res.ok) {
        const err: any = new Error(
            data.respCode_desc         ||
            data.actionCodeDescription ||
            data.message               ||
            'Échec de la confirmation du paiement SATIM'
        );
        err.respCode_desc         = data.respCode_desc;
        err.actionCodeDescription = data.actionCodeDescription;
        err.rejectionCase         = data.rejectionCase;
        throw err;
    }
    return data;
};

export const confirmFlightSatimPayment = async (
    flightBookingId: string,
    orderId: string,
): Promise<SatimConfirmResult> => {
    const res  = await fetch(`${API_URL}/api/payments/satim/confirm-flight`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ flightBookingId, orderId }),
    });
    const data = await res.json();
    if (!res.ok) {
        const err: any = new Error(
            data.respCode_desc         ||
            data.actionCodeDescription ||
            data.message               ||
            'Échec de la confirmation du paiement SATIM'
        );
        err.respCode_desc         = data.respCode_desc;
        err.actionCodeDescription = data.actionCodeDescription;
        err.rejectionCase         = data.rejectionCase;
        throw err;
    }
    return data;
};

// ─── Reçu ─────────────────────────────────────────────────────────────────────

export interface ReceiptData {
    id:                string;
    receiptRef:        string;
    amount:            number;
    currency:          string;
    method:            string;
    status:            string;
    paidAt:            string;
    formattedDate:     string;
    satimIdentifiant:  string;
    satimOrderNumber:  string;
    satimApprovalCode: string;
    visaApplication: {
        id:             string;
        email:          string;
        phone:          string;
        startDate:      string;
        numberOfPeople: number;
        visaType: {
            nameFr:          string;
            duration:        number;
            processingDelay: number;
            category:        string;
            country: {
                nameFr: string;
                code:   string;
            };
        };
        passengers: {
            firstName:      string;
            lastName:       string;
            passportNumber: string;
            nationality:    string;
        }[];
    };
}

export const getReceipt = async (applicationId: string): Promise<ReceiptData> => {
    const res  = await fetch(
        `${API_URL}/api/payments/receipt/${applicationId}`,
        { headers: authHeaders() },
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.message ?? 'Impossible de récupérer le reçu');
    return data.data;
};

// ─── eSIM (SATIM) ─────────────────────────────────────────────────────────────

export interface EsimOrder {
    id:                 string;
    gosimPaymentId:     string | null;
    gosimPackageId:     number;
    locationCode:       string;
    locationName:       string;
    volumeBytes:        string;
    durationDays:       number;
    amount:             number;
    currency:           string;
    customerName:       string;
    customerEmail:      string;
    customerPhone:      string | null;
    deliveryMethod:     string;
    status:             'PENDING' | 'SUCCESS' | 'FAILED';
    iccid:              string | null;
    activationCode:     string | null;
    qrCodeUrl:          string | null;
    satimOrderId:       string | null;
    satimIdentifiant:   string | null;
    satimOrderNumber:   string | null;
    satimApprovalCode:  string | null;
    receiptRef:         string | null;
    receiptNumber:      number | null;
    paidAt:             string | null;
    createdAt:          string;
    clientId:           string | null;
}

export const initiateEsimSatimPayment = async (payload: {
    package:      number;
    days:         number;
    currency?:    string;
    email:        string;
    name:         string;
    phone?:       string;
    delivery: {
        name:     string;
        email:    string;
        whatsapp?: string;
        phone?:    string;
    };
    locationCode: string;
    locationName: string;
    volumeBytes:  string | number;
    price:        number;
    clientId?:    string;
    captchaToken: string;
}): Promise<SatimInitiateResult> => {
    const res = await fetch(`${API_URL}/api/esim/order`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message ?? "Échec de l'initiation du paiement SATIM");
    return data;
};

export interface SatimEsimConfirmResult {
    order: EsimOrder;
    satimDetails: {
        identifiant:     string;
        orderNumber:     string;
        approvalCode:    string;
        respCode_desc:   string;
        pan:             string;
        amount:          number;
        currency:        string;
        paymentMethod:   string;
        transactionDate: string;
        receiptRef:      string;
        gosimPaymentId?: string;
    };
}

export const confirmEsimSatimPayment = async (
    orderId: string,
    satimOrderId: string,
): Promise<SatimEsimConfirmResult> => {
    const res  = await fetch(`${API_URL}/api/esim/satim/confirm-esim`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ orderId, satimOrderId }),
    });
    const data = await res.json();
    if (!res.ok) {
        const err: any = new Error(
            data.respCode_desc         ||
            data.actionCodeDescription ||
            data.message               ||
            'Échec de la confirmation du paiement SATIM'
        );
        err.respCode_desc         = data.respCode_desc;
        err.actionCodeDescription = data.actionCodeDescription;
        err.rejectionCase         = data.rejectionCase;
        err.orderId               = data.orderId; // present on the "paid but GoSIM failed" 502
        throw err;
    }
    return data;
};