import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PublicLayout = ({ children }) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      {/* NAVBAR SANG TRỌNG */}
      <nav className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 py-6 flex justify-between items-center">
          <Link to="/" className="text-3xl font-semibold tracking-tighter text-gray-900">ArtVerse</Link>

          <div className="hidden md:flex items-center gap-9 text-sm font-medium">
            <Link to="/" className="hover:text-black transition">Trang chủ</Link>
            <Link to="/shop" className="hover:text-black transition">Cửa hàng</Link>
            <Link to="/artists" className="hover:text-black transition">Nghệ sĩ</Link>
            <Link to="/collections" className="hover:text-black transition">Bộ sưu tập</Link>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/cart" className="text-2xl hover:text-gray-700 transition">🛒</Link>

            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm">Xin chào, <strong>{user.name}</strong></span>
                <button 
                  onClick={logout}
                  className="text-sm px-6 py-2 border border-gray-300 rounded-full hover:bg-gray-100"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <Link 
                to="/login"
                className="px-8 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition font-medium"
              >
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </nav>

      {children}
    </div>
  );
};

export default PublicLayout;