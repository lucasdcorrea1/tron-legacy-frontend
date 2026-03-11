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

// ── Refresh-token deduplication ──────────────────────────────────────
// Only one refresh request flies at a time; concurrent callers queue behind it.
let refreshPromise = null;

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) throw new Error('No refresh token');

    const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) throw new Error('Refresh failed');

    const data = await res.json();
    // Persist the new pair
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

function forceLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  localStorage.removeItem('profile');
  window.location.href = '/login';
}

// ── Core JSON request helper with 401 retry ──────────────────────────
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

  let response = await fetch(`${API_URL}${endpoint}`, config);

  // On 401, attempt a silent refresh then retry once
  if (response.status === 401 && localStorage.getItem('refreshToken')) {
    try {
      await refreshAccessToken();
      const newToken = localStorage.getItem('token');
      config.headers = { ...config.headers, Authorization: `Bearer ${newToken}` };
      response = await fetch(`${API_URL}${endpoint}`, config);
    } catch {
      forceLogout();
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

// ── fetchWithAuth: for non-JSON requests (file uploads, etc.) ────────
// Returns the raw Response so callers can handle status codes themselves.
async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { ...(token && { Authorization: `Bearer ${token}` }), ...options.headers };

  let response = await fetch(url, { ...options, headers });

  if (response.status === 401 && localStorage.getItem('refreshToken')) {
    try {
      await refreshAccessToken();
      const newToken = localStorage.getItem('token');
      headers.Authorization = `Bearer ${newToken}`;
      response = await fetch(url, { ...options, headers });
    } catch {
      forceLogout();
      throw new Error('Sessão expirada');
    }
  }

  return response;
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

    try {
      const response = await fetchWithAuth(`${API_URL}/api/v1/blog/upload`, {
        method: 'POST',
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
    try {
      await fetchWithAuth(`${API_URL}/api/v1/blog/posts/${slug}/view`, {
        method: 'POST',
      });
    } catch {
      // Fire and forget - don't throw errors
    }
  },

  getStats: async (slug) => {
    const response = await fetchWithAuth(`${API_URL}/api/v1/blog/posts/${slug}/stats`, {});
    if (!response.ok) throw new Error('Erro ao carregar estatísticas');
    return response.json();
  },

  toggleLike: async (slug) => {
    if (!localStorage.getItem('token')) throw new Error('Faça login para curtir');
    const response = await fetchWithAuth(`${API_URL}/api/v1/blog/posts/${slug}/like`, {
      method: 'POST',
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
    if (!localStorage.getItem('token')) throw new Error('Faça login para comentar');
    const response = await fetchWithAuth(`${API_URL}/api/v1/blog/posts/${slug}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (response.status === 401) throw new Error('Faça login para comentar');
    if (response.status === 400) throw new Error('Comentário inválido (1-2000 caracteres)');
    if (!response.ok) throw new Error('Erro ao enviar comentário');
    return response.json();
  },

  trackCTAClick: async (slug, cta) => {
    try {
      await fetch(`${API_URL}/api/v1/blog/posts/${slug}/cta-click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cta }),
      });
    } catch {
      // Fire and forget
    }
  },

  deleteComment: async (slug, commentId) => {
    if (!localStorage.getItem('token')) throw new Error('Não autorizado');
    const response = await fetchWithAuth(`${API_URL}/api/v1/blog/posts/${slug}/comments/${commentId}`, {
      method: 'DELETE',
    });
    if (response.status === 403) throw new Error('Sem permissão para deletar');
    if (!response.ok) throw new Error('Erro ao deletar comentário');
    return response.json();
  },
};

export const ctaAnalytics = {
  get: (days = 30) => api.get(`/api/v1/admin/cta-analytics?days=${days}`),
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

export const platform = {
  orgsWithMembers: () => api.get('/api/v1/platform/orgs-with-members'),
};

export const auth = {
  login: (credentials) => api.post('/api/v1/auth/login', credentials),
  register: (data) => api.post('/api/v1/auth/register', data),
  me: () => api.get('/api/v1/auth/me'),
  refresh: () => refreshAccessToken(),
  logout: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    // Best-effort server-side invalidation
    if (refreshToken) {
      try {
        await fetch(`${API_URL}/api/v1/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      } catch {
        // Ignore network errors on logout
      }
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('profile');
  },
  getToken: () => localStorage.getItem('token'),
  getRefreshToken: () => localStorage.getItem('refreshToken'),
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

export const metaOAuth = {
  getOAuthURL: (orgId) => api.get(`/api/v1/auth/meta/url?org_id=${orgId}`),
  exchangeCode: (code, orgId) => api.post('/api/v1/auth/meta/callback', { code, org_id: orgId }),
};

export const instagram = {
  getConfig: () => api.get('/api/v1/admin/instagram/config'),
  saveConfig: (data) => api.put('/api/v1/admin/instagram/config', data),
  deleteConfig: () => api.delete('/api/v1/admin/instagram/config'),
  listAccounts: () => api.get('/api/v1/admin/instagram/accounts'),
  testConnection: (igAccountId) => {
    const params = igAccountId ? `?instagram_account_id=${igAccountId}` : '';
    return api.get(`/api/v1/admin/instagram/test${params}`);
  },
  getFeed: (limit = 12, igAccountId) => {
    const query = new URLSearchParams();
    query.append('limit', limit);
    if (igAccountId) query.append('instagram_account_id', igAccountId);
    return api.get(`/api/v1/admin/instagram/feed?${query.toString()}`);
  },
  list: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.status) query.append('status', params.status);
    const queryString = query.toString();
    return api.get(`/api/v1/admin/instagram/schedules${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id) => api.get(`/api/v1/admin/instagram/schedules/${id}`),
  create: (data) => api.post('/api/v1/admin/instagram/schedules', data),
  update: (id, data) => api.put(`/api/v1/admin/instagram/schedules/${id}`, data),
  delete: (id) => api.delete(`/api/v1/admin/instagram/schedules/${id}`),
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetchWithAuth(`${API_URL}/api/v1/admin/instagram/upload`, {
        method: 'POST',
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
};

export const instagramAutoReply = {
  listRules: () => api.get('/api/v1/admin/instagram/autoreply/rules'),
  createRule: (data) => api.post('/api/v1/admin/instagram/autoreply/rules', data),
  updateRule: (id, data) => api.put(`/api/v1/admin/instagram/autoreply/rules/${id}`, data),
  toggleRule: (id) => request(`/api/v1/admin/instagram/autoreply/rules/${id}`, { method: 'PATCH' }),
  deleteRule: (id) => api.delete(`/api/v1/admin/instagram/autoreply/rules/${id}`),
  listLogs: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.status) query.append('status', params.status);
    if (params.rule_id) query.append('rule_id', params.rule_id);
    if (params.trigger_type) query.append('trigger_type', params.trigger_type);
    const queryString = query.toString();
    return api.get(`/api/v1/admin/instagram/autoreply/logs${queryString ? `?${queryString}` : ''}`);
  },
};

export const instagramLeads = {
  list: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.search) query.append('search', params.search);
    if (params.tag) query.append('tag', params.tag);
    if (params.source) query.append('source', params.source);
    const queryString = query.toString();
    return api.get(`/api/v1/admin/instagram/leads${queryString ? `?${queryString}` : ''}`);
  },
  updateTags: (id, tags) => api.put(`/api/v1/admin/instagram/leads/${id}/tags`, { tags }),
  exportCSV: async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/v1/admin/instagram/leads/export`, {
      headers: { ...(token && { Authorization: `Bearer ${token}` }) },
    });
    if (!response.ok) throw new Error('Erro ao exportar');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `instagram_leads_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  },
  stats: () => api.get('/api/v1/admin/instagram/leads/stats'),
};

export const instagramAnalytics = {
  autoreply: (days = 30) => api.get(`/api/v1/admin/instagram/analytics/autoreply?days=${days}`),
  engagement: (igAccountId) => {
    const params = igAccountId ? `?instagram_account_id=${igAccountId}` : '';
    return api.get(`/api/v1/admin/instagram/analytics/engagement${params}`);
  },
};

export const metaAds = {
  // Ad Accounts
  listAdAccounts: () => api.get('/api/v1/admin/meta-ads/accounts'),

  // Campaigns
  listCampaigns: (params = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.ad_account_id) query.append('ad_account_id', params.ad_account_id);
    const qs = query.toString();
    return api.get(`/api/v1/admin/meta-ads/campaigns${qs ? `?${qs}` : ''}`);
  },
  getCampaign: (id) => api.get(`/api/v1/admin/meta-ads/campaigns/${id}`),
  createCampaign: (data) => api.post('/api/v1/admin/meta-ads/campaigns', data),
  updateCampaign: (id, data) => api.put(`/api/v1/admin/meta-ads/campaigns/${id}`, data),
  deleteCampaign: (id) => api.delete(`/api/v1/admin/meta-ads/campaigns/${id}`),
  updateCampaignStatus: (id, status) => request(`/api/v1/admin/meta-ads/campaigns/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),

  // Ad Sets
  listAdSets: (params = {}) => {
    const query = new URLSearchParams();
    if (params.campaign_id) query.append('campaign_id', params.campaign_id);
    if (params.ad_account_id) query.append('ad_account_id', params.ad_account_id);
    const qs = query.toString();
    return api.get(`/api/v1/admin/meta-ads/adsets${qs ? `?${qs}` : ''}`);
  },
  getAdSet: (id) => api.get(`/api/v1/admin/meta-ads/adsets/${id}`),
  createAdSet: (data) => api.post('/api/v1/admin/meta-ads/adsets', data),
  updateAdSet: (id, data) => api.put(`/api/v1/admin/meta-ads/adsets/${id}`, data),
  deleteAdSet: (id) => api.delete(`/api/v1/admin/meta-ads/adsets/${id}`),
  updateAdSetStatus: (id, status) => request(`/api/v1/admin/meta-ads/adsets/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),

  // Ads
  listAds: (params = {}) => {
    const query = new URLSearchParams();
    if (params.adset_id) query.append('adset_id', params.adset_id);
    if (params.ad_account_id) query.append('ad_account_id', params.ad_account_id);
    const qs = query.toString();
    return api.get(`/api/v1/admin/meta-ads/ads${qs ? `?${qs}` : ''}`);
  },
  getAd: (id) => api.get(`/api/v1/admin/meta-ads/ads/${id}`),
  createAd: (data) => api.post('/api/v1/admin/meta-ads/ads', data),
  updateAd: (id, data) => api.put(`/api/v1/admin/meta-ads/ads/${id}`, data),
  deleteAd: (id) => api.delete(`/api/v1/admin/meta-ads/ads/${id}`),
  updateAdStatus: (id, status) => request(`/api/v1/admin/meta-ads/ads/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),

  // Insights
  getInsights: (params = {}) => {
    const query = new URLSearchParams();
    if (params.level) query.append('level', params.level);
    if (params.date_start) query.append('date_start', params.date_start);
    if (params.date_stop) query.append('date_stop', params.date_stop);
    if (params.time_increment) query.append('time_increment', params.time_increment);
    if (params.ad_account_id) query.append('ad_account_id', params.ad_account_id);
    const qs = query.toString();
    return api.get(`/api/v1/admin/meta-ads/insights${qs ? `?${qs}` : ''}`);
  },
  getCampaignInsights: (id, params = {}) => {
    const query = new URLSearchParams();
    if (params.date_start) query.append('date_start', params.date_start);
    if (params.date_stop) query.append('date_stop', params.date_stop);
    if (params.ad_account_id) query.append('ad_account_id', params.ad_account_id);
    const qs = query.toString();
    return api.get(`/api/v1/admin/meta-ads/campaigns/${id}/insights${qs ? `?${qs}` : ''}`);
  },

  // Upload
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await fetchWithAuth(`${API_URL}/api/v1/admin/meta-ads/upload/image`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `Erro no upload (${response.status})`);
    }
    return response.json();
  },
  uploadVideo: async (file, title) => {
    const formData = new FormData();
    formData.append('video', file);
    if (title) formData.append('title', title);
    const response = await fetchWithAuth(`${API_URL}/api/v1/admin/meta-ads/upload/video`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `Erro no upload (${response.status})`);
    }
    return response.json();
  },

  // Targeting
  searchInterests: (q) => api.get(`/api/v1/admin/meta-ads/targeting/interests?q=${encodeURIComponent(q)}`),
  searchLocations: (q) => api.get(`/api/v1/admin/meta-ads/targeting/locations?q=${encodeURIComponent(q)}`),
  listAudiences: (params = {}) => {
    const query = new URLSearchParams();
    if (params.ad_account_id) query.append('ad_account_id', params.ad_account_id);
    const qs = query.toString();
    return api.get(`/api/v1/admin/meta-ads/targeting/audiences${qs ? `?${qs}` : ''}`);
  },

  // Presets
  listPresets: () => api.get('/api/v1/admin/meta-ads/presets'),
  createPreset: (data) => api.post('/api/v1/admin/meta-ads/presets', data),
  deletePreset: (id) => api.delete(`/api/v1/admin/meta-ads/presets/${id}`),

  // Templates
  listTemplates: () => api.get('/api/v1/admin/meta-ads/templates'),
  createTemplate: (data) => api.post('/api/v1/admin/meta-ads/templates', data),
  deleteTemplate: (id) => api.delete(`/api/v1/admin/meta-ads/templates/${id}`),

  // Account Finance
  getAccountFinance: (params = {}) => {
    const query = new URLSearchParams();
    if (params.ad_account_id) query.append('ad_account_id', params.ad_account_id);
    const qs = query.toString();
    return api.get(`/api/v1/admin/meta-ads/account/finance${qs ? `?${qs}` : ''}`);
  },

  // Account Recommendations (opportunity score)
  getAccountRecommendations: (params = {}) => {
    const query = new URLSearchParams();
    if (params.ad_account_id) query.append('ad_account_id', params.ad_account_id);
    const qs = query.toString();
    return api.get(`/api/v1/admin/meta-ads/account/recommendations${qs ? `?${qs}` : ''}`);
  },

  // Budget Alerts
  listAlerts: () => api.get('/api/v1/admin/meta-ads/alerts'),
  createAlert: (data) => api.post('/api/v1/admin/meta-ads/alerts', data),
  updateAlert: (id, data) => api.put(`/api/v1/admin/meta-ads/alerts/${id}`, data),
  deleteAlert: (id) => api.delete(`/api/v1/admin/meta-ads/alerts/${id}`),
};

export const integratedPublish = {
  list: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.status) query.append('status', params.status);
    const qs = query.toString();
    return api.get(`/api/v1/admin/integrated-publish${qs ? `?${qs}` : ''}`);
  },
  getById: (id) => api.get(`/api/v1/admin/integrated-publish/${id}`),
  create: (data) => api.post('/api/v1/admin/integrated-publish', data),
  update: (id, data) => api.put(`/api/v1/admin/integrated-publish/${id}`, data),
  delete: (id) => api.delete(`/api/v1/admin/integrated-publish/${id}`),
};

export const ai = {
  getConfig: () => api.get('/api/v1/admin/ai/config'),
  saveConfig: (data) => api.put('/api/v1/admin/ai/config', data),
  deleteConfig: () => api.delete('/api/v1/admin/ai/config'),
  generate: (data) => api.post('/api/v1/admin/ai/generate', data),
};

export const autoBoost = {
  // Rules
  listRules: () => api.get('/api/v1/admin/auto-boost/rules'),
  getRule: (id) => api.get(`/api/v1/admin/auto-boost/rules/${id}`),
  createRule: (data) => api.post('/api/v1/admin/auto-boost/rules', data),
  updateRule: (id, data) => api.put(`/api/v1/admin/auto-boost/rules/${id}`, data),
  toggleRule: (id, active) => request(`/api/v1/admin/auto-boost/rules/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ active }),
  }),
  deleteRule: (id) => api.delete(`/api/v1/admin/auto-boost/rules/${id}`),

  // Logs
  listLogs: (params = {}) => {
    const query = new URLSearchParams();
    if (params.rule_id) query.append('rule_id', params.rule_id);
    if (params.status) query.append('status', params.status);
    if (params.limit) query.append('limit', params.limit);
    const qs = query.toString();
    return api.get(`/api/v1/admin/auto-boost/logs${qs ? `?${qs}` : ''}`);
  },
};

