import { Navigate } from 'react-router';
import { useAuthStore } from '@/stores/auth';
import type { AdminRole } from '@/types/auth';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  roles: AdminRole[];
  fallback?: React.ReactNode;
}

export function RoleProtectedRoute({
  children,
  roles,
  fallback = <Navigate to="/" replace />,
}: RoleProtectedRouteProps) {
  const hasAnyRole = useAuthStore((state) => state.hasAnyRole);

  if (!hasAnyRole(roles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
