import React, { createContext, useContext, useState, useEffect } from 'react';
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

    useEffect(() => {
        const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (storedUser && token) {
            try { setUser(JSON.parse(storedUser)); } catch { }
        }
        setLoading(false);
    }, []);

    // login duy nhất — hỗ trợ "Ghi nhớ đăng nhập"
    const login = async (username, password, remember = false) => {
        try {
            const response = await authApi.login(username, password);
            const userData = response.data;
            const storage = remember ? localStorage : sessionStorage;
            storage.setItem('token', userData.token);
            storage.setItem('user', JSON.stringify(userData));
            setUser(userData);
            return { success: true };
        } catch (error) {
            const message = error.response?.data?.message || 'Đăng nhập thất bại';
            return { success: false, message };
        }
    };

    const logout = () => {
        localStorage.removeItem('token'); localStorage.removeItem('user');
        sessionStorage.removeItem('token'); sessionStorage.removeItem('user');
        setUser(null);
    };

    const isAdmin = () => user?.role === 'Admin';

    const value = { user, login, logout, isAdmin, isAuthenticated: !!user, loading };

    if (loading) return null;

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;