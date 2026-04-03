const API_BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('alnakheel_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (data: { name: string; email: string; password: string; phone?: string }) =>
    request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: () => request<any>('/auth/me'),
};

// Dashboard
export const dashboardApi = {
  get: () => request<any>('/dashboard'),
};

// Bookings
export const bookingsApi = {
  create: (data: {
    property_id: string;
    guest_name: string;
    guest_phone: string;
    guest_email?: string;
    check_in: string;
    check_out: string;
  }) => request<{ booking: any; property_name: string }>('/bookings', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  list: (params?: { status?: string }) => {
    const query = params?.status ? `?status=${params.status}` : '';
    return request<{ bookings: any[]; total: number }>(`/bookings${query}`);
  },

  get: (id: string) => request<any>(`/bookings/${id}`),

  update: (id: string, data: { status?: string; payment_status?: string }) =>
    request<any>(`/bookings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

// Guests
export const guestsApi = {
  list: (params?: { status?: string; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.search) searchParams.set('search', params.search);
    const query = searchParams.toString();
    return request<any[]>(`/guests${query ? '?' + query : ''}`);
  },

  stats: () => request<{
    checkedIn: number;
    upcoming: number;
    checkingOut: number;
    completed: number;
    total: number;
  }>('/guests/stats'),

  update: (id: string, data: { status: string }) =>
    request<any>(`/guests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

// Invoices
export const invoicesApi = {
  list: (params?: { status?: string }) => {
    const query = params?.status ? `?status=${params.status}` : '';
    return request<any[]>(`/invoices${query}`);
  },

  stats: () => request<{
    outstanding: number;
    totalPaid: number;
    pendingCount: number;
    overdueCount: number;
    healthRate: number;
    awaitingAction: number;
  }>('/invoices/stats'),

  get: (id: string) => request<any>(`/invoices/${id}`),

  update: (id: string, data: { status?: string; vat_compliant?: boolean }) =>
    request<any>(`/invoices/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  create: (data: { guest_name: string; booking_ref: string; room_type: string; items: { description: string; amount: number }[] }) =>
    request<any>('/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Reports
export const reportsApi = {
  get: () => request<any>('/reports'),
};

// Properties
export const propertiesApi = {
  list: () => request<any[]>('/properties'),
  get: (id: string) => request<any>(`/properties/${id}`),
  checkAvailability: (id: string, checkIn: string, checkOut: string) =>
    request<{ available: boolean }>(`/properties/${id}/availability?check_in=${checkIn}&check_out=${checkOut}`),
};

// Transactions
export const transactionsApi = {
  list: (limit?: number) => request<any[]>(`/transactions${limit ? '?limit=' + limit : ''}`),
};
