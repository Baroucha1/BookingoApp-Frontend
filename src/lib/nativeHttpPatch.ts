import { Capacitor, CapacitorHttp, HttpOptions, HttpResponse } from '@capacitor/core';

const originalFetch = window.fetch.bind(window);

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
      const headers: Record<string, string> = {
        'Origin': 'capacitor://localboat',
      };

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

      // Prepare request body
      let data: any = init?.body;
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch {
          // keep as string if not valid JSON
        }
      }

      const options: HttpOptions = {
        url,
        method,
        headers,
        data,
      };

      const res: HttpResponse = await CapacitorHttp.request(options);

      // Convert response body to text / json Blob
      const responseData = typeof res.data === 'object' ? JSON.stringify(res.data) : (res.data ?? '');

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
      if (!hasContentType && typeof res.data === 'object') {
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
      }

      return response;
    } catch (err) {
      console.warn('[NativeHttpPatch] Fallback to original fetch due to error:', err);
      return originalFetch(input, init);
    }
  };
}
