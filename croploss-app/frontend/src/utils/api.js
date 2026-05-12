import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 120000, // 120s for large report fetches
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach JWT ───────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('croploss_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 ─────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('croploss_token');
      localStorage.removeItem('croploss_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
  updateProfile: (data) => api.put('/auth/update-profile', data),
};

// ── Users (Admin) ─────────────────────────────────────────────────────────
export const usersAPI = {
  list: (params) => api.get('/users', { params }),
  get: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  deactivate: (id) => api.delete(`/users/${id}`),
  cropHeads: (crop) => api.get(`/users/crop-heads/${crop}`),
};

// ── Crop Entries ──────────────────────────────────────────────────────────
export const entriesAPI = {
  list: (params) => api.get('/entries', { params }),
  get: (id) => api.get(`/entries/${id}`),
  create: (data) => api.post('/entries', data),
  update: (id, data) => api.put(`/entries/${id}`, data),
  delete: (id) => api.delete(`/entries/${id}`),

  // Workflow actions
  submit: (id) => api.post(`/entries/${id}/submit`),
  startReview: (id) => api.post(`/entries/${id}/start-review`),
  approve: (id, data) => api.post(`/entries/${id}/approve`, data),
  requestCorrection: (id, data) => api.post(`/entries/${id}/request-correction`, data),
  reject: (id, data) => api.post(`/entries/${id}/reject`, data),

  // Reports & exports
  dropdowns: () => api.get('/entries/dropdowns'),
  summary: (params) => api.get('/entries/reports/summary', { params }),
  exportExcel: (params) => api.get('/entries/reports/export', {
    params,
    responseType: 'blob',
  }),
};

export default api;
