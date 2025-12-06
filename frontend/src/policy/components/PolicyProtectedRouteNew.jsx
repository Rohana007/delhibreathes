import { Navigate, useLocation } from 'react-router-dom';

/**
 * Protected Route Component for Policy Pages
 * After login, trusts the JWT token (adminToken) stored in localStorage
 * Reports page is public and doesn't require authentication
 */
export default function PolicyProtectedRouteNew({ children }) {
  const location = useLocation();
  
  // Allow access to reports page without authentication
  if (location.pathname === '/policy-dashboard/reports' || location.pathname.endsWith('/reports')) {
    return children;
  }

  // After login, trust the JWT token (adminToken) - no need to check access codes
  // Only redirect if token is completely missing
  const adminToken = localStorage.getItem('adminToken');
  const authToken = localStorage.getItem('authToken');
  const policyAccess = localStorage.getItem('policyAccess');

  // If no token at all, redirect to login
  // Otherwise, trust the stored token (backend will validate it)
  if (!adminToken && !authToken && policyAccess !== 'true') {
    return <Navigate to="/policy-login" replace />;
  }

  return children;
}

