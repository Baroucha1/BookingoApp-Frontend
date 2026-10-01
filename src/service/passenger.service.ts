const API_URL = import.meta.env.VITE_API_URL;

export type PassengerInput = {
    applicationId?:      string;
    firstName:          string;
    lastName:           string;
    birthDate:          string | Date;
    birthPlace?:        string;
    nationality?:       string | null;
    passportNumber:     string;
    passportIssueDate:  string | Date;
    passportExpiryDate: string | Date;
    email?:             string | null;
};

/**
 * Create a single passenger linked to an application.
 */
export const createPassenger = async (data: PassengerInput) => {
    const response = await fetch(`${API_URL}/api/passengers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message ?? 'Failed to create passenger');
    }

    return response.json();
};

/**
 * Get a single passenger with their documents.
 */
export const getPassengerById = async (id: string) => {
    const response = await fetch(`${API_URL}/api/passengers/${id}`);

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message ?? 'Failed to fetch passenger');
    }

    return response.json();
};

/**
 * Get all passengers for a given application.
 */
export const getPassengersByApplication = async (applicationId: string) => {
    const response = await fetch(`${API_URL}/api/passengers?applicationId=${applicationId}`);

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message ?? 'Failed to fetch passengers');
    }

    return response.json();
};