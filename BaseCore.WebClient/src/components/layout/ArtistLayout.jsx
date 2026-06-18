import React from 'react';
import DashboardLayout from './DashboardLayout';

const NAV = [
  { path: '/artist/dashboard', icon: 'fa-chart-bar',      label: 'Tổng quan' },
  { path: '/artist/products',  icon: 'fa-palette',        label: 'Tác phẩm' },
  { path: '/artist/blog',      icon: 'fa-pen-fancy',      label: 'Bài viết' },
  { path: '/artist/orders',    icon: 'fa-shopping-bag',   label: 'Đơn hàng' },
  { path: '/artist/profile',   icon: 'fa-user-circle',    label: 'Hồ sơ' },
];

const ArtistLayout = ({ children }) => (
  <DashboardLayout
    navItems={NAV}
    panelLabel="Artist Panel"
    roleBadge="Họa sĩ"
    breadcrumbRoot="Họa sĩ"
    defaultTitle="Không gian họa sĩ"
    topbarRole="Họa sĩ"
    footerNote="Không gian họa sĩ."
    activeMatch="prefix"
    profileLink={{ to: '/artist/profile', label: 'Chỉnh sửa hồ sơ' }}
  >
    {children}
  </DashboardLayout>
);

export default ArtistLayout;
