export const API_URL = import.meta.env.VITE_API_URL;

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro de conexão' }));
    throw new Error(error.message || 'Erro na requisição');
  }

  return response.json();
}

export const api = {
  get: (endpoint) => request(endpoint, { method: 'GET' }),
  post: (endpoint, data) => request(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  put: (endpoint, data) => request(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
};

const safeJsonParse = (str) => {
  try {
    return str ? JSON.parse(str) : null;
  } catch {
    return null;
  }
};

export const blog = {
  list: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.category) query.append('category', params.category);
    if (params.tag) query.append('tag', params.tag);
    const queryString = query.toString();
    return api.get(`/api/v1/blog/posts${queryString ? `?${queryString}` : ''}`);
  },
  getBySlug: (slug) => api.get(`/api/v1/blog/posts/${slug}`),
  myPosts: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    const queryString = query.toString();
    return api.get(`/api/v1/blog/posts/me${queryString ? `?${queryString}` : ''}`);
  },
  create: (data) => api.post('/api/v1/blog/posts', data),
  update: (id, data) => api.put(`/api/v1/blog/posts/${id}`, data),
  delete: (id) => api.delete(`/api/v1/blog/posts/${id}`),
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/v1/blog/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'Erro no upload' }));
      throw new Error(err.message || 'Erro no upload');
    }
    return response.json();
  },
};

export const users = {
  list: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.search) query.append('search', params.search);
    if (params.role) query.append('role', params.role);
    const queryString = query.toString();
    return api.get(`/api/v1/users${queryString ? `?${queryString}` : ''}`);
  },
  updateRole: (id, role) => api.put(`/api/v1/users/${id}/role`, { role }),
};

export const auth = {
  login: (credentials) => api.post('/api/v1/auth/login', credentials),
  register: (data) => api.post('/api/v1/auth/register', data),
  me: () => api.get('/api/v1/auth/me'),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('profile');
  },
  getToken: () => localStorage.getItem('token'),
  getUser: () => safeJsonParse(localStorage.getItem('user')),
  getProfile: () => safeJsonParse(localStorage.getItem('profile')),
  isAuthenticated: () => !!localStorage.getItem('token'),
};
