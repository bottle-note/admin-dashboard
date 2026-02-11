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
import { TastingTagDetailPage } from '@/pages/tasting-tags/TastingTagDetail';
import { BannerListPage } from '@/pages/banners/BannerList';
import { BannerDetailPage } from '@/pages/banners/BannerDetail';
import { BannerCreatePage } from '@/pages/banners/BannerCreate';
import { CurationListPage } from '@/pages/curations/CurationList';
import { CurationDetailPage } from '@/pages/curations/CurationDetail';
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
          path="whisky/new"
          element={
            <RoleProtectedRoute roles={['ROOT_ADMIN']}>
              <WhiskyDetailPage key="new" />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="whisky/:id"
          element={
            <RoleProtectedRoute roles={['ROOT_ADMIN']}>
              <WhiskyDetailPage key="edit" />
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
        <Route
          path="tasting-tags/new"
          element={
            <RoleProtectedRoute roles={['ROOT_ADMIN']}>
              <TastingTagDetailPage key="new" />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="tasting-tags/:id"
          element={
            <RoleProtectedRoute roles={['ROOT_ADMIN']}>
              <TastingTagDetailPage key="edit" />
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
        {/* Curations - ROOT_ADMIN only */}
        <Route
          path="curations"
          element={
            <RoleProtectedRoute roles={['ROOT_ADMIN']}>
              <CurationListPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="curations/new"
          element={
            <RoleProtectedRoute roles={['ROOT_ADMIN']}>
              <CurationDetailPage key="new" />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="curations/:id"
          element={
            <RoleProtectedRoute roles={['ROOT_ADMIN']}>
              <CurationDetailPage key="edit" />
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
