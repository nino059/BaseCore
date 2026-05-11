import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Tự động gắn token vào mỗi request
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// ────────────────────────────────────────────
export const paintingService = {

  // Lấy tất cả tranh (có phân trang)
  getAll: (page = 1, limit = 200) =>
    api.get(`/paintings?page=${page}&limit=${limit}`)
      .then(r => r.data),

  // Lấy 1 tranh theo id
  getById: (id) =>
    api.get(`/paintings/${id}`)
      .then(r => r.data),

  // Lấy theo danh mục
  getByCategory: (categoryId, page = 1, limit = 20) =>
    api.get(`/paintings?categoryId=${categoryId}&page=${page}&limit=${limit}`)
      .then(r => r.data),

  // Tìm kiếm
  search: (keyword, page = 1, limit = 20) =>
    api.get(`/paintings?search=${encodeURIComponent(keyword)}&page=${page}&limit=${limit}`)
      .then(r => r.data),

  // ── Admin ──

  // Tạo tranh mới
  create: (data) =>
    api.post('/paintings', data)
      .then(r => r.data),

  // Cập nhật tranh
  update: (id, data) =>
    api.put(`/paintings/${id}`, data)
      .then(r => r.data),

  // Xóa tranh
  delete: (id) =>
    api.delete(`/paintings/${id}`)
      .then(r => r.data),

  // Upload ảnh (multipart/form-data)
  uploadImage: (id, formData) =>
    api.post(`/paintings/${id}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data),
};