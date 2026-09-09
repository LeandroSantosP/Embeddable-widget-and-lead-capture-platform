export type WidgetType = 'signup' | 'popover';

export interface Widget {
  id: string;
  title: string;
  type: WidgetType;
  settings: Record<string, unknown>;
  embed_snippet: string;
  created_at?: string;
  updated_at?: string;
}

export interface Submission {
  id: string;
  widget_id: string;
  data: Record<string, unknown>;
  ip_address?: string;
  geo_data?: { country?: string; city?: string; [key: string]: unknown } | null;
  created_at?: string;
}

export interface Stats {
  total_submissions: number;
  locations: Array<{ country?: string; city?: string; count: number }>;
}

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function translateApiError(message: string) {
  const messages: Record<string, string> = {
    'Invalid credentials': 'E-mail ou senha inválidos.',
    'Email already registered': 'Este e-mail já está cadastrado.',
    'Validation failed': 'Confira os dados informados.',
    'Widget not found': 'Widget não encontrado.',
    'Invalid or expired token': 'Sua sessão expirou. Entre novamente.'
  };
  return messages[message] || message;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = sessionStorage.getItem('flyrank_token');
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });
  const body = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = translateApiError(body?.error || `Falha na requisição (${response.status})`);
    throw new ApiError(message, response.status);
  }
  return body as T;
}

export const api = {
  async login(email: string, password: string) {
    return request<{ token: string; expires_in: string }>('/api/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password })
    });
  },
  async register(email: string, password: string) {
    return request<{ id: string; email: string }>('/api/auth/register', {
      method: 'POST', body: JSON.stringify({ email, password })
    });
  },
  listWidgets: () => request<Widget[]>('/api/widgets'),
  createWidget: (payload: Pick<Widget, 'title' | 'type' | 'settings'>) => request<Widget>('/api/widgets', {
    method: 'POST', body: JSON.stringify(payload)
  }),
  updateWidget: (id: string, payload: Partial<Pick<Widget, 'title' | 'type' | 'settings'>>) => request<Widget>(`/api/widgets/${id}`, {
    method: 'PUT', body: JSON.stringify(payload)
  }),
  deleteWidget: (id: string) => request<void>(`/api/widgets/${id}`, { method: 'DELETE' }),
  listSubmissions: (id: string) => request<Submission[]>(`/api/widgets/${id}/submissions`),
  getStats: (id: string) => request<Stats>(`/api/widgets/${id}/stats`)
};
