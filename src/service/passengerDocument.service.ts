const API_URL = import.meta.env.VITE_API_URL;

export type PassengerDocumentInput = {
    passengerId:   string;
    requirementId: string;
    fileUrl:       string;
    originalName:  string;
};

export type BulkDocumentInput = Omit<PassengerDocumentInput, 'passengerId'>;

/**
 * Attach a document to a passenger.
 * Uses upsert — re-uploading replaces the existing file for that requirement.
 */
export const upsertPassengerDocument = async (data: PassengerDocumentInput) => {
    const response = await fetch(`${API_URL}/api/passenger-documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message ?? 'Failed to upsert document');
    }

    return response.json();
};

/**
 * Bulk-create documents for a passenger.
 * Used during the application creation flow.
 */
export const createPassengerDocuments = async (
    passengerId: string,
    documents: BulkDocumentInput[]
) => {
    if (!documents?.length) return [];

    const response = await fetch(`${API_URL}/api/passenger-documents/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passengerId, documents }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message ?? 'Failed to create documents');
    }

    return response.json();
};

/**
 * Get all documents for a passenger.
 */
export const getDocumentsByPassenger = async (passengerId: string) => {
    const response = await fetch(`${API_URL}/api/passenger-documents/${passengerId}`);

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message ?? 'Failed to fetch documents');
    }

    return response.json();
}; 