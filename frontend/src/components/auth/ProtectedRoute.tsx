import { Navigate } from 'react-router-dom';
import { authService } from '@/lib/auth';
import type { ProtectedRouteProps } from '@/types/type';

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const isAuthenticated = authService.isAuthenticated();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && !authService.hasRole(requiredRole)) {
    const user = authService.getCurrentUser();
    
    // Redirect to appropriate dashboard based on user's role
    switch (user?.role) {
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'customer':
        return <Navigate to="/shop" replace />;
      case 'delivery':
        return <Navigate to="/delivery" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return <>{children}</>;
}