export const API_URL = import.meta.env.VITE_API_URL || 'https://tron-legacy-api.onrender.com';

// Regex for 24-char hex string (MongoDB ObjectID / group_id)
const GROUP_ID_RE = /^[a-f0-9]{24}$/;

/**
 * Resolve an image URL with optional size variant.
 * - If url is a 24-char hex group_id, build /api/v1/blog/images/group/{id}?size=
 * - If url is a relative /api/... path, prepend API_URL
 * - If url is already absolute (http/data:), return as-is
 */
export function getImageUrl(url, size) {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:')) return url;

  // If it looks like a bare group_id, use the group endpoint
  if (GROUP_ID_RE.test(url)) {
    const sizeParam = size || 'card';
    return `${API_URL}/api/v1/blog/images/group/${url}?size=${sizeParam}`;
  }

  // Legacy relative path (e.g. /api/v1/blog/images/{objectId})
  return `${API_URL}${url}`;
}

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
  getById: (id) => api.get(`/api/v1/blog/posts/${id}`),
  getMyPost: (id) => api.get(`/api/v1/blog/posts/me/${id}`),
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

    try {
      const response = await fetch(`${API_URL}/api/v1/blog/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        if (response.status === 403) {
          const detail = err.current_role
            ? ` Sua role atual: "${err.current_role}". Necessário: "${err.required_roles || 'admin, author'}".`
            : '';
          throw new Error((err.message || 'Sem permissão para upload.') + detail);
        }
        throw new Error(err.message || `Erro no upload (${response.status})`);
      }

      return response.json();
    } catch (error) {
      if (error.name === 'TypeError') {
        throw new Error('Erro de conexão com o servidor');
      }
      throw error;
    }
  },

  // Engagement endpoints
  recordView: async (slug) => {
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      await fetch(`${API_URL}/api/v1/blog/posts/${slug}/view`, {
        method: 'POST',
        headers,
      });
    } catch {
      // Fire and forget - don't throw errors
    }
  },

  getStats: async (slug) => {
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await fetch(`${API_URL}/api/v1/blog/posts/${slug}/stats`, { headers });
    if (!response.ok) throw new Error('Erro ao carregar estatísticas');
    return response.json();
  },

  toggleLike: async (slug) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Faça login para curtir');
    const response = await fetch(`${API_URL}/api/v1/blog/posts/${slug}/like`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 401) throw new Error('Faça login para curtir');
    if (!response.ok) throw new Error('Erro ao processar like');
    return response.json();
  },

  getComments: async (slug, page = 1, limit = 20) => {
    const response = await fetch(
      `${API_URL}/api/v1/blog/posts/${slug}/comments?page=${page}&limit=${limit}`
    );
    if (!response.ok) throw new Error('Erro ao carregar comentários');
    return response.json();
  },

  createComment: async (slug, content) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Faça login para comentar');
    const response = await fetch(`${API_URL}/api/v1/blog/posts/${slug}/comments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });
    if (response.status === 401) throw new Error('Faça login para comentar');
    if (response.status === 400) throw new Error('Comentário inválido (1-2000 caracteres)');
    if (!response.ok) throw new Error('Erro ao enviar comentário');
    return response.json();
  },

  deleteComment: async (slug, commentId) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Não autorizado');
    const response = await fetch(`${API_URL}/api/v1/blog/posts/${slug}/comments/${commentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 403) throw new Error('Sem permissão para deletar');
    if (!response.ok) throw new Error('Erro ao deletar comentário');
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

export const emailMarketing = {
  listTemplates: () => api.get('/api/v1/admin/email-marketing/templates'),
  previewTemplate: (id, data) => api.post(`/api/v1/admin/email-marketing/templates/${id}/preview`, data),
  getAudience: () => api.get('/api/v1/admin/email-marketing/audience'),
  send: (data) => api.post('/api/v1/admin/email-marketing/send', data),
  listBroadcasts: () => api.get('/api/v1/admin/email-marketing/broadcasts'),
  getBroadcast: (id) => api.get(`/api/v1/admin/email-marketing/broadcasts/${id}`),
  listSubscribers: () => api.get('/api/v1/admin/email-marketing/subscribers'),
  deleteSubscriber: (id) => api.delete(`/api/v1/admin/email-marketing/subscribers/${id}`),
};

export const profile = {
  get: () => api.get('/api/v1/profile'),
  update: (data) => api.put('/api/v1/profile', data),
  updateSettings: (settings) => api.put('/api/v1/profile/settings', settings),
  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API_URL}/api/v1/profile/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `Erro no upload (${response.status})`);
      }

      return response.json();
    } catch (error) {
      if (error.name === 'TypeError') {
        throw new Error('Erro de conexão com o servidor');
      }
      throw error;
    }
  },
  removeAvatar: () => api.delete('/api/v1/profile/avatar'),
};
