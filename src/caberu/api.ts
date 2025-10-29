import { AnalyticsOverview, Appointment, Business, ChatResponse, Payment, Service, UserProfile } from './types';

const API_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' ? `${window.location.origin}/api` : 'http://localhost:4000/api');

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
};

const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'Request failed');
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
};

export const authApi = {
  login: (email: string, password: string) =>
    request<{ token: string; user: UserProfile; business?: { id: string; name: string; category: string } }>(
      '/auth/login',
      { method: 'POST', body: { email, password } }
    ),
  register: (payload: {
    name: string;
    email: string;
    password: string;
    role: 'client' | 'professional';
    businessName?: string;
    category?: string;
  }) =>
    request<{ token: string; user: UserProfile }>(
      '/auth/register',
      { method: 'POST', body: payload }
    ),
};

export const businessApi = {
  list: () => request<Business[]>('/businesses'),
};

export const serviceApi = {
  list: (businessId: string, token: string) => request<Service[]>(`/businesses/${businessId}/services`, { token }),
  create: (businessId: string, data: Partial<Service>, token: string) =>
    request<Service>(`/businesses/${businessId}/services`, {
      method: 'POST',
      body: data,
      token,
    }),
};

export const appointmentApi = {
  list: (scope: 'client' | 'professional' | 'all', token: string) =>
    request<Appointment[]>(`/appointments?scope=${scope}`, { token }),
  availability: (
    token: string,
    params: { professionalId: string; serviceId: string; date: string }
  ) =>
    request<{ slots: Array<{ startTime: string; endTime: string }> }>(
      `/appointments/availability?professionalId=${params.professionalId}&serviceId=${params.serviceId}&date=${params.date}`,
      { token }
    ),
  create: (
    token: string,
    payload: { clientId: string; professionalId: string; serviceId: string; startTime: string }
  ) =>
    request<{ appointment: Appointment; payment: Payment }>(`/appointments`, {
      method: 'POST',
      token,
      body: payload,
    }),
};

export const paymentApi = {
  list: (token: string) => request<Payment[]>('/payments', { token }),
  startCheckout: (token: string, appointmentId: string) =>
    request<{ sessionId: string; url: string; message?: string }>(`/payments/create-checkout-session`, {
      method: 'POST',
      token,
      body: { appointmentId },
    }),
};

export const chatApi = {
  converse: (
    token: string,
    payload: { message: string; context?: string; professionalId?: string; serviceId?: string; date?: string }
  ) => request<ChatResponse>('/chat', { method: 'POST', token, body: payload }),
};

export const analyticsApi = {
  overview: (token: string) => request<AnalyticsOverview>('/analytics/overview', { token }),
};

export const notificationApi = {
  list: (token: string) => request<Array<{ id: string; message: string; sendAt: string }>>('/notifications', { token }),
};
