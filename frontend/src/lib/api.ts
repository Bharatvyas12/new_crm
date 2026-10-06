const getBaseUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host !== "localhost" && host !== "127.0.0.1") {
      return "https://new-crm-c339.onrender.com/api/v1";
    }
  }
  if (!envUrl || envUrl.includes("localhost")) {
    if (typeof window !== "undefined" && window.location.hostname !== "localhost") {
      return "https://new-crm-c339.onrender.com/api/v1";
    }
  }
  return envUrl || "https://new-crm-c339.onrender.com/api/v1";
};

export const BASE_URL = getBaseUrl();
export const API_BASE_URL = BASE_URL;

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, data: any, message: string) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

function getCsrfToken(): string | null {
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(new RegExp('(^| )wcrm_csrf=([^;]+)'));
    if (match) return match[2];
  }
  return null;
}

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${endpoint}`;
  
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  
  const csrfToken = getCsrfToken();
  if (csrfToken && options.method && options.method !== 'GET') {
    headers.set('X-CSRF-Token', csrfToken);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { detail: response.statusText };
    }
    throw new ApiError(response.status, errorData, errorData.detail || 'An error occurred');
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  get: (endpoint: string, options?: RequestInit) => fetchWithAuth(endpoint, { ...options, method: 'GET' }),
  post: (endpoint: string, data?: any, options?: RequestInit) => fetchWithAuth(endpoint, { ...options, method: 'POST', body: JSON.stringify(data) }),
  patch: (endpoint: string, data?: any, options?: RequestInit) => fetchWithAuth(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(data) }),
  delete: (endpoint: string, options?: RequestInit) => fetchWithAuth(endpoint, { ...options, method: 'DELETE' }),
};
