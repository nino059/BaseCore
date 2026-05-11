import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export const paintingService = {

  getAll: (page = 1, limit = 200) =>
    api.get(`/products?page=${page}&pageSize=${limit}`).then(r => r.data),

  getById: (id) =>
    api.get(`/products/${id}`).then(r => r.data),

  getByCategory: (categoryId, page = 1, limit = 20) =>
    api.get(`/products?categoryId=${categoryId}&page=${page}&pageSize=${limit}`).then(r => r.data),

  search: (keyword, page = 1, limit = 20) =>
    api.get(`/products?search=${encodeURIComponent(keyword)}&page=${page}&pageSize=${limit}`).then(r => r.data),

  create: (data) =>
    api.post('/products', data).then(r => r.data),

  update: (id, data) =>
    api.put(`/products/${id}`, data).then(r => r.data),

  delete: (id) =>
    api.delete(`/products/${id}`).then(r => r.data),

  uploadImage: (id, formData) =>
    api.post(`/products/${id}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data),
};
