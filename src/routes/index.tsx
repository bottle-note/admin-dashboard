/**
 * 라우트 설정
 */

import { Routes, Route, Navigate } from 'react-router';
import { useAuthStore } from '@/stores/auth';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { RoleProtectedRoute } from './RoleProtectedRoute';

// Pages
import { LoginPage } from '@/pages/Login';
import { DashboardPage } from '@/pages/Dashboard';
import { WhiskyListPage } from '@/pages/whisky/WhiskyList';
import { WhiskyDetailPage } from '@/pages/whisky/WhiskyDetail';
import { TastingTagListPage } from '@/pages/tasting-tags/TastingTagList';
import { BannerListPage } from '@/pages/banners/BannerList';
import { BannerDetailPage } from '@/pages/banners/BannerDetail';
import { BannerCreatePage } from '@/pages/banners/BannerCreate';
import { InquiryListPage } from '@/pages/inquiries/InquiryList';
import { PolicyListPage } from '@/pages/policies/PolicyList';
import { UserListPage } from '@/pages/users/UserList';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Routes with Admin Layout */}
      <Route
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard */}
        <Route index element={<DashboardPage />} />

        {/* Whisky - ROOT_ADMIN only */}
        <Route
          path="whisky"
          element={
            <RoleProtectedRoute roles={['ROOT_ADMIN']}>
              <WhiskyListPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="whisky/:id"
          element={
            <RoleProtectedRoute roles={['ROOT_ADMIN']}>
              <WhiskyDetailPage />
            </RoleProtectedRoute>
          }
        />

        {/* Tasting Tags - ROOT_ADMIN only */}
        <Route
          path="tasting-tags"
          element={
            <RoleProtectedRoute roles={['ROOT_ADMIN']}>
              <TastingTagListPage />
            </RoleProtectedRoute>
          }
        />

        {/* Banners - ROOT_ADMIN only */}
        <Route
          path="banners"
          element={
            <RoleProtectedRoute roles={['ROOT_ADMIN']}>
              <BannerListPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="banners/new"
          element={
            <RoleProtectedRoute roles={['ROOT_ADMIN']}>
              <BannerCreatePage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="banners/:id"
          element={
            <RoleProtectedRoute roles={['ROOT_ADMIN']}>
              <BannerDetailPage />
            </RoleProtectedRoute>
          }
        />

        {/* Inquiries - ROOT_ADMIN only */}
        <Route
          path="inquiries"
          element={
            <RoleProtectedRoute roles={['ROOT_ADMIN']}>
              <InquiryListPage />
            </RoleProtectedRoute>
          }
        />

        {/* Policies - ROOT_ADMIN only */}
        <Route
          path="policies"
          element={
            <RoleProtectedRoute roles={['ROOT_ADMIN']}>
              <PolicyListPage />
            </RoleProtectedRoute>
          }
        />

        {/* Users - ROOT_ADMIN only */}
        <Route
          path="users"
          element={
            <RoleProtectedRoute roles={['ROOT_ADMIN']}>
              <UserListPage />
            </RoleProtectedRoute>
          }
        />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
