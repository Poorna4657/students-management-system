function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/+$/, '');
  }

  // If in browser on localhost/127.0.0.1 without env var, default to local backend
  if (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ) {
    return 'http://localhost:5000/api';
  }

  // Default relative fallback for co-located hosting / Nginx proxy
  return '/api';
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

// Helper function for API calls
async function apiCall<T>(
  method: string,
  endpoint: string,
  body?: any
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(url, options);
  } catch (fetchErr: any) {
    throw new Error(
      `Unable to connect to backend server at "${url}". Check if the backend is online.`
    );
  }

  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    const responseText = await response.text();
    const preview = responseText.slice(0, 80).replace(/\s+/g, ' ');
    throw new Error(
      `API endpoint "${url}" returned HTTP ${response.status} (${response.statusText}) instead of JSON. Response: "${preview}...". ` +
        `If hosting frontend separately (e.g. Vercel/Netlify), set VITE_API_URL in your build environment variables.`
    );
  }

  let result: ApiResponse<T>;
  try {
    result = await response.json();
  } catch (jsonErr: any) {
    throw new Error(
      `Invalid JSON received from ${url} (HTTP ${response.status})`
    );
  }

  if (!response.ok || !result.success) {
    throw new Error(result?.message || `API Error (HTTP ${response.status})`);
  }

  return result.data as T;
}

export const api = {
  // Students
  students: {
    list: () => apiCall('GET', '/students'),
    get: (id: string) => apiCall('GET', `/students/${id}`),
    create: (data: any) => apiCall('POST', '/students', data),
    update: (id: string, data: any) => apiCall('PUT', `/students/${id}`, data),
    delete: (id: string) => apiCall('DELETE', `/students/${id}`),
  },

  // Courses
  courses: {
    list: () => apiCall('GET', '/courses'),
    get: (id: string) => apiCall('GET', `/courses/${id}`),
    create: (data: any) => apiCall('POST', '/courses', data),
    update: (id: string, data: any) => apiCall('PUT', `/courses/${id}`, data),
    delete: (id: string) => apiCall('DELETE', `/courses/${id}`),
  },

  // Enrollments
  enrollments: {
    list: () => apiCall('GET', '/enrollments'),
    getByCourse: (courseId: string) => apiCall('GET', `/enrollments/course/${courseId}`),
    create: (data: any) => apiCall('POST', '/enrollments', data),
    update: (id: string, data: any) => apiCall('PUT', `/enrollments/${id}`, data),
    delete: (id: string) => apiCall('DELETE', `/enrollments/${id}`),
  },

  // Attendance
  attendance: {
    list: () => apiCall('GET', '/attendance'),
    getByDate: (courseId: string, date: string) =>
      apiCall('GET', `/attendance/course/${courseId}/date/${date}`),
    create: (data: any) => apiCall('POST', '/attendance', data),
    delete: (id: string) => apiCall('DELETE', `/attendance/${id}`),
  },

  // Auth
  auth: {
    login: (email: string, password: string) =>
      apiCall('POST', '/auth/login', { email, password }),
    signup: (email: string, password: string, name?: string) =>
      apiCall('POST', '/auth/signup', { email, password, name }),
    logout: () => apiCall('POST', '/auth/logout'),
  },
};

// For backward compatibility, export a supabase-like object (lightweight mock with chainable API)
function emptyResult() {
  return { data: [], error: null, count: 0 } as any;
}

function chainableResult() {
  const base = emptyResult();
  return {
    ...base,
    order: (_: any) => ({ ...base, limit: (_n: number) => base }),
    limit: (_n: number) => base,
  } as any;
}

export const supabase = {
  from: (_table: string) => ({
    select: (_fields?: string, _opts?: any) => chainableResult(),
    insert: (data: any) => ({ data, error: null }),
    update: (data: any) => ({ data, error: null }),
    delete: () => ({ data: null, error: null }),
  }),
};
