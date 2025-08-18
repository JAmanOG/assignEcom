import { Navigate } from 'react-router-dom';
import { authService } from '@/lib/auth';
import type { ProtectedRouteProps } from '@/types/type';
import { useEffect, useState } from 'react';

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [authorized, setAuthorized] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const user = await authService.getCurrentUser();
        if (!mounted) return;
        if (!user) {
          setAuthorized(false);
          setLoading(false);
          return;
        }
        setUserRole(user.role);
        if (requiredRole && user.role !== requiredRole) {
          setAuthorized(false);
        } else {
          setAuthorized(true);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false };
  }, [requiredRole]);

  if (loading) return null; // or a spinner
    
    // Redirect to appropriate dashboard based on user's role
    if (!authorized) {
      switch (userRole) {
        case 'ADMIN':
          return <Navigate to="/admin" replace />;
        case 'CUSTOMER':
          return <Navigate to="/shop" replace />;
        case 'DELIVERY':
          return <Navigate to="/delivery" replace />;
        default:
          return <Navigate to="/login" replace />;
      }
    }
  
  return <>{children}</>;
}