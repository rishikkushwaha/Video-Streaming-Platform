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
  deleteVideo: (id) => api.delete(`/videos/${id}`),
  getUserVideos: (userId) => api.get(`/videos/user/${userId}`),
  getStreamUrl: (filename) => `${API_BASE}/videos/stream/${filename}`,
  getThumbnailUrl: (filename) => `http://localhost:5000/uploads/thumbnails/${filename}`,
};

export default api;
