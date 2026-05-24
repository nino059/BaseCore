import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { AuthModalProvider, useAuthModal } from './contexts/AuthModalContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';
import AuthModal from './components/AuthModal';

// Shared
import NotFound from './pages/NotFound';

// Public pages
import Home          from './pages/Home';
import Shop          from './pages/Shop';
import Cart          from './pages/Cart';
import ProductDetail from './pages/ProductDetail';
import Artists       from './pages/Artists';
import ArtistDetail  from './pages/ArtistDetail';
import Blog          from './pages/Blog';

// User protected pages
import MyOrders          from './pages/user/MyOrders';
import Profile           from './pages/user/Profile';
import Checkout          from './pages/user/Checkout';
import OrderConfirmation from './pages/user/OrderConfirmation';

// Admin pages
import Dashboard      from './pages/admin/AdminDashboard';
import Products       from './pages/admin/AdminProducts';
import Categories     from './pages/admin/AdminCategories';
import Orders         from './pages/admin/AdminOrders';
import Users          from './pages/admin/UserManagement';
import AdminBlogPosts from './pages/admin/AdminBlogPosts';

// Artist pages
import ArtistDashboard from './pages/artist/ArtistDashboard';
import ArtistProducts  from './pages/artist/ArtistProducts';
import ArtistBlog      from './pages/artist/ArtistBlog';
import ArtistOrders    from './pages/artist/ArtistOrders';
import ArtistProfile   from './pages/artist/ArtistProfile';

function AuthRedirect({ tab }) {
  const { openLogin, openRegister } = useAuthModal();
  const navigate = useNavigate();
  useEffect(() => {
    if (tab === 'register') openRegister(); else openLogin();
    if (window.history.length > 1) navigate(-1);
    else navigate('/', { replace: true });
  }, []); // eslint-disable-line
  return null;
}

function AppRoutes() {
  return (
    <>
      <AuthModal />
      <Routes>
        {/* /login và /register chuyển về modal */}
        <Route path="/login"    element={<AuthRedirect tab="login" />} />
        <Route path="/register" element={<AuthRedirect tab="register" />} />

      {/* USER PUBLIC */}
      <Route path="/"            element={<Home />} />
      <Route path="/shop"        element={<Shop />} />
      <Route path="/product/:id" element={<ProductDetail />} />
      <Route path="/artists"     element={<Artists />} />
      <Route path="/artists/:id" element={<ArtistDetail />} />
      <Route path="/blog"        element={<Blog />} />

      {/* USER PROTECTED */}
      <Route path="/cart" element={
        <ProtectedRoute><Cart /></ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute><Profile /></ProtectedRoute>
      } />
      <Route path="/my-orders" element={
        <ProtectedRoute><MyOrders /></ProtectedRoute>
      } />
      <Route path="/checkout" element={
        <ProtectedRoute><Checkout /></ProtectedRoute>
      } />
      <Route path="/order-confirmation/:orderId" element={
        <ProtectedRoute><OrderConfirmation /></ProtectedRoute>
      } />

      {/* ADMIN PROTECTED */}
      <Route path="/dashboard" element={
        <ProtectedRoute adminOnly>
          <MainLayout><Dashboard /></MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/products" element={
        <ProtectedRoute adminOnly>
          <MainLayout><Products /></MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/categories" element={
        <ProtectedRoute adminOnly>
          <MainLayout><Categories /></MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/orders" element={
        <ProtectedRoute adminOnly>
          <MainLayout><Orders /></MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/users" element={
        <ProtectedRoute adminOnly>
          <MainLayout><Users /></MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/blog" element={
        <ProtectedRoute adminOnly>
          <MainLayout><AdminBlogPosts /></MainLayout>
        </ProtectedRoute>
      } />

      {/* ARTIST PROTECTED */}
      <Route path="/artist/dashboard" element={
        <ProtectedRoute artistOnly><ArtistDashboard /></ProtectedRoute>
      } />
      <Route path="/artist/products" element={
        <ProtectedRoute artistOnly><ArtistProducts /></ProtectedRoute>
      } />
      <Route path="/artist/blog" element={
        <ProtectedRoute artistOnly><ArtistBlog /></ProtectedRoute>
      } />
      <Route path="/artist/orders" element={
        <ProtectedRoute artistOnly><ArtistOrders /></ProtectedRoute>
      } />
      <Route path="/artist/profile" element={
        <ProtectedRoute artistOnly><ArtistProfile /></ProtectedRoute>
      } />

      <Route path="/404" element={<NotFound />} />
      <Route path="*"    element={<Navigate to="/404" replace />} />
    </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <AuthModalProvider>
            <AppRoutes />
          </AuthModalProvider>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
