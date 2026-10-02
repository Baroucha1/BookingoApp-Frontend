const API_URL = import.meta.env.VITE_API_URL;

/**
 * Upload a file to the server.
 * Returns the public URL to display/download the file.
 */
export const uploadFile = async (file: File | Blob | string): Promise<string> => {
    if (typeof file === 'string') {
        return file.startsWith('http://api.bookingo.net')
            ? file.replace('http://api.bookingo.net', 'https://api.bookingo.net')
            : file;
    }

    if (!file) {
        throw new Error("Aucun fichier à téléverser.");
    }

    const formData = new FormData();
    const fileName = (file as File).name || 'document.pdf';
    formData.append('file', file, fileName);

    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers,
        body: formData,
    });

    if (!response.ok) {
        let errorMsg = `Échec de l'envoi du document (${response.status})`;
        try {
            const error = await response.json();
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

    const data = await response.json().catch(() => null);
    let resolvedUrl =
        data?.url ||
        data?.fileUrl ||
        data?.data?.url ||
        data?.data?.fileUrl ||
        data?.path ||
        (typeof data === 'string' ? data : null);

    if (!resolvedUrl) {
        throw new Error("L'URL du document est introuvable dans la réponse.");
    }

    if (typeof resolvedUrl === 'string' && resolvedUrl.startsWith('http://api.bookingo.net')) {
        resolvedUrl = resolvedUrl.replace('http://api.bookingo.net', 'https://api.bookingo.net');
    }

    return resolvedUrl;
};

