import React, { createContext, useContext, useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Chuẩn hóa user object: hỗ trợ cả PascalCase (cũ) và camelCase (mới)
    const normalizeUser = (raw) => {
        if (!raw) return null;
        return {
            userId:    raw.userId    || raw.UserId    || raw.id    || raw.Id    || '',
            username:  raw.username  || raw.Username  || raw.userName || raw.UserName || '',
            name:      raw.name      || raw.Name      || raw.fullName || raw.FullName || '',
            email:     raw.email     || raw.Email     || '',
            phone:     raw.phone     || raw.Phone     || '',
            role:      raw.role      || raw.Role      || '',
            avatarUrl: raw.avatarUrl || raw.AvatarUrl || raw.image  || raw.Image  || '',
            token:     raw.token     || raw.Token     || '',
            userType:  raw.userType  ?? raw.UserType  ?? 0,
            isActive:  raw.isActive  ?? raw.IsActive  ?? true,
        };
    };

    useEffect(() => {
        // Đọc cả localStorage (remember) và sessionStorage (không remember)
        const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (storedUser && token && token !== 'undefined') {
            try { setUser(normalizeUser(JSON.parse(storedUser))); } catch { }
        }
        setLoading(false);
    }, []);

    const login = async (username, password, remember = false) => {
        try {
            const response = await authApi.login(username, password);
            const userData = normalizeUser(response.data);
            const rawToken = response.data?.token || response.data?.Token || '';
            const storage = remember ? localStorage : sessionStorage;
            storage.setItem('token', rawToken);
            storage.setItem('user', JSON.stringify(userData));
            flushSync(() => setUser(userData));  // commit state trước khi navigate
            return { success: true, user: userData };
        } catch (error) {
            const message = error.response?.data?.message || 'Đăng nhập thất bại';
            return { success: false, message };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('cart');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        setUser(null);
    };

    const updateUser = (updates) => {
        setUser(u => {
            const newUser = { ...u, ...updates };
            const storage = localStorage.getItem('user') ? localStorage : sessionStorage;
            storage.setItem('user', JSON.stringify(newUser));
            return newUser;
        });
    };

    // ✅ isAdmin là BOOLEAN, không phải function
    const isAdmin  = user?.role === 'Admin' || user?.role === 'Staff';
    const isArtist = user?.role === 'Artist';

    const value = {
        user,
        login,
        logout,
        updateUser,
        isAdmin,           // boolean
        isArtist,          // boolean
        isAuthenticated: !!user,
        loading,
    };

    if (loading) return null;

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;