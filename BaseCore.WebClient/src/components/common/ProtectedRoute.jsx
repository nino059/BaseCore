import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const getStoredUser = () => {
    try {
        const raw = localStorage.getItem('user') || sessionStorage.getItem('user');
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!raw || !token || token === 'undefined') return null;
        return JSON.parse(raw);
    } catch { return null; }
};

const ProtectedRoute = ({ children, adminOnly = false, artistOnly = false }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-screen gap-4">
            <div className="w-10 h-10 rounded-full border-4 border-[#ede9fe] border-t-[#7c3aed] animate-spin [animation-duration:0.8s]" />
            <span className="text-gray-400 text-[0.9rem]">Đang tải...</span>
        </div>
    );

    // Fallback: đọc từ storage nếu React state chưa kịp update (race condition sau login)
    const effectiveUser = user || getStoredUser();
    const effectiveRole = effectiveUser?.role || effectiveUser?.Role || '';
    const effectiveIsAdmin  = effectiveRole === 'Admin' || effectiveRole === 'Staff';
    const effectiveIsArtist = effectiveRole === 'Artist';

    if (!effectiveUser) {
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    // Artist-only route
    if (artistOnly && !effectiveIsArtist) {
        return <Navigate to="/" replace />;
    }

    // Admin-only route: non-admin/non-artist can't enter
    if (adminOnly && !effectiveIsAdmin) {
        return <Navigate to="/" replace />;
    }

    // Admin trying to access a regular user/artist page → send to dashboard
    if (!adminOnly && !artistOnly && effectiveIsAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default ProtectedRoute;