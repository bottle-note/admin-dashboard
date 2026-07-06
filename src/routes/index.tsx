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
import { CurationListPage as CurationOldListPage } from '@/pages/curation-old/CurationList';
import { CurationDetailPage as CurationOldDetailPage } from '@/pages/curation-old/CurationDetail';
import { CurationEntryPage } from '@/pages/curation/CurationEntry';
import { CurationListPage } from '@/pages/curation/CurationList';
import { CurationDetailPage } from '@/pages/curation/CurationDetail';
import { CurationWhiskyTastingEventCreatePage } from '@/pages/curation/whisky-tasting-event/CurationWhiskyTastingEventCreate';
import { WhiskyCurationCreatePage } from '@/pages/curation/whisky-curation/WhiskyCurationCreatePage';
import { CurationSpecCode } from '@/types/api';
import { InquiryListPage } from '@/pages/inquiries/InquiryList';
import { PolicyListPage } from '@/pages/policies/PolicyList';
import { UserListPage } from '@/pages/users/UserList';
import { ReviewListPage } from '@/pages/reviews/ReviewList';
import { DistilleryListPage } from '@/pages/distilleries/DistilleryList';
import { DistilleryDetailPage } from '@/pages/distilleries/DistilleryDetail';
import { RegionListPage } from '@/pages/regions/RegionList';
import { RegionDetailPage } from '@/pages/regions/RegionDetail';

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
        <Route
          path="dashboard/curations"
          element={
            <RoleProtectedRoute roles={['ROOT_ADMIN', 'BAR_OWNER', 'COMMUNITY_MANAGER']}>
              <CurationListPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="dashboard/curations/new"
          element={
            <RoleProtectedRoute roles={['ROOT_ADMIN', 'BAR_OWNER', 'COMMUNITY_MANAGER']}>
              <CurationEntryPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="dashboard/curations/tasting-events/new"
          element={
            <RoleProtectedRoute roles={['ROOT_ADMIN', 'BAR_OWNER', 'COMMUNITY_MANAGER']}>
              <CurationWhiskyTastingEventCreatePage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="dashboard/curations/general/new"
          element={
            <RoleProtectedRoute roles={['ROOT_ADMIN', 'BAR_OWNER', 'COMMUNITY_MANAGER']}>
              <WhiskyCurationCreatePage
                specCode={CurationSpecCode.RECOMMENDED_WHISKY}
                fallbackTitle="추천 위스키 작성"
              />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="dashboard/curations/pairings/new"
          element={
            <RoleProtectedRoute roles={['ROOT_ADMIN', 'BAR_OWNER', 'COMMUNITY_MANAGER']}>
              <WhiskyCurationCreatePage
                specCode={CurationSpecCode.WHISKY_PAIRING}
                fallbackTitle="위스키 페어링 작성"
              />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="dashboard/curations/:id"
          element={
            <RoleProtectedRoute roles={['ROOT_ADMIN', 'BAR_OWNER', 'COMMUNITY_MANAGER']}>
              <CurationDetailPage />
            </RoleProtectedRoute>
          }
        />

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
              <CurationOldListPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="curations/new"
          element={
            <RoleProtectedRoute roles={['ROOT_ADMIN']}>
              <CurationOldDetailPage key="new" />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="curations/:id"
          element={
            <RoleProtectedRoute roles={['ROOT_ADMIN']}>
              <CurationOldDetailPage key="edit" />
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

        {/* Distilleries - ROOT_ADMIN only */}
        <Route
          path="distilleries"
          element={
            <RoleProtectedRoute roles={['ROOT_ADMIN']}>
              <DistilleryListPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="distilleries/new"
          element={
            <RoleProtectedRoute roles={['ROOT_ADMIN']}>
              <DistilleryDetailPage key="new" />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="distilleries/:id"
          element={
            <RoleProtectedRoute roles={['ROOT_ADMIN']}>
              <DistilleryDetailPage key="edit" />
            </RoleProtectedRoute>
          }
        />

        {/* Regions - ROOT_ADMIN only */}
        <Route
          path="regions"
          element={
            <RoleProtectedRoute roles={['ROOT_ADMIN']}>
              <RegionListPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="regions/new"
          element={
            <RoleProtectedRoute roles={['ROOT_ADMIN']}>
              <RegionDetailPage key="new" />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="regions/:id"
          element={
            <RoleProtectedRoute roles={['ROOT_ADMIN']}>
              <RegionDetailPage key="edit" />
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

        {/* Reviews - ROOT_ADMIN only */}
        <Route
          path="reviews"
          element={
            <RoleProtectedRoute roles={['ROOT_ADMIN']}>
              <ReviewListPage />
            </RoleProtectedRoute>
          }
        />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
