import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React from 'react';

// Context & Layout
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './pages/Cart';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';

// Public Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Shop from './pages/Shop';
import Cart from './pages/Cart';
import ProductDetail from './pages/ProductDetail';   // ← mới

// Customer Protected
import MyOrders from './pages/MyOrders';       
import Profile from './pages/Profile';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import NotFound from './pages/NotFound';

// Admin Pages
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Users from './pages/Users';
import Orders from './pages/Orders';

// ============================================================


function AppRoutes() {
  const { user, isAdmin } = useAuth();

  return (
    <Routes>

      {/* ===== PUBLIC ===== */}
      <Route path="/"           element={<Home />} />
      <Route path="/shop"       element={<Shop />} />
      <Route path="/shop/:id"   element={<ProductDetail />} />  {/* ← mới */}
      <Route path="/cart"       element={<Cart />} />
      <Route path="/login"      element={<Login />} />
      <Route path="/register"   element={<Register />} />

      {/* ===== CUSTOMER (đã đăng nhập) ===== */}
      <Route
        path="/my-orders"
        element={
          <ProtectedRoute>
            <MyOrders />
          </ProtectedRoute>
        }
      />

      {/* ===== ADMIN / SELLER ===== */}
      <Route path="/dashboard"  element={<ProtectedRoute><MainLayout><Dashboard /></MainLayout></ProtectedRoute>} />
      <Route path="/products"   element={<ProtectedRoute><MainLayout><Products /></MainLayout></ProtectedRoute>} />
      <Route path="/categories" element={<ProtectedRoute><MainLayout><Categories /></MainLayout></ProtectedRoute>} />
      <Route path="/users"      element={<ProtectedRoute adminOnly={true}><MainLayout><Users /></MainLayout></ProtectedRoute>} />
      <Route path="/orders"     element={<ProtectedRoute><MainLayout><Orders /></MainLayout></ProtectedRoute>} />

      {/* ===== FALLBACK ===== */}
      <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
      <Route path="/order-confirmation" element={<ProtectedRoute><OrderConfirmation /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
      <Route
        path="*"
        element={
          user
            ? (isAdmin() ? <Navigate to="/dashboard" replace /> : <Navigate to="/" replace />)
            : <Navigate to="/login" replace />
        }
      />

    </Routes>
  );
}

// ============================================================

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>        {/* bọc CartProvider để useCart() dùng được toàn app */}
          <AppRoutes />
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;