const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface FetchOptions extends RequestInit {
  token?: string;
}

export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { token, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((customHeaders as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    headers,
    ...rest,
  });

  const data = await res.json();

  if (!data.success) {
    throw new ApiError(data.error.code, data.error.message, res.status);
  }

  return data;
}

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ─── Auth ─────────────────────────────────────
export async function devLogin(email: string) {
  return apiFetch<{ success: true; data: { token: string; user: any } }>(
    '/api/auth/dev-login',
    { method: 'POST', body: JSON.stringify({ email }) },
  );
}

export async function login(email: string, password: string) {
  return apiFetch<{ success: true; data: { token: string; user: any } }>(
    '/api/auth/login',
    { method: 'POST', body: JSON.stringify({ email, password }) },
  );
}

export async function register(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  serviceAddress: string;
}) {
  return apiFetch<{ success: true; data: { token: string; user: any } }>(
    '/api/auth/register',
    { method: 'POST', body: JSON.stringify(data) },
  );
}

export async function getMe(token: string) {
  return apiFetch<{ success: true; data: any }>('/api/auth/me', { token });
}

// ─── Accounts ─────────────────────────────────
export async function getAccount(id: string, token: string) {
  return apiFetch<{ success: true; data: any }>(`/api/accounts/${id}`, { token });
}

// ─── Billing ──────────────────────────────────
export async function getAccountBilling(accountId: string, token: string, cursor?: string) {
  const params = cursor ? `?cursor=${cursor}` : '';
  return apiFetch<any>(`/api/accounts/${accountId}/billing${params}`, { token });
}

export async function payBill(billingId: string, method: string, idempotencyKey: string, token: string) {
  return apiFetch<any>(`/api/billing/${billingId}/pay`, {
    method: 'POST',
    body: JSON.stringify({ method, idempotencyKey }),
    token,
  });
}

// ─── Usage ────────────────────────────────────
export async function getUsageSummary(accountId: string, token: string) {
  return apiFetch<any>(`/api/accounts/${accountId}/usage/summary`, { token });
}

export async function getUsageAnalytics(accountId: string, token: string) {
  return apiFetch<any>(`/api/accounts/${accountId}/usage/analytics`, { token });
}

// ─── Notifications ────────────────────────────
export async function getNotifications(accountId: string, token: string, cursor?: string) {
  const params = cursor ? `?cursor=${cursor}` : '';
  return apiFetch<any>(`/api/accounts/${accountId}/notifications${params}`, { token });
}

export async function markNotificationRead(notificationId: string, token: string) {
  return apiFetch<any>(`/api/notifications/${notificationId}/read`, {
    method: 'PATCH',
    token,
  });
}

export async function markAllNotificationsRead(accountId: string, token: string) {
  return apiFetch<any>(`/api/accounts/${accountId}/notifications/read-all`, {
    method: 'POST',
    token,
  });
}

// ─── Outages ──────────────────────────────────
export async function getActiveOutages(token: string) {
  return apiFetch<any>('/api/outages/active', { token });
}

export async function getOutages(token: string, cursor?: string) {
  const params = cursor ? `?cursor=${cursor}` : '';
  return apiFetch<any>(`/api/outages${params}`, { token });
}
