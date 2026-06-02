import axios from 'axios';

// Lấy origin backend từ biến môi trường (.env: VITE_API_URL), fallback localhost khi dev
const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_BASE_URL = `${SERVER_URL}/api`;

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

// Đọc token từ localStorage (remember me) hoặc sessionStorage
api.interceptors.request.use(
    (config) => {
        let token = localStorage.getItem('token') || sessionStorage.getItem('token');
        // Bỏ qua token "undefined" (chuỗi) do session cũ lưu sai
        if (!token || token === 'undefined') {
            // Thử lấy từ object user đã normalize
            const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
            if (storedUser) {
                try {
                    const u = JSON.parse(storedUser);
                    token = u.token || u.Token || null;
                } catch { token = null; }
            }
        }
        if (token && token !== 'undefined') config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const url = error.config?.url || '';
        const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');
        if (error.response?.status === 401 && !isAuthEndpoint) {
            localStorage.removeItem('token'); localStorage.removeItem('user');
            sessionStorage.removeItem('token'); sessionStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const authApi = {
    login:    (username, password) => api.post('/auth/login', { username, password }),
    register: (data) => api.post('/auth/register', data),
};

export const userApi = {
    getAll:     (params)   => api.get('/users', { params }),
    getById:    (id)       => api.get(`/users/${id}`),
    getProfile: (id)       => api.get(`/users/${id}/profile`),
    getArtists: ()         => api.get('/users/artists'),
    create:     (data)     => api.post('/users', data),
    update:     (id, data) => api.put(`/users/${id}`, data),
    delete:     (id)       => api.delete(`/users/${id}`),

    uploadAvatar: (id, file) => {
        const form = new FormData();
        form.append('file', file);
        return api.post(`/users/${id}/avatar`, form, {
            headers: { 'Content-Type': undefined },
        });
    },
};

export const productApi = {
    getAll:  (params) => api.get('/products', { params }),
    search:  (params) => api.get('/products', { params }),
    getById: (id)     => api.get(`/products/${id}`),
    create:  (data)   => api.post('/products', data),
    update:  (id, data) => api.put(`/products/${id}`, data),
    delete:  (id)     => api.delete(`/products/${id}`),
    getByCategory: (categoryId) => api.get(`/products/category/${categoryId}`),

    // Admin actions
    approve:     (id)       => api.put(`/products/${id}/approve`),
    reject:      (id, note) => api.put(`/products/${id}/reject`,      { note }),

    // Artist actions
    restock:     (id)       => api.put(`/products/${id}/restock`),

    uploadImage: (file) => {
        const form = new FormData();
        form.append('file', file);
        return api.post('/products/upload-image', form, {
            headers: { 'Content-Type': undefined },
        });
    },
};

export const categoryApi = {
    getAll:      () => api.get('/categories'),
    getById:     (id) => api.get(`/categories/${id}`),
    getProducts: (id) => api.get(`/categories/${id}/products`),
    create:      (data) => api.post('/categories', data),
    update:      (id, data) => api.put(`/categories/${id}`, data),
    delete:      (id) => api.delete(`/categories/${id}`),
};

export const orderApi = {
    getAll:        (params) => api.get('/orders/all', { params }),
    getMyOrders:   (params) => api.get('/orders', { params }),
    getArtistOrders: ()     => api.get('/orders/artist'),
    create:        (data)   => api.post('/orders', data),
    getById:       (id)     => api.get(`/orders/${id}`),
    update:        (id, data) => api.put(`/orders/${id}`, data),
    updateStatus:  (id, status) => api.put(`/orders/${id}/status`, { status }),
    cancel:        (id)     => api.put(`/orders/${id}/cancel`),
    delete:        (id)     => api.delete(`/orders/${id}`),
};

export const blogApi = {
    getAll:   (params) => api.get('/blogposts', { params }),
    getById:  (id)     => api.get(`/blogposts/${id}`),
    create:   (data)   => api.post('/blogposts', data),
    update:   (id, data) => api.put(`/blogposts/${id}`, data),
    approve:  (id)     => api.put(`/blogposts/${id}/approve`),
    reject:   (id)     => api.put(`/blogposts/${id}/reject`),
    delete:   (id)     => api.delete(`/blogposts/${id}`),

    uploadImage: (file) => {
        const form = new FormData();
        form.append('file', file);
        return api.post('/products/upload-image', form, {
            headers: { 'Content-Type': undefined },
        });
    },
};

export const notificationApi = {
    getAll:         () => api.get('/notifications'),
    getUnreadCount: () => api.get('/notifications/unread-count'),
    markRead:       (id) => api.put(`/notifications/${id}/read`),
    markAllRead:    () => api.put('/notifications/read-all'),
};

export default api;