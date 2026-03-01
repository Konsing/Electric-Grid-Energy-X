const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

interface FetchOptions extends RequestInit {
  token?: string;
}

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { token, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((customHeaders as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { headers, ...rest });
  const data = await res.json();

  if (!data.success) {
    throw new Error(data.error?.message || 'Request failed');
  }

  return data;
}

// Auth
export const devLogin = (email: string) =>
  apiFetch<any>('/api/auth/dev-login', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });

export const login = (email: string, password: string) =>
  apiFetch<any>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

export const getMe = (token: string) =>
  apiFetch<any>('/api/auth/me', { token });

// Usage
export const getUsageSummary = (accountId: string, token: string) =>
  apiFetch<any>(`/api/accounts/${accountId}/usage/summary`, { token });

export const getUsageAnalytics = (accountId: string, token: string) =>
  apiFetch<any>(`/api/accounts/${accountId}/usage/analytics`, { token });

// Billing
export const getAccountBilling = (accountId: string, token: string) =>
  apiFetch<any>(`/api/accounts/${accountId}/billing`, { token });

// Notifications
export const getNotifications = (accountId: string, token: string) =>
  apiFetch<any>(`/api/accounts/${accountId}/notifications`, { token });

export const markAllRead = (accountId: string, token: string) =>
  apiFetch<any>(`/api/accounts/${accountId}/notifications/read-all`, {
    method: 'POST',
    token,
  });

// Outages
export const getActiveOutages = (token: string) =>
  apiFetch<any>('/api/outages/active', { token });

// Account
export const getAccount = (accountId: string, token: string) =>
  apiFetch<any>(`/api/accounts/${accountId}`, { token });

// Subscribe to push notifications
export const subscribePush = (accountId: string, fcmToken: string, token: string) =>
  apiFetch<any>(`/api/accounts/${accountId}/notifications/subscribe`, {
    method: 'POST',
    body: JSON.stringify({ fcmToken }),
    token,
  });

// ─── Accounts (admin) ────────────────────────
export const listAccounts = (token: string) =>
  apiFetch<any>('/api/accounts', { token });

export const updateAccountStatus = (accountId: string, status: string, token: string) =>
  apiFetch<any>(`/api/accounts/${accountId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
    token,
  });

export const deleteAccount = (accountId: string, token: string) =>
  apiFetch<any>(`/api/accounts/${accountId}`, { method: 'DELETE', token });

// ─── Outages (admin/tech) ────────────────────
export const getOutages = (token: string) =>
  apiFetch<any>('/api/outages', { token });

export const createOutage = (data: any, token: string) =>
  apiFetch<any>('/api/outages', {
    method: 'POST',
    body: JSON.stringify(data),
    token,
  });

export const resolveOutage = (id: string, token: string) =>
  apiFetch<any>(`/api/outages/${id}/resolve`, { method: 'POST', token });

// ─── Meters (admin/tech) ─────────────────────
export const getAccountMeters = (accountId: string, token: string) =>
  apiFetch<any>(`/api/accounts/${accountId}/meters`, { token });

export const createMeter = (accountId: string, data: any, token: string) =>
  apiFetch<any>(`/api/accounts/${accountId}/meters`, {
    method: 'POST',
    body: JSON.stringify(data),
    token,
  });

export const updateMeter = (meterId: string, data: any, token: string) =>
  apiFetch<any>(`/api/meters/${meterId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    token,
  });
