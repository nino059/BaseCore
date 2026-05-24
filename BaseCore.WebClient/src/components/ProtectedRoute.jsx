import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const getStoredUser = () => {
    try {
        const raw = localStorage.getItem('user') || sessionStorage.getItem('user');
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!raw || !token || token === 'undefined') return null;
        return JSON.parse(raw);
    } catch { return null; }
};

const ProtectedRoute = ({ children, adminOnly = false, artistOnly = false }) => {
    const { user, isAuthenticated, isAdmin, isArtist, loading } = useAuth();
    const location = useLocation();

    if (loading) return (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', flexDirection:'column', gap:16 }}>
            <div style={{ width:40, height:40, borderRadius:'50%', border:'4px solid #ede9fe', borderTopColor:'#7c3aed', animation:'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <span style={{ color:'#9ca3af', fontSize:'0.9rem' }}>Đang tải...</span>
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