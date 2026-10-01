


const API_URL = import.meta.env.VITE_API_URL;

/**
 * Upload a file to the server.
 * Returns the public URL to display/download the file.
 */
export const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message ?? 'Upload failed');
    }

    const data = await response.json();
    return data.url;
};

