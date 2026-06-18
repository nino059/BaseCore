import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from './DashboardLayout';

const NAV = [
  { path: '/dashboard',  icon: 'fa-chart-bar',    label: 'Tổng quan' },
  { path: '/products',   icon: 'fa-palette',      label: 'Tác phẩm' },
  { path: '/admin/blog', icon: 'fa-pen-fancy',    label: 'Bài viết' },
  { path: '/orders',     icon: 'fa-shopping-bag', label: 'Đơn hàng' },
  { path: '/users',      icon: 'fa-users',        label: 'Người dùng', adminOnly: true },
];

const MainLayout = ({ children }) => {
  const { isAdmin } = useAuth();
  return (
    <DashboardLayout
      navItems={NAV.filter(item => !item.adminOnly || isAdmin)}
      panelLabel="Admin Panel"
      roleBadge={isAdmin ? 'Admin' : 'Staff'}
      breadcrumbRoot="Admin"
      defaultTitle="Trang quản trị"
      topbarRole={isAdmin ? 'Quản trị viên' : 'Nhân viên'}
      footerNote="All rights reserved."
      activeMatch="exact"
    >
      {children}
    </DashboardLayout>
  );
};

export default MainLayout;
