import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';
import PublicLayout from './components/PublicLayout';
import Login from './pages/Login';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Users from './pages/Users';
import Orders from './pages/Orders';
import Shop from './pages/Shop';

function AppRoutes() {
  const { user, isAdmin } = useAuth();   // Lấy thông tin user

  return (
    <Routes>
      {/* ==================== PUBLIC ROUTES (Người mua) ==================== */}
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />  
        <Route path="/artists" element={<PublicLayout><div>Artists Page (đang xây dựng)</div></PublicLayout>} />
        <Route path="/cart" element={<PublicLayout><div>Cart Page (đang xây dựng)</div></PublicLayout>} />
        <Route path="/register" element={<PublicLayout><div>Register Page (đang xây dựng)</div></PublicLayout>} />

       {/* ==================== PROTECTED ROUTES (Admin/Seller) ==================== */}
       {/* Các route này sẽ được bảo vệ bởi ProtectedRoute, chỉ cho phép truy cập nếu đã đăng nhập */}
       {/* Nếu adminOnly={true} thì chỉ admin mới được truy cập */}
       {/* MainLayout sẽ cung cấp giao diện chung cho các trang admin/seller */}
       {/* Dashboard là trang tổng quan, Products/Categories/Users/Orders là các trang quản lý tương ứng */}
       {/* Các route này sẽ được hiển thị trong sidebar của MainLayout khi user có quyền truy cập */}
       {/* Nếu user chưa đăng nhập, sẽ bị redirect về /login */}
       {/* Nếu user đã đăng nhập nhưng không phải admin, sẽ bị redirect về trang chủ hoặc trang phù hợp */}
       {/* Nếu user đã đăng nhập và có quyền admin, sẽ được truy cập bình thường */}
       {/* Các route này sẽ được hiển thị trong sidebar của MainLayout khi user có quyền truy cập */}
       {/* Các route này sẽ được bảo vệ bởi ProtectedRoute, chỉ cho phép truy cập nếu đã đăng nhập */}
       {/* Nếu adminOnly={true} thì chỉ admin mới được truy cập */}
       {/* MainLayout sẽ cung cấp giao diện chung cho các trang admin/seller */}
       {/* Dashboard là trang tổng quan, Products/Categories/Users/Orders là các trang quản lý tương ứng */}
       {/* Các route này sẽ được hiển thị trong sidebar của MainLayout khi user có quyền truy cập */}
       {/* Nếu user chưa đăng nhập, sẽ bị redirect về /login */}
       {/* Nếu user đã đăng nhập nhưng không phải admin, sẽ bị redirect về trang chủ hoặc trang phù hợp */}
       {/* Nếu user đã đăng nhập và có quyền admin, sẽ được truy cập bình thường */}
       {/* Các route này sẽ được hiển thị trong sidebar của MainLayout khi user có quyền truy cập */}
       {/* Các route này sẽ được bảo vệ bởi ProtectedRoute, chỉ cho phép truy cập nếu đã đăng nhập */}
       {/* Nếu adminOnly={true} thì chỉ admin mới được truy cập */}
       {/* MainLayout sẽ cung cấp giao diện chung cho các trang admin/seller */}
       {/* Dashboard là trang tổng quan, Products/Categories/Users/Orders là các trang quản lý tương ứng */}
       {/* Các route này sẽ được hiển thị trong sidebar của MainLayout khi user có quyền truy cập */}
       {/* Nếu user chưa đăng nhập, sẽ bị redirect về /login */}
       {/* Nếu user đã đăng nhập nhưng không phải admin, sẽ bị redirect về trang chủ hoặc trang phù hợp */}
       {/* Nếu user đã đăng nhập và có quyền admin, sẽ được truy cập bình thường */}
       {/* Các route này sẽ được hiển thị trong sidebar của MainLayout khi user có quyền truy cập */}

      {/* ==================== REDIRECT THÔNG MINH ==================== */}
      {/* Route này sẽ bắt tất cả các đường dẫn không khớp ở trên */}
      {/* Nếu user đã đăng nhập, sẽ redirect về dashboard nếu là admin, hoặc về trang chủ nếu là user thường */}
      {/* Nếu user chưa đăng nhập, sẽ redirect về trang login */}
      {/* Điều này giúp đảm bảo rằng người dùng luôn được đưa đến trang phù hợp sau khi đăng nhập */}
      {/* Và cũng giúp ngăn chặn việc truy cập vào các trang không tồn tại hoặc không được phép */}


      {/* ==================== ADMIN / SELLER ROUTES ==================== */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      // Thêm import



    <Route path="/shop" element={<Shop />} />
      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Products />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/categories"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Categories />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute adminOnly={true}>
            <MainLayout>
              <Users />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Orders />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Login */}
      <Route path="/login" element={<Login />} />

      {/* Redirect thông minh sau khi login */}
      <Route path="*" element={
        user ? (
          isAdmin() ? <Navigate to="/dashboard" replace /> : <Navigate to="/" replace />
        ) : (
          <Navigate to="/login" replace />
        )
      } />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;