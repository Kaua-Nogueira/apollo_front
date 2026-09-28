const BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

export class ApiError extends Error {
  status: number
  errors?: Record<string, string[]>
  constructor(message: string, status: number, errors?: Record<string, string[]>) { super(message); this.status = status; this.errors = errors }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('apollo.token')
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
  })
  const body = await response.json().catch(() => ({}))
  if (response.status === 401) {
    localStorage.removeItem('apollo.token')
    localStorage.removeItem('apollo.user')
    window.dispatchEvent(new Event('apollo:unauthorized'))
  }
  if (!response.ok) throw new ApiError(body.message ?? 'Não foi possível concluir a operação.', response.status, body.errors)
  return body.data ?? body
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  upload: async <T>(path: string, form: FormData) => {
    const token = localStorage.getItem('apollo.token')
    const response = await fetch(`${BASE_URL}${path}`, { method: 'POST', body: form, headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) } })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) throw new ApiError(body.message ?? 'Não foi possível enviar o arquivo.', response.status, body.errors)
    return (body.data ?? body) as T
  },
}

