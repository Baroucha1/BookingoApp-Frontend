import {PassengerInput} from "./passenger.service";
import {BulkDocumentInput} from "./passengerDocument.service";


const API_URL = import.meta.env.VITE_API_URL;

export type ApplicationInput = {
    visaTypeId:     string;
    email?:         string | null;
    phone?:         string | null;
    startDate:      string;
    numberOfPeople?: number;
    clientId?:      string | null;
    agencyId?:      string | null;
    passengers:     PassengerWithDocuments[];
};

export type PassengerWithDocuments = PassengerInput & {
    documents: BulkDocumentInput[];
};

/**
 * Create a full visa application with passengers and documents.
 */
export const createFullApplication = async (data: ApplicationInput) => {
    const token = localStorage.getItem('token');

    const response = await fetch(`${API_URL}/api/applications`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        let errorMsg = `Échec de l'envoi de la demande (${response.status})`;
        try {
            const error = await response.json();
            console.error('POST /api/applications failed:', response.status, error);
            if (error?.message) {
                errorMsg = error.message;
            } else if (error?.error) {
                errorMsg = error.error;
            }
        } catch {
            // ignore
        }
        throw new Error(errorMsg);
    }

    return response.json();
};

/**
 * Get a full application with visa type, country, passengers, documents and payment.
 */
export const getApplicationById = async (id: string) => {
    const response = await fetch(`${API_URL}/api/applications/${id}`);

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message ?? 'Failed to fetch application');
    }

    return response.json();
};

/**
 * Get all applications for a client.
 */
export const getApplicationsByClient = async (clientId: string) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/applications/client/${clientId}`, {
        headers: {Authorization: `Bearer ${token}`},
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message ?? 'Failed to fetch applications');
    }

    return response.json();
};

/**
 * Update application status — used by admin.
 */
export const updateApplicationStatus = async (id: string, status: string) => {
    const response = await fetch(`${API_URL}/api/applications/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message ?? 'Failed to update status');
    }

    return response.json();
};