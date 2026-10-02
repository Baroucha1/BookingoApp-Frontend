import { Capacitor, CapacitorHttp, HttpOptions, HttpResponse } from '@capacitor/core';

const originalFetch = window.fetch.bind(window);

const readFileAsBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = (reader.result as string) || '';
      const commaIdx = result.indexOf(',');
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const serializeFormDataForCapacitor = async (formData: FormData): Promise<any[]> => {
  const list: any[] = [];
  const entries: [string, any][] = [];
  formData.forEach((value, key) => {
    entries.push([key, value]);
  });

  for (const [key, value] of entries) {
    if (value instanceof Blob || (typeof File !== 'undefined' && value instanceof File)) {
      const base64 = await readFileAsBase64(value);
      list.push({
        key,
        value: base64,
        type: 'base64File',
        contentType: value.type || 'application/octet-stream',
        fileName: (value as File).name || 'file',
      });
    } else {
      list.push({
        key,
        value: String(value),
        type: 'string',
      });
    }
  }
  return list;
};

// Check if running in a native Capacitor environment (Android / iOS)
export function setupNativeHttpPatch() {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  // Override global window.fetch for native platforms
  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    let url: string;
    if (typeof input === 'string') {
      url = input;
    } else if (input instanceof URL) {
      url = input.toString();
    } else if (input && 'url' in input) {
      url = (input as Request).url;
    } else {
      url = String(input);
    }

    // Only intercept HTTP(S) calls (API requests)
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return originalFetch(input, init);
    }

    try {
      const method = (init?.method || (typeof input === 'object' && 'method' in input ? (input as Request).method : 'GET')).toUpperCase();

      // Extract and merge headers
      const headers: Record<string, string> = {};

      if (init?.headers) {
        if (init.headers instanceof Headers) {
          init.headers.forEach((val, key) => {
            headers[key] = val;
          });
        } else if (Array.isArray(init.headers)) {
          init.headers.forEach(([key, val]) => {
            headers[key] = val;
          });
        } else {
          Object.assign(headers, init.headers);
        }
      }

      // Safe Origin header: backend requires https://app.bookingo.net or https://bookingo.net for CORS
      const originKey = Object.keys(headers).find(k => k.toLowerCase() === 'origin') || 'Origin';
      const currentOrigin = headers[originKey] || (typeof window !== 'undefined' ? window.location?.origin : '');
      if (!currentOrigin || currentOrigin.includes('localhost') || currentOrigin.startsWith('capacitor://') || currentOrigin.includes('localboat')) {
        headers[originKey] = 'https://app.bookingo.net';
      }

      // Prepare request body
      let data: any = init?.body;
      let dataType: 'formData' | undefined = undefined;
      const isBodyAllowed = method !== 'GET' && method !== 'HEAD';

      if (!isBodyAllowed || data === undefined || data === null) {
        // Strip Content-Type for GET / HEAD / empty requests to prevent iOS CapacitorUrlRequest serialization error
        Object.keys(headers).forEach(k => {
          if (k.toLowerCase() === 'content-type') {
            delete headers[k];
          }
        });
        data = undefined;
      } else if (typeof FormData !== 'undefined' && data instanceof FormData) {
        dataType = 'formData';
        data = await serializeFormDataForCapacitor(data);
        const hasContentType = Object.keys(headers).some(k => k.toLowerCase() === 'content-type');
        if (!hasContentType) {
          headers['Content-Type'] = 'multipart/form-data';
        }
      }

      const options: HttpOptions = {
        url,
        method,
        headers,
        ...(data !== undefined ? { data } : {}),
        ...(dataType ? { dataType } : {}),
      };

      const res: HttpResponse = await CapacitorHttp.request(options);

      // Convert response body to text / json Blob
      const responseData = typeof res.data === 'object' && res.data !== null ? JSON.stringify(res.data) : (res.data ?? '');

      const responseHeaders = new Headers();
      let hasContentType = false;
      if (res.headers) {
        Object.entries(res.headers).forEach(([k, v]) => {
          if (v !== undefined && v !== null) {
            try {
              responseHeaders.set(k.toLowerCase(), String(v));
              if (k.toLowerCase() === 'content-type') hasContentType = true;
            } catch {}
          }
        });
      }
      if (!hasContentType && typeof res.data === 'object' && res.data !== null) {
        responseHeaders.set('content-type', 'application/json; charset=utf-8');
      }

      const responseInit: ResponseInit = {
        status: res.status || 200,
        statusText: res.status >= 200 && res.status < 300 ? 'OK' : 'Error',
        headers: responseHeaders,
      };

      const response = new Response(responseData, responseInit);

      // Explicitly override response.json() in case Response polyfill has issues
      if (typeof res.data === 'object' && res.data !== null) {
        response.json = async () => res.data;
      } else if (typeof res.data === 'string') {
        response.json = async () => {
          try {
            return JSON.parse(res.data);
          } catch {
            return res.data;
          }
        };
      }

      return response;
    } catch (err: any) {
      console.warn('[NativeHttpPatch] Fallback to original fetch due to error:', err?.message || err);
      return originalFetch(input, init);
    }
  };
}
