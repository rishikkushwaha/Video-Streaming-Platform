import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
});

// Attach JWT token to every request if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('streamflix_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  verifyEmail: (data) => api.post('/auth/verify-email', data),
};

// Videos API
export const videosAPI = {
  getAll: (params) => api.get('/videos', { params }),
  getById: (id) => api.get(`/videos/${id}`),
  upload: (formData) =>
    api.post('/videos/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  incrementView: (id) => api.put(`/videos/${id}/view`),
  likeVideo: (id) => api.put(`/videos/${id}/like`),
  updateVideo: (id, data) => api.put(`/videos/${id}`, data),
  deleteVideo: (id) => api.delete(`/videos/${id}`),
  getUserVideos: (userId) => api.get(`/videos/user/${userId}`),
  getStreamUrl: (filename) => `${API_BASE}/videos/stream/${filename}`,
  getThumbnailUrl: (filename) => `http://localhost:5000/uploads/thumbnails/${filename}`,
  getComments: (id) => api.get(`/videos/${id}/comments`),
  addComment: (id, text) => api.post(`/videos/${id}/comments`, { text }),
};

// Users API
export const usersAPI = {
  getChannel: (id) => api.get(`/users/${id}/channel`),
  subscribe: (id) => api.post(`/users/${id}/subscribe`),
  isSubscribed: (id) => api.get(`/users/${id}/is-subscribed`),
  getWatchLater: () => api.get('/users/watch-later/all'),
  toggleWatchLater: (videoId) => api.post(`/users/watch-later/${videoId}`),
  checkWatchLater: (videoId) => api.get(`/users/watch-later/${videoId}/check`),
  getHistory: () => api.get('/users/history'),
  addToHistory: (videoId) => api.post(`/users/history/${videoId}`),
};

export default api;
