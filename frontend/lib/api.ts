const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw Object.assign(new Error(err.error ?? 'Request failed'), { status: res.status })
  }

  return res.json()
}

// Auth
export const auth = {
  register: (data: { email: string; pseudo: string; password: string }) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  logout: () => request('/auth/logout', { method: 'POST' }),

  me: () => request('/me'),
}

// Session
export const session = {
  current: () => request('/session/current'),
}

// Posts
export const posts = {
  feed: (params?: { feed?: 'global' | 'following'; intention?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString()
    return request(`/posts${qs ? `?${qs}` : ''}`)
  },

  create: (data: { content: string; intention: string; privacy?: string; imageUrl?: string; allowedUserIds?: string[] }) =>
    request('/posts', { method: 'POST', body: JSON.stringify(data) }),

  delete: (id: string) => request(`/posts/${id}`, { method: 'DELETE' }),

  react: (id: string, type: string) =>
    request(`/posts/${id}/reactions`, { method: 'POST', body: JSON.stringify({ type }) }),

  comment: (id: string, content: string, imageUrl?: string) =>
    request(`/posts/${id}/comments`, { method: 'POST', body: JSON.stringify({ content, ...(imageUrl ? { imageUrl } : {}) }) }),

  comments: (id: string) => request(`/posts/${id}/comments`),

  report: (id: string, reason: string) =>
    request(`/posts/${id}/reports`, { method: 'POST', body: JSON.stringify({ reason }) }),
}

// Users
export const users = {
  profile: (pseudo: string) => request(`/users/${pseudo}`),

  search: (q: string) => request(`/users/search?q=${encodeURIComponent(q)}`),

  follow: (id: string) => request(`/users/${id}/follow`, { method: 'POST' }),

  unfollow: (id: string) => request(`/users/${id}/follow`, { method: 'DELETE' }),

  followers: (id: string) => request(`/users/${id}/followers`),

  following: (id: string) => request(`/users/${id}/following`),

  updateMe: (data: { pseudo?: string; avatarUrl?: string; bio?: string; isPrivate?: boolean }) =>
    request('/me', { method: 'PUT', body: JSON.stringify(data) }),

  deleteMe: () => request('/me', { method: 'DELETE' }),
}

// Follow requests
export const followRequests = {
  list: () => request<{ requests: import('@/types').FollowRequest[] }>('/follow-requests'),

  respond: (id: string, action: 'ACCEPT' | 'DECLINE') =>
    request(`/follow-requests/${id}`, { method: 'PUT', body: JSON.stringify({ action }) }),
}

// Admin
export const admin = {
  reports: (status?: string) => {
    const qs = status ? `?status=${encodeURIComponent(status)}` : ''
    return request(`/admin/reports${qs}`)
  },

  updateReport: (id: string, status: 'REVIEWED' | 'DISMISSED') =>
    request(`/admin/reports/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),

  suspendUser: (id: string) =>
    request(`/admin/users/${id}/suspend`, { method: 'PUT' }),
}

// Notifications
export const notifications = {
  list: () => request('/notifications'),
  markRead: (id: string) => request(`/notifications/${id}/read`, { method: 'PUT' }),
}
