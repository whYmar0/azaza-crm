import type {
  Client, Deal, Interaction, MatchItem, MatchResult,
  NearbyPlace, Notification, Property, Selection, SelectionFeedback, User,
} from '../types'

const BASE_URL = import.meta.env.VITE_API_URL || ''

function getToken(): string | null {
  return localStorage.getItem('hm_token')
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (res.status === 401) {
    localStorage.removeItem('hm_token')
    window.location.href = '/login'
    throw new Error('unauthorized')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || res.statusText)
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

export const authApi = {
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  me: () => request<User>('/api/v1/auth/me'),
  register: (data: { name: string; email: string; password: string; org_name?: string }) =>
    request<{ token: string; user: User }>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

export const clientsApi = {
  list: (params?: { status?: string; search?: string }) => {
    const q = new URLSearchParams()
    if (params?.status) q.set('status', params.status)
    if (params?.search) q.set('search', params.search)
    return request<Client[]>(`/api/v1/clients?${q}`)
  },
  get: (id: number) => request<Client>(`/api/v1/clients/${id}`),
  create: (data: Partial<Client>) =>
    request<Client>('/api/v1/clients', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Client>) =>
    request<Client>(`/api/v1/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => request<void>(`/api/v1/clients/${id}`, { method: 'DELETE' }),
  match: (id: number) => request<MatchItem[]>(`/api/v1/clients/${id}/match`),
  addInteraction: (id: number, data: Partial<Interaction>) =>
    request<Interaction>(`/api/v1/clients/${id}/interactions`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

export const propertiesApi = {
  list: (params?: { status?: string; rooms?: number; price_min?: number; price_max?: number; type?: string }) => {
    const q = new URLSearchParams()
    if (params?.status) q.set('status', params.status)
    if (params?.rooms) q.set('rooms', String(params.rooms))
    if (params?.type) q.set('type', params.type)
    if (params?.price_min) q.set('price_min', String(params.price_min))
    if (params?.price_max) q.set('price_max', String(params.price_max))
    return request<Property[]>(`/api/v1/properties?${q}`)
  },
  get: (id: number) => request<Property>(`/api/v1/properties/${id}`),
  create: (data: Partial<Property>) =>
    request<Property>('/api/v1/properties', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Property>) =>
    request<Property>(`/api/v1/properties/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => request<void>(`/api/v1/properties/${id}`, { method: 'DELETE' }),
  nearby: (id: number) => request<NearbyPlace[]>(`/api/v1/properties/${id}/nearby`),
  matchForClient: (id: number, clientId: number) =>
    request<MatchResult>(`/api/v1/properties/${id}/match/${clientId}`),
  uploadCover: (id: number, file: File) => {
    const token = getToken()
    const fd = new FormData()
    fd.append('cover', file)
    return fetch(`/api/v1/properties/${id}/cover`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    }).then(r => r.json()) as Promise<{ cover_url: string }>
  },
  uploadPhotos: (id: number, files: File[]) => {
    const token = getToken()
    const fd = new FormData()
    files.forEach(f => fd.append('photos', f))
    return fetch(`/api/v1/properties/${id}/photos`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    }).then(r => r.json()) as Promise<{ photos: string[] }>
  },
  deletePhoto: (id: number, url: string) =>
    request<{ photos: string[] }>(`/api/v1/properties/${id}/photos`, {
      method: 'DELETE',
      body: JSON.stringify({ url }),
    }),
  generateDescription: (id: number) =>
    request<{ description: string; tags: string[] }>(`/api/v1/properties/${id}/generate`, { method: 'POST' }),
  updateDescription: (id: number, data: { description: string; tags: string[] }) =>
    request<{ description: string; tags: string[] }>(`/api/v1/properties/${id}/description`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
}

export const dealsApi = {
  list: () => request<Deal[]>('/api/v1/deals'),
  get: (id: number) => request<Deal>(`/api/v1/deals/${id}`),
  create: (data: Partial<Deal>) =>
    request<Deal>('/api/v1/deals', { method: 'POST', body: JSON.stringify(data) }),
  updateStage: (id: number, stage: string) =>
    request<Deal>(`/api/v1/deals/${id}/stage`, { method: 'PUT', body: JSON.stringify({ stage }) }),
  delete: (id: number) => request<void>(`/api/v1/deals/${id}`, { method: 'DELETE' }),
}

export const selectionsApi = {
  list: () => request<Selection[]>('/api/v1/selections'),
  get: (id: number) => request<Selection>(`/api/v1/selections/${id}`),
  create: (data: { client_id: number; property_ids: number[] }) =>
    request<Selection>('/api/v1/selections', { method: 'POST', body: JSON.stringify(data) }),
}

export const instagramApi = {
  get: () => request<{ connected: boolean; username?: string; user_id?: string }>('/api/v1/instagram'),
  connect: (access_token: string) =>
    request<{ connected: boolean; username: string; user_id: string }>('/api/v1/instagram/connect', {
      method: 'POST', body: JSON.stringify({ access_token }),
    }),
  disconnect: () => request<{ connected: boolean }>('/api/v1/instagram/disconnect', { method: 'DELETE' }),
  stats: () => request<{ profile: Record<string, unknown>; media: Record<string, unknown>; username: string }>('/api/v1/instagram/stats'),
}

export const whatsappApi = {
  get: () => request<{ connected: boolean; display_phone?: string; verified_name?: string }>('/api/v1/whatsapp'),
  connect: (access_token: string, phone_number_id: string) =>
    request<{ connected: boolean; display_phone: string; verified_name: string }>('/api/v1/whatsapp/connect', {
      method: 'POST', body: JSON.stringify({ access_token, phone_number_id }),
    }),
  disconnect: () => request<{ connected: boolean }>('/api/v1/whatsapp/disconnect', { method: 'DELETE' }),
  sendTest: (to: string, message: string) =>
    request<{ sent: boolean }>('/api/v1/whatsapp/send', { method: 'POST', body: JSON.stringify({ to, message }) }),
}

export const notificationsApi = {
  list: () => request<Notification[]>('/api/v1/notifications'),
  markRead: (id: number) => request<void>(`/api/v1/notifications/${id}/read`, { method: 'PUT' }),
  markAllRead: () => request<void>('/api/v1/notifications/read-all', { method: 'PUT' }),
}

export const geoApi = {
  nearby: (lat: number, lng: number, radius = 800) =>
    request<NearbyPlace[]>(`/api/v1/geo/nearby?lat=${lat}&lng=${lng}&radius=${radius}`),
}

export const publicApi = {
  getSelection: (token: string) =>
    fetch(`${BASE_URL}/api/v1/public/selections/${token}`).then(r => r.json()) as Promise<{
      selection: Selection
      properties: Property[]
    }>,
  addFeedback: (token: string, data: { property_id: number; reaction: 'up' | 'down'; comment?: string }) =>
    fetch(`${BASE_URL}/api/v1/public/selections/${token}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json()) as Promise<SelectionFeedback>,
}
