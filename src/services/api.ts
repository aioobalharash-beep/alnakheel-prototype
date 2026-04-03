import {
  firestoreBookings,
  firestoreGuests,
  firestoreTransactions,
  firestoreTestimonials,
  firestoreNotifications,
} from './firestore';

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

// Bookings — Firestore
export const bookingsApi = {
  create: async (data: {
    property_id: string;
    property_name: string;
    guest_name: string;
    guest_phone: string;
    guest_email?: string;
    check_in: string;
    check_out: string;
    nightly_rate: number;
    security_deposit: number;
    payment_method: 'thawani' | 'bank_transfer' | 'walk_in';
    receipt_image?: string;
  }) => {
    const booking = await firestoreBookings.create(data);
    return { booking, property_name: data.property_name };
  },

  list: async (params?: { status?: string }) => {
    const bookings = await firestoreBookings.list();
    const filtered = params?.status
      ? bookings.filter(b => b.status === params.status)
      : bookings;
    return { bookings: filtered, total: filtered.length };
  },

  get: async (id: string) => firestoreBookings.get(id),

  update: async (id: string, data: { status?: string; payment_status?: string }) => {
    if (data.status) await firestoreBookings.updateStatus(id, data.status);
    return { id, ...data };
  },

  approvePayment: (id: string) => firestoreBookings.approvePayment(id),
};

// Guests — Firestore
export const guestsApi = {
  create: (data: {
    name: string;
    phone: string;
    email?: string;
    check_in: string;
    check_out: string;
    property_id: string;
    property_name: string;
  }) => firestoreGuests.create(data),

  list: (params?: { status?: string; search?: string }) =>
    firestoreGuests.list(params) as Promise<any[]>,

  stats: () => firestoreGuests.stats(),

  update: async (id: string, data: { status: string }) => {
    await firestoreGuests.updateStatus(id, data.status);
    return { id, ...data };
  },
};

// Invoices — Express backend
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

// Reports — Express backend
export const reportsApi = {
  get: () => request<any>('/reports'),
};

// Properties — Express backend
export const propertiesApi = {
  list: () => request<any[]>('/properties'),
  get: (id: string) => request<any>(`/properties/${id}`),
  checkAvailability: (id: string, checkIn: string, checkOut: string) =>
    request<{ available: boolean }>(`/properties/${id}/availability?check_in=${checkIn}&check_out=${checkOut}`),
};

// Transactions — Firestore
export const transactionsApi = {
  list: (limit?: number) => firestoreTransactions.list(limit) as Promise<any[]>,
};

// Testimonials — Firestore
export const testimonialsApi = {
  create: (data: { guest_name: string; guest_phone: string; property_name: string; rating: number; text: string; stay_details: string }) =>
    firestoreTestimonials.create(data),
  list: () => firestoreTestimonials.list(),
};

// Notifications — Firestore
export const notificationsApi = {
  list: () => firestoreNotifications.list(),
  markRead: (id: string) => firestoreNotifications.markRead(id),
  markAllRead: () => firestoreNotifications.markAllRead(),
};