// ── Organizations ──────────────────────────────────────────────────
export const orgs = {
  create: (data) => api.post('/api/v1/orgs', data),
  list: () => api.get('/api/v1/orgs'),
  getCurrent: () => api.get('/api/v1/orgs/current'),
  update: (data) => api.put('/api/v1/orgs/current', data),
  delete: () => api.delete('/api/v1/orgs/current'),
  switch: async (orgId) => {
    const data = await api.post(`/api/v1/orgs/switch/${orgId}`);
    // Switch returns a new JWT with the org_id embedded
    if (data.token) localStorage.setItem('token', data.token);
    if (data.refresh_token) localStorage.setItem('refreshToken', data.refresh_token);
    return data;
  },

  // Members
  listMembers: () => api.get('/api/v1/orgs/current/members'),
  inviteMember: (data) => api.post('/api/v1/orgs/current/invitations', data),
  updateMemberRole: (uid, role) => api.put(`/api/v1/orgs/current/members/${uid}/role`, { org_role: role }),
  updateMemberPermissions: (uid, permissions) => api.put(`/api/v1/orgs/current/members/${uid}/permissions`, { permissions }),
  removeMember: (uid) => api.delete(`/api/v1/orgs/current/members/${uid}`),
  myInvitations: () => api.get('/api/v1/invitations/mine'),
  acceptInvitation: (id) => api.post(`/api/v1/invitations/${id}/accept`),
};

// ── Subscription ───────────────────────────────────────────────────
export const subscription = {
  get: () => api.get('/api/v1/orgs/current/subscription'),
  getUsage: () => api.get('/api/v1/orgs/current/usage'),
  checkout: (data) => api.post('/api/v1/orgs/current/subscription/checkout', data),
  cancel: () => api.post('/api/v1/orgs/current/subscription/cancel'),
};

export const profile = {
  get: () => api.get('/api/v1/profile'),
  update: (data) => api.put('/api/v1/profile', data),
  updateSettings: (settings) => api.put('/api/v1/profile/settings', settings),
  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await fetchWithAuth(`${API_URL}/api/v1/profile/avatar`, {
        method: 'POST',
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
  uploadCoverImage: async (file) => {
    const formData = new FormData();
    formData.append('cover_image', file);

    try {
      const response = await fetchWithAuth(`${API_URL}/api/v1/profile/cover-image`, {
        method: 'POST',
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
};
