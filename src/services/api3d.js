export const API_3D_URL = import.meta.env.VITE_3D_API_URL || 'http://localhost:8090';

// ── Core request helper with 401 retry (reuses main app JWT) ──────

let refreshPromise = null;

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;

  // Delegate to the main backend's refresh endpoint
  const { API_URL } = await import('./api.js');
  const mainURL = API_URL;

  refreshPromise = (async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) throw new Error('No refresh token');

    const res = await fetch(`${mainURL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) throw new Error('Refresh failed');

    const data = await res.json();
    if (data.token) localStorage.setItem('token', data.token);
    if (data.refresh_token) localStorage.setItem('refreshToken', data.refresh_token);
    if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
    if (data.profile) localStorage.setItem('profile', JSON.stringify(data.profile));
    return data;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

async function request3d(endpoint, options = {}) {
  const token = localStorage.getItem('token');

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  let response = await fetch(`${API_3D_URL}${endpoint}`, config);

  // On 401, attempt a silent refresh then retry once
  if (response.status === 401 && localStorage.getItem('refreshToken')) {
    try {
      await refreshAccessToken();
      const newToken = localStorage.getItem('token');
      config.headers = { ...config.headers, Authorization: `Bearer ${newToken}` };
      response = await fetch(`${API_3D_URL}${endpoint}`, config);
    } catch {
      // Don't force logout here — main app handles that
      throw new Error('Sessão expirada');
    }
  }

  if (!response.ok) {
    const text = await response.text();
    let message;
    try {
      const parsed = JSON.parse(text);
      message = parsed.message;
    } catch {
      message = text || `Erro ${response.status}`;
    }
    throw new Error(message || `Erro na requisição (${response.status})`);
  }

  return response.json();
}

const api3d = {
  get: (endpoint) => request3d(endpoint, { method: 'GET' }),
  post: (endpoint, data) => request3d(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  put: (endpoint, data) => request3d(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (endpoint) => request3d(endpoint, { method: 'DELETE' }),
};

// ── Public endpoints ────────────────────────────────────────────────

export const products3d = {
  list: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.category_id) query.append('category_id', params.category_id);
    if (params.featured) query.append('featured', 'true');
    if (params.search) query.append('search', params.search);
    const qs = query.toString();
    return api3d.get(`/api/v1/products${qs ? `?${qs}` : ''}`);
  },
  getBySlug: (slug) => api3d.get(`/api/v1/products/${slug}`),
};

export const categories3d = {
  list: () => api3d.get('/api/v1/categories'),
};

// ── Auth-required endpoints ──────────────────────────────────────────

export const orders3d = {
  create: (data) => api3d.post('/api/v1/orders', data),
  list: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    const qs = query.toString();
    return api3d.get(`/api/v1/orders${qs ? `?${qs}` : ''}`);
  },
  getById: (id) => api3d.get(`/api/v1/orders/${id}`),
};

// ── Admin endpoints ──────────────────────────────────────────────────

export const admin3d = {
  products: {
    list: (params = {}) => {
      const query = new URLSearchParams();
      if (params.page) query.append('page', params.page);
      if (params.limit) query.append('limit', params.limit);
      if (params.category_id) query.append('category_id', params.category_id);
      if (params.active !== undefined) query.append('active', params.active);
      if (params.search) query.append('search', params.search);
      const qs = query.toString();
      return api3d.get(`/api/v1/admin/products${qs ? `?${qs}` : ''}`);
    },
    create: (data) => api3d.post('/api/v1/admin/products', data),
    update: (id, data) => api3d.put(`/api/v1/admin/products/${id}`, data),
    delete: (id) => api3d.delete(`/api/v1/admin/products/${id}`),
  },
  categories: {
    create: (data) => api3d.post('/api/v1/admin/categories', data),
    update: (id, data) => api3d.put(`/api/v1/admin/categories/${id}`, data),
    delete: (id) => api3d.delete(`/api/v1/admin/categories/${id}`),
  },
  orders: {
    list: (params = {}) => {
      const query = new URLSearchParams();
      if (params.page) query.append('page', params.page);
      if (params.limit) query.append('limit', params.limit);
      if (params.status) query.append('status', params.status);
      if (params.payment_status) query.append('payment_status', params.payment_status);
      const qs = query.toString();
      return api3d.get(`/api/v1/admin/orders${qs ? `?${qs}` : ''}`);
    },
    updateStatus: (id, data) => api3d.put(`/api/v1/admin/orders/${id}/status`, data),
  },
  images: {
    upload: async (file) => {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch(`${API_3D_URL}/api/v1/admin/upload`, {
        method: 'POST',
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
        body: formData,
      });
      if (!res.ok) {
        const text = await res.text();
        let message;
        try { message = JSON.parse(text).message; } catch { message = text; }
        throw new Error(message || `Erro ${res.status}`);
      }
      return res.json();
    },
    deleteGroup: (groupId) => api3d.delete(`/api/v1/admin/images/${groupId}`),
  },
};

// Helper to resolve a group_id to a servable image URL
export function imageUrl(groupId, size = 'thumb') {
  if (!groupId) return '';
  return `${API_3D_URL}/api/v1/images/group/${groupId}?size=${size}`;
}
