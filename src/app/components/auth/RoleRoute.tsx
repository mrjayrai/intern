import { Navigate, Outlet } from 'react-router-dom';
import { getStoredSession, type UserRole } from '../../lib/api';

type RoleRouteProps = {
  allowedRoles: UserRole[];
  redirectTo?: string;
};

export function RoleRoute({ allowedRoles, redirectTo = '/' }: RoleRouteProps) {
  const session = getStoredSession();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(session.user.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
