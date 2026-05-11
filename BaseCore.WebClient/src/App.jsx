import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './pages/user/Cart';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';

// Shared
import Login    from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

// User pages
import Home              from './pages/user/Home';
import Shop              from './pages/user/Shop';
import Cart              from './pages/user/Cart';
import ProductDetail     from './pages/user/ProductDetail';
import MyOrders          from './pages/user/MyOrders';
import Profile           from './pages/user/Profile';
import Checkout          from './pages/user/Checkout';
import OrderConfirmation from './pages/user/OrderConfirmation';
import Artists           from './pages/user/Artists';

// Admin pages
import Dashboard  from './pages/admin/Dashboard';
import Products   from './pages/admin/Products';
import Categories from './pages/admin/Categories';
import Orders     from './pages/admin/Orders';
import Users      from './pages/admin/Users';

function AppRoutes() {
  return (
    <Routes>
      {/* PUBLIC */}
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* USER PUBLIC */}
      <Route path="/"            element={<Home />} />
      <Route path="/shop"        element={<Shop />} />
      <Route path="/cart"        element={<Cart />} />
      <Route path="/product/:id" element={<ProductDetail />} />
      <Route path="/artists"     element={<Artists />} />

      {/* USER PROTECTED */}
      <Route path="/profile" element={
        <ProtectedRoute><Profile /></ProtectedRoute>
      } />
      <Route path="/my-orders" element={
        <ProtectedRoute><MyOrders /></ProtectedRoute>
      } />
      <Route path="/checkout" element={
        <ProtectedRoute><Checkout /></ProtectedRoute>
      } />
      <Route path="/order-confirmation" element={
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

      <Route path="/404" element={<NotFound />} />
      <Route path="*"    element={<Navigate to="/404" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <AppRoutes />
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;