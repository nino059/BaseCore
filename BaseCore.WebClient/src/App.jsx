import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './pages/Cart';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';

import Login             from './pages/Login';
import Register          from './pages/Register';
import Home              from './pages/Home';
import Shop              from './pages/Shop';
import Cart              from './pages/Cart';
import ProductDetail     from './pages/ProductDetail';
import MyOrders          from './pages/MyOrders';
import Profile           from './pages/Profile';
import Checkout          from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import NotFound          from './pages/NotFound';
import Dashboard         from './pages/Dashboard';
import Products          from './pages/Products';
import Categories        from './pages/Categories';
import Users             from './pages/Users';
import Orders            from './pages/Orders';

function AppRoutes() {
  return (
    <Routes>
      {/* PUBLIC */}
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/"            element={<Home />} />
      <Route path="/shop"        element={<Shop />} />
      <Route path="/cart"        element={<Cart />} />
      <Route path="/product/:id" element={<ProductDetail />} />

      {/* CUSTOMER */}
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

      {/* ADMIN */}
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