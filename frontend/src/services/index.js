import apiClient from '../api/client';

export const authService = {
  signup: (payload, config) => apiClient.post('/auth/signup', payload, config),
  login: (payload, config) => apiClient.post('/auth/login', payload, config),
  me: (config) => apiClient.get('/auth/me', config),
};

export const taskService = {
  list: (params, config) => apiClient.get('/tasks', { ...config, params }),
  stats: (config) => apiClient.get('/tasks/stats', config),
  create: (payload, config) => apiClient.post('/tasks', payload, config),
  update: (id, payload, config) => apiClient.patch(`/tasks/${id}`, payload, config),
  toggle: (id, config) => apiClient.post(`/tasks/${id}/toggle`, {}, config),
  remove: (id, config) => apiClient.delete(`/tasks/${id}`, config),
};