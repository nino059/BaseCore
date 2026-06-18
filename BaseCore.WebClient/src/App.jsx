import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { AuthModalProvider, useAuthModal } from './contexts/AuthModalContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import AuthModal from './components/common/AuthModal';
import ErrorBoundary from './components/common/ErrorBoundary';

// Trang chủ + 404 nạp sẵn (eager) để first paint nhanh, không cần chờ chunk
import Home from './pages/public/Home';
import NotFound from './pages/public/NotFound';

// Các trang còn lại tách chunk riêng (lazy) → giảm kích thước bundle khởi tạo
// Public pages
const Shop          = lazy(() => import('./pages/public/Shop'));
const Cart          = lazy(() => import('./pages/public/Cart'));
const ProductDetail = lazy(() => import('./pages/public/ProductDetail'));
const Artists       = lazy(() => import('./pages/public/Artists'));
const ArtistDetail  = lazy(() => import('./pages/public/ArtistDetail'));
const Blog          = lazy(() => import('./pages/public/Blog'));
const BlogDetail    = lazy(() => import('./pages/public/BlogDetail'));

// User protected pages
const MyOrders          = lazy(() => import('./pages/user/MyOrders'));
const Profile           = lazy(() => import('./pages/user/Profile'));
const Checkout          = lazy(() => import('./pages/user/Checkout'));
const OrderConfirmation = lazy(() => import('./pages/user/OrderConfirmation'));
const OrderDetail       = lazy(() => import('./pages/public/OrderDetail'));

// Admin pages
const Dashboard      = lazy(() => import('./pages/admin/AdminDashboard'));
const Products       = lazy(() => import('./pages/admin/AdminProducts'));
const Orders         = lazy(() => import('./pages/admin/AdminOrders'));
const Users          = lazy(() => import('./pages/admin/UserManagement'));
const AdminBlogPosts = lazy(() => import('./pages/admin/AdminBlogPosts'));

// Artist pages
const ArtistDashboard = lazy(() => import('./pages/artist/ArtistDashboard'));
const ArtistProducts  = lazy(() => import('./pages/artist/ArtistProducts'));
const ArtistBlog      = lazy(() => import('./pages/artist/ArtistBlog'));
const ArtistOrders    = lazy(() => import('./pages/artist/ArtistOrders'));
const ArtistProfile   = lazy(() => import('./pages/artist/ArtistProfile'));

// Fallback hiển thị khi chunk của route đang được tải
function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-10 h-10 rounded-full border-4 border-[#ede9fe] border-t-[#7c3aed] animate-spin [animation-duration:0.8s]" />
      <span className="text-gray-400 text-[0.9rem]">Đang tải...</span>
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

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
      <ScrollToTop />
      <AuthModal />
      <Suspense fallback={<PageLoader />}>
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
      <Route path="/blog/:id"    element={<BlogDetail />} />

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
      <Route path="/my-orders/:orderId" element={
        <ProtectedRoute><OrderDetail /></ProtectedRoute>
      } />
      <Route path="/checkout" element={
        <ProtectedRoute><Checkout /></ProtectedRoute>
      } />
      <Route path="/order-confirmation/:orderId?" element={
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
      <Route path="/artist/orders/:orderId" element={
        <ProtectedRoute artistOnly><OrderDetail /></ProtectedRoute>
      } />
      <Route path="/artist/profile" element={
        <ProtectedRoute artistOnly><ArtistProfile /></ProtectedRoute>
      } />

      <Route path="/404" element={<NotFound />} />
      <Route path="*"    element={<Navigate to="/404" replace />} />
    </Routes>
    </Suspense>
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <AuthModalProvider>
            <ErrorBoundary>
              <AppRoutes />
            </ErrorBoundary>
          </AuthModalProvider>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
